import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import db from '../config/database.js';
import { logger, businessLogger, errorLogger } from './logger.js';

class AuthService {
  // 密码哈希
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(config.bcrypt.rounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      errorLogger.external('bcrypt', error, { action: 'hash_password' });
      throw new Error('密码加密失败');
    }
  }

  // 验证密码
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      errorLogger.external('bcrypt', error, { action: 'verify_password' });
      return false;
    }
  }

  // 生成访问令牌
  static generateAccessToken(payload) {
    try {
      return jwt.sign(
        {
          ...payload,
          type: 'access',
          iat: Math.floor(Date.now() / 1000),
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.expiresIn,
          issuer: 'hydration-tracker',
          audience: 'hydration-tracker-users',
        }
      );
    } catch (error) {
      errorLogger.external('jwt', error, {
        action: 'generate_access_token',
        payload,
      });
      throw new Error('访问令牌生成失败');
    }
  }

  // 生成刷新令牌
  static generateRefreshToken(payload) {
    try {
      return jwt.sign(
        {
          ...payload,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
        },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn,
          issuer: 'hydration-tracker',
          audience: 'hydration-tracker-users',
        }
      );
    } catch (error) {
      errorLogger.external('jwt', error, {
        action: 'generate_refresh_token',
        payload,
      });
      throw new Error('刷新令牌生成失败');
    }
  }

  // 验证访问令牌
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'hydration-tracker',
        audience: 'hydration-tracker-users',
      });

      if (decoded.type !== 'access') {
        throw new Error('无效的令牌类型');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的令牌');
      } else {
        throw error;
      }
    }
  }

  // 验证刷新令牌
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'hydration-tracker',
        audience: 'hydration-tracker-users',
      });

      if (decoded.type !== 'refresh') {
        throw new Error('无效的令牌类型');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('刷新令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的刷新令牌');
      } else {
        throw error;
      }
    }
  }

  // 创建用户会话
  static async createSession(userId, deviceInfo, req) {
    try {
      const sessionToken = uuidv4();
      const refreshToken = this.generateRefreshToken({
        userId,
        sessionId: sessionToken,
      });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

      // 获取地理位置信息（这里简化处理）
      const locationInfo = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        // 可以集成IP地址地理位置服务
      };

      // 插入会话记录
      const query = `
        INSERT INTO user_sessions 
        (user_id, device_id, session_token, refresh_token, expires_at, ip_address, user_agent, location_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.query(query, [
        userId,
        deviceInfo?.id || null,
        sessionToken,
        refreshToken,
        expiresAt,
        req.ip,
        req.headers['user-agent'],
        JSON.stringify(locationInfo),
      ]);

      // 生成访问令牌
      const accessToken = this.generateAccessToken({
        userId,
        sessionId: sessionToken,
      });

      // 记录登录日志
      businessLogger.userAction(userId, 'login', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: sessionToken,
      });

      return {
        accessToken,
        refreshToken,
        sessionToken,
        expiresAt,
      };
    } catch (error) {
      errorLogger.database(error, 'create_session', { userId, deviceInfo });
      throw new Error('创建用户会话失败');
    }
  }

  // 刷新令牌
  static async refreshAccessToken(refreshToken, req) {
    try {
      // 验证刷新令牌
      const decoded = this.verifyRefreshToken(refreshToken);

      // 查找会话
      const query = `
        SELECT us.*, u.is_active, u.deleted_at
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.refresh_token = ? AND us.is_active = true
      `;

      const { rows: sessions } = await db.query(query, [refreshToken]);

      if (sessions.length === 0) {
        throw new Error('会话不存在或已失效');
      }

      const session = sessions[0];

      // 检查用户状态
      if (!session.is_active || session.deleted_at) {
        throw new Error('用户账户已被禁用');
      }

      // 检查会话是否过期
      if (new Date(session.expires_at) < new Date()) {
        // 删除过期会话
        await this.removeSession(session.session_token);
        throw new Error('会话已过期');
      }

      // 生成新的访问令牌
      const accessToken = this.generateAccessToken({
        userId: session.user_id,
        sessionId: session.session_token,
      });

      // 更新会话最后使用时间
      await db.query(
        'UPDATE user_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE session_token = ?',
        [session.session_token]
      );

      // 记录刷新日志
      businessLogger.userAction(session.user_id, 'token_refresh', {
        ip: req.ip,
        sessionId: session.session_token,
      });

      return {
        accessToken,
        refreshToken, // 返回原刷新令牌
        expiresAt: session.expires_at,
      };
    } catch (error) {
      errorLogger.api(error, req);
      throw error;
    }
  }

  // 验证会话
  static async validateSession(sessionToken) {
    try {
      const query = `
        SELECT us.*, u.is_active, u.deleted_at
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.session_token = ? AND us.is_active = true
      `;

      const { rows: sessions } = await db.query(query, [sessionToken]);

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];

      // 检查用户状态
      if (!session.is_active || session.deleted_at) {
        return null;
      }

      // 检查会话是否过期
      if (new Date(session.expires_at) < new Date()) {
        // 删除过期会话
        await this.removeSession(sessionToken);
        return null;
      }

      return session;
    } catch (error) {
      errorLogger.database(error, 'validate_session', { sessionToken });
      return null;
    }
  }

  // 移除会话
  static async removeSession(sessionToken) {
    try {
      await db.query(
        'UPDATE user_sessions SET is_active = false WHERE session_token = ?',
        [sessionToken]
      );

      // 从Redis缓存中删除会话信息
      await db.deleteCache(`session:${sessionToken}`);

      return true;
    } catch (error) {
      errorLogger.database(error, 'remove_session', { sessionToken });
      return false;
    }
  }

  // 移除用户的所有会话（登出所有设备）
  static async removeAllUserSessions(userId) {
    try {
      // 获取所有活跃会话
      const query =
        'SELECT session_token FROM user_sessions WHERE user_id = ? AND is_active = true';
      const { rows: sessions } = await db.query(query, [userId]);

      // 禁用所有会话
      await db.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = ?',
        [userId]
      );

      // 从Redis缓存中删除所有会话
      const deletePromises = sessions.map(session =>
        db.deleteCache(`session:${session.session_token}`)
      );
      await Promise.all(deletePromises);

      businessLogger.userAction(userId, 'logout_all_devices');

      return true;
    } catch (error) {
      errorLogger.database(error, 'remove_all_user_sessions', { userId });
      return false;
    }
  }

  // 清理过期会话
  static async cleanupExpiredSessions() {
    try {
      const query = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true
      `;

      const { rows } = await db.query(query);

      if (rows.affectedRows > 0) {
        logger.info(`清理了 ${rows.affectedRows} 个过期会话`);
      }

      return rows.affectedRows;
    } catch (error) {
      errorLogger.database(error, 'cleanup_expired_sessions');
      return 0;
    }
  }

  // 获取用户活跃会话
  static async getUserActiveSessions(userId) {
    try {
      const query = `
        SELECT 
          us.session_token,
          us.created_at,
          us.last_used_at,
          us.expires_at,
          us.ip_address,
          us.user_agent,
          us.location_info,
          ud.device_name,
          ud.device_type,
          ud.platform
        FROM user_sessions us
        LEFT JOIN user_devices ud ON us.device_id = ud.id
        WHERE us.user_id = ? AND us.is_active = true
        ORDER BY us.last_used_at DESC
      `;

      const { rows: sessions } = await db.query(query, [userId]);

      return sessions.map(session => ({
        sessionToken: session.session_token,
        createdAt: session.created_at,
        lastUsedAt: session.last_used_at,
        expiresAt: session.expires_at,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        locationInfo: session.location_info
          ? JSON.parse(session.location_info)
          : null,
        device: {
          name: session.device_name,
          type: session.device_type,
          platform: session.platform,
        },
      }));
    } catch (error) {
      errorLogger.database(error, 'get_user_active_sessions', { userId });
      return [];
    }
  }

  // 生成密码重置令牌
  static generatePasswordResetToken(userId, email) {
    try {
      return jwt.sign(
        {
          userId,
          email,
          type: 'password_reset',
          iat: Math.floor(Date.now() / 1000),
        },
        config.jwt.secret,
        {
          expiresIn: '1h', // 1小时有效期
          issuer: 'hydration-tracker',
          audience: 'hydration-tracker-users',
        }
      );
    } catch (error) {
      errorLogger.external('jwt', error, {
        action: 'generate_reset_token',
        userId,
        email,
      });
      throw new Error('重置令牌生成失败');
    }
  }

  // 验证密码重置令牌
  static verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'hydration-tracker',
        audience: 'hydration-tracker-users',
      });

      if (decoded.type !== 'password_reset') {
        throw new Error('无效的令牌类型');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('重置令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的重置令牌');
      } else {
        throw error;
      }
    }
  }

  // 生成邮箱验证令牌
  static generateEmailVerificationToken(userId, email) {
    try {
      return jwt.sign(
        {
          userId,
          email,
          type: 'email_verification',
          iat: Math.floor(Date.now() / 1000),
        },
        config.jwt.secret,
        {
          expiresIn: '24h', // 24小时有效期
          issuer: 'hydration-tracker',
          audience: 'hydration-tracker-users',
        }
      );
    } catch (error) {
      errorLogger.external('jwt', error, {
        action: 'generate_verification_token',
        userId,
        email,
      });
      throw new Error('验证令牌生成失败');
    }
  }

  // 验证邮箱验证令牌
  static verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'hydration-tracker',
        audience: 'hydration-tracker-users',
      });

      if (decoded.type !== 'email_verification') {
        throw new Error('无效的令牌类型');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('验证令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的验证令牌');
      } else {
        throw error;
      }
    }
  }
}

export default AuthService;
