import { body, validationResult } from 'express-validator';
import AuthService from '../utils/auth.js';
import EmailService from '../utils/email.js';
import db from '../config/database.js';
import config from '../config/index.js';
import { businessLogger, errorLogger } from '../utils/logger.js';

class AuthController {
  // 用户注册
  static async register(req, res) {
    try {
      // 验证输入数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const {
        email,
        username,
        password,
        fullName,
        gender,
        dateOfBirth,
        height,
        weight,
        activityLevel
      } = req.body;

      // 检查邮箱和用户名是否已存在
      const existingUserQuery = `
        SELECT id, email, username 
        FROM users 
        WHERE (email = ? OR username = ?) AND deleted_at IS NULL
      `;
      
      const { rows: existingUsers } = await db.query(existingUserQuery, [email, username]);

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const conflictField = existingUser.email === email ? 'email' : 'username';
        
        return res.status(409).json({
          success: false,
          error: 'USER_ALREADY_EXISTS',
          message: `${conflictField === 'email' ? '邮箱' : '用户名'}已被注册`,
          field: conflictField,
        });
      }

      // 加密密码
      const passwordHash = await AuthService.hashPassword(password);

      // 计算默认饮水目标
      const defaultGoal = this.calculateDefaultWaterGoal({
        weight,
        height,
        activityLevel,
        gender
      });

      // 开始事务
      const result = await db.transaction(async (connection) => {
        // 插入用户记录
        const insertUserQuery = `
          INSERT INTO users (
            email, username, password_hash, full_name, gender, date_of_birth,
            height, weight, activity_level, daily_water_goal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [userResult] = await connection.execute(insertUserQuery, [
          email,
          username,
          passwordHash,
          fullName || null,
          gender || 'prefer_not_to_say',
          dateOfBirth || null,
          height || null,
          weight || null,
          activityLevel || 'moderately_active',
          defaultGoal
        ]);

        const userId = userResult.insertId;

        // 创建默认目标记录
        const insertGoalQuery = `
          INSERT INTO user_goals (user_id, target_value, start_date)
          VALUES (?, ?, CURDATE())
        `;

        await connection.execute(insertGoalQuery, [userId, defaultGoal]);

        // 创建默认提醒设置
        const insertReminderQuery = `
          INSERT INTO reminder_settings (user_id, strategy_type, is_enabled)
          VALUES (?, 'smart_adaptive', true)
        `;

        await connection.execute(insertReminderQuery, [userId]);

        return userId;
      });

      // 生成邮箱验证令牌
      const verificationToken = AuthService.generateEmailVerificationToken(result, email);

      // 发送验证邮件
      try {
        await EmailService.sendVerificationEmail(email, fullName || username, verificationToken);
      } catch (emailError) {
        errorLogger.external('email_service', emailError, { email, userId: result });
        // 邮件发送失败不影响注册流程
      }

      // 记录注册日志
      businessLogger.userAction(result, 'register', {
        email,
        username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        message: '注册成功，请查收邮箱验证邮件',
        data: {
          userId: result,
          email,
          username,
          verificationSent: true,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'REGISTRATION_ERROR',
        message: '注册过程中发生错误，请稍后重试',
      });
    }
  }

  // 用户登录
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const { login, password, deviceInfo } = req.body;

      // 查找用户（支持邮箱或用户名登录）
      const userQuery = `
        SELECT 
          id, email, username, password_hash, full_name, avatar_url,
          is_active, email_verified, is_premium, premium_expires_at,
          timezone, locale, created_at, last_login_at
        FROM users 
        WHERE (email = ? OR username = ?) AND deleted_at IS NULL
      `;

      const { rows: users } = await db.query(userQuery, [login, login]);

      if (users.length === 0) {
        // 记录登录失败日志
        businessLogger.securityEvent('login_failed', null, req.ip, { 
          login, 
          reason: 'user_not_found' 
        });

        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '邮箱/用户名或密码错误',
        });
      }

      const user = users[0];

      // 检查账户状态
      if (!user.is_active) {
        businessLogger.securityEvent('login_failed', user.id, req.ip, { 
          reason: 'account_inactive' 
        });

        return res.status(403).json({
          success: false,
          error: 'ACCOUNT_INACTIVE',
          message: '您的账户已被禁用，请联系客服',
        });
      }

      // 验证密码
      const isPasswordValid = await AuthService.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        businessLogger.securityEvent('login_failed', user.id, req.ip, { 
          reason: 'invalid_password' 
        });

        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '邮箱/用户名或密码错误',
        });
      }

      // 创建会话
      const sessionData = await AuthService.createSession(user.id, deviceInfo, req);

      // 获取用户统计信息
      const statsQuery = `
        SELECT 
          COUNT(*) as total_records,
          COALESCE(SUM(amount), 0) as total_intake,
          COUNT(DISTINCT DATE(recorded_at)) as active_days
        FROM hydration_records 
        WHERE user_id = ? AND deleted_at IS NULL
      `;

      const { rows: stats } = await db.query(statsQuery, [user.id]);
      const userStats = stats[0] || {};

      // 获取今日进度
      const todayQuery = `
        SELECT COALESCE(SUM(amount), 0) as today_intake
        FROM hydration_records 
        WHERE user_id = ? AND DATE(recorded_at) = CURDATE() AND deleted_at IS NULL
      `;

      const { rows: todayStats } = await db.query(todayQuery, [user.id]);
      const todayIntake = todayStats[0]?.today_intake || 0;

      // 返回用户信息（不包含敏感数据）
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        isPremium: user.is_premium,
        premiumExpiresAt: user.premium_expires_at,
        timezone: user.timezone,
        locale: user.locale,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        stats: {
          totalRecords: parseInt(userStats.total_records) || 0,
          totalIntake: parseInt(userStats.total_intake) || 0,
          activeDays: parseInt(userStats.active_days) || 0,
          todayIntake: parseInt(todayIntake),
        },
      };

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userData,
          tokens: {
            accessToken: sessionData.accessToken,
            refreshToken: sessionData.refreshToken,
            expiresAt: sessionData.expiresAt,
          },
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'LOGIN_ERROR',
        message: '登录过程中发生错误，请稍后重试',
      });
    }
  }

  // 刷新访问令牌
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      const tokenData = await AuthService.refreshAccessToken(refreshToken, req);

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);

      const statusCode = error.message.includes('过期') || error.message.includes('失效') ? 401 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: 'TOKEN_REFRESH_ERROR',
        message: error.message,
      });
    }
  }

  // 用户登出
  static async logout(req, res) {
    try {
      const sessionToken = req.session.session_token;

      await AuthService.removeSession(sessionToken);

      businessLogger.userAction(req.user.id, 'logout', {
        ip: req.ip,
        sessionId: sessionToken,
      });

      res.json({
        success: true,
        message: '登出成功',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'LOGOUT_ERROR',
        message: '登出过程中发生错误',
      });
    }
  }

  // 登出所有设备
  static async logoutAll(req, res) {
    try {
      await AuthService.removeAllUserSessions(req.user.id);

      res.json({
        success: true,
        message: '已从所有设备登出',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'LOGOUT_ALL_ERROR',
        message: '登出所有设备时发生错误',
      });
    }
  }

  // 获取活跃会话列表
  static async getSessions(req, res) {
    try {
      const sessions = await AuthService.getUserActiveSessions(req.user.id);

      res.json({
        success: true,
        data: {
          sessions,
          currentSessionId: req.session.session_token,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_SESSIONS_ERROR',
        message: '获取会话列表失败',
      });
    }
  }

  // 撤销指定会话
  static async revokeSession(req, res) {
    try {
      const { sessionToken } = req.params;
      
      // 检查会话是否属于当前用户
      const session = await AuthService.validateSession(sessionToken);
      
      if (!session || session.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: '会话不存在',
        });
      }

      await AuthService.removeSession(sessionToken);

      businessLogger.userAction(req.user.id, 'revoke_session', {
        revokedSessionId: sessionToken,
        currentSessionId: req.session.session_token,
      });

      res.json({
        success: true,
        message: '会话已撤销',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'REVOKE_SESSION_ERROR',
        message: '撤销会话失败',
      });
    }
  }

  // 发送邮箱验证邮件
  static async sendVerificationEmail(req, res) {
    try {
      if (req.user.email_verified) {
        return res.status(400).json({
          success: false,
          error: 'ALREADY_VERIFIED',
          message: '邮箱已经验证过了',
        });
      }

      const verificationToken = AuthService.generateEmailVerificationToken(
        req.user.id, 
        req.user.email
      );

      await EmailService.sendVerificationEmail(
        req.user.email, 
        req.user.full_name || req.user.username, 
        verificationToken
      );

      businessLogger.userAction(req.user.id, 'send_verification_email');

      res.json({
        success: true,
        message: '验证邮件已发送，请查收邮箱',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'SEND_VERIFICATION_ERROR',
        message: '发送验证邮件失败，请稍后重试',
      });
    }
  }

  // 验证邮箱
  static async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const decoded = AuthService.verifyEmailVerificationToken(token);

      // 查找用户
      const userQuery = 'SELECT id, email, email_verified FROM users WHERE id = ? AND email = ?';
      const { rows: users } = await db.query(userQuery, [decoded.userId, decoded.email]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在或邮箱不匹配',
        });
      }

      const user = users[0];

      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          error: 'ALREADY_VERIFIED',
          message: '邮箱已经验证过了',
        });
      }

      // 更新验证状态
      await db.query(
        'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ?',
        [user.id]
      );

      businessLogger.userAction(user.id, 'verify_email', {
        email: decoded.email,
      });

      res.json({
        success: true,
        message: '邮箱验证成功',
      });

    } catch (error) {
      errorLogger.api(error, req);

      const statusCode = error.message.includes('过期') || error.message.includes('无效') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: 'EMAIL_VERIFICATION_ERROR',
        message: error.message,
      });
    }
  }

  // 发送密码重置邮件
  static async sendPasswordResetEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const { email } = req.body;

      // 查找用户
      const userQuery = 'SELECT id, email, full_name, username FROM users WHERE email = ? AND deleted_at IS NULL';
      const { rows: users } = await db.query(userQuery, [email]);

      // 为了安全考虑，不管用户是否存在都返回成功消息
      if (users.length === 0) {
        return res.json({
          success: true,
          message: '如果该邮箱已注册，我们已发送密码重置链接',
        });
      }

      const user = users[0];

      const resetToken = AuthService.generatePasswordResetToken(user.id, user.email);

      await EmailService.sendPasswordResetEmail(
        user.email,
        user.full_name || user.username,
        resetToken
      );

      businessLogger.userAction(user.id, 'request_password_reset', {
        ip: req.ip,
      });

      res.json({
        success: true,
        message: '如果该邮箱已注册，我们已发送密码重置链接',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'SEND_RESET_EMAIL_ERROR',
        message: '发送重置邮件失败，请稍后重试',
      });
    }
  }

  // 重置密码
  static async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const { token, newPassword } = req.body;

      const decoded = AuthService.verifyPasswordResetToken(token);

      // 查找用户
      const userQuery = 'SELECT id, email FROM users WHERE id = ? AND email = ?';
      const { rows: users } = await db.query(userQuery, [decoded.userId, decoded.email]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在或邮箱不匹配',
        });
      }

      const user = users[0];

      // 加密新密码
      const passwordHash = await AuthService.hashPassword(newPassword);

      // 更新密码并清除所有会话
      await db.transaction(async (connection) => {
        // 更新密码
        await connection.execute(
          'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
          [passwordHash, user.id]
        );

        // 清除所有活跃会话（强制重新登录）
        await connection.execute(
          'UPDATE user_sessions SET is_active = false WHERE user_id = ?',
          [user.id]
        );
      });

      businessLogger.userAction(user.id, 'reset_password', {
        ip: req.ip,
      });

      res.json({
        success: true,
        message: '密码重置成功，请使用新密码登录',
      });

    } catch (error) {
      errorLogger.api(error, req);

      const statusCode = error.message.includes('过期') || error.message.includes('无效') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: 'PASSWORD_RESET_ERROR',
        message: error.message,
      });
    }
  }

  // 计算默认饮水目标
  static calculateDefaultWaterGoal({ weight, height, activityLevel, gender }) {
    let baseGoal = config.business.defaultDailyGoal; // 默认2000ml

    if (weight) {
      // 基础计算：每公斤体重30-35ml
      baseGoal = Math.round(weight * 32);
    }

    // 根据活动水平调整
    const activityMultipliers = {
      sedentary: 1.0,
      lightly_active: 1.1,
      moderately_active: 1.2,
      very_active: 1.3,
      extremely_active: 1.5,
    };

    const multiplier = activityMultipliers[activityLevel] || 1.2;
    baseGoal = Math.round(baseGoal * multiplier);

    // 限制在合理范围内
    return Math.max(1500, Math.min(baseGoal, 4000));
  }
}

// 输入验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名长度为3-20个字符，只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码至少8位，包含大小写字母和数字'),
  body('fullName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  body('height')
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage('身高应在100-250cm之间'),
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('体重应在30-300kg之间'),
];

const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('请输入邮箱或用户名'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
];

const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('缺少重置令牌'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码至少8位，包含大小写字母和数字'),
];

export {
  AuthController,
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
};

export default AuthController;