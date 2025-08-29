import AuthService from '../utils/auth.js';
import db from '../config/database.js';
import { errorLogger, businessLogger } from '../utils/logger.js';

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: '缺少访问令牌',
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证访问令牌
    let decoded;
    try {
      decoded = AuthService.verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: error.message,
      });
    }

    // 验证会话是否有效
    const session = await AuthService.validateSession(decoded.sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: '会话已失效，请重新登录',
      });
    }

    // 获取用户信息
    const cacheKey = `user:${decoded.userId}`;
    let user = await db.getCache(cacheKey);

    if (!user) {
      // 从数据库查询用户信息
      const query = `
        SELECT 
          id, email, username, full_name, avatar_url, is_active, 
          is_premium, premium_expires_at, timezone, locale,
          created_at, updated_at, last_login_at
        FROM users 
        WHERE id = ? AND is_active = true AND deleted_at IS NULL
      `;

      const { rows: users } = await db.query(query, [decoded.userId]);

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在或已被禁用',
        });
      }

      user = users[0];

      // 缓存用户信息
      await db.setCache(cacheKey, user, 1800); // 30分钟缓存
    }

    // 检查高级功能访问权限
    user.hasPermission = (feature) => {
      if (user.is_premium) {
        // 检查会员是否过期
        const now = new Date();
        const expiresAt = new Date(user.premium_expires_at);
        return expiresAt > now;
      }
      
      // 基础功能权限检查
      const basicFeatures = [
        'basic_recording',
        'basic_statistics',
        'basic_reminders',
        'basic_goals'
      ];
      
      return basicFeatures.includes(feature);
    };

    // 将用户信息和会话信息添加到请求对象
    req.user = user;
    req.session = session;
    req.token = {
      access: token,
      refresh: session.refresh_token,
    };

    // 更新最后活跃时间（异步执行，不阻塞请求）
    setImmediate(async () => {
      try {
        await db.query(
          'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );
        
        await db.query(
          'UPDATE user_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE session_token = ?',
          [session.session_token]
        );
      } catch (error) {
        errorLogger.database(error, 'update_last_active', { userId: user.id });
      }
    });

    next();

  } catch (error) {
    errorLogger.api(error, req);
    
    return res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: '身份验证过程中发生错误',
    });
  }
};

// 可选认证中间件（允许匿名访问，但如果有令牌则验证）
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有令牌，继续处理（匿名用户）
    req.user = null;
    req.session = null;
    return next();
  }

  // 有令牌，执行认证
  return authenticate(req, res, next);
};

// 权限检查中间件
const requirePermission = (feature) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: '需要登录才能访问此功能',
      });
    }

    if (!req.user.hasPermission(feature)) {
      businessLogger.securityEvent('permission_denied', req.user.id, req.ip, { feature });
      
      return res.status(403).json({
        success: false,
        error: 'PERMISSION_DENIED',
        message: '您没有权限访问此功能',
        feature,
        upgradeRequired: !req.user.is_premium,
      });
    }

    next();
  };
};

// 管理员权限中间件
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: '需要管理员权限',
    });
  }

  try {
    // 检查用户是否为管理员（这里简化处理，实际应用中可以有更复杂的角色系统）
    const query = 'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"';
    const { rows: roles } = await db.query(query, [req.user.id]);

    if (roles.length === 0) {
      businessLogger.securityEvent('admin_access_denied', req.user.id, req.ip);
      
      return res.status(403).json({
        success: false,
        error: 'ADMIN_REQUIRED',
        message: '需要管理员权限',
      });
    }

    req.user.isAdmin = true;
    next();

  } catch (error) {
    errorLogger.database(error, 'check_admin_permission', { userId: req.user.id });
    
    return res.status(500).json({
      success: false,
      error: 'PERMISSION_CHECK_ERROR',
      message: '权限检查失败',
    });
  }
};

// 验证刷新令牌中间件
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REFRESH_TOKEN',
        message: '缺少刷新令牌',
      });
    }

    // 验证刷新令牌格式
    try {
      AuthService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: error.message,
      });
    }

    req.refreshToken = refreshToken;
    next();

  } catch (error) {
    errorLogger.api(error, req);
    
    return res.status(500).json({
      success: false,
      error: 'TOKEN_VALIDATION_ERROR',
      message: '刷新令牌验证失败',
    });
  }
};

// 用户自我授权中间件（确保用户只能操作自己的数据）
const requireSelfOrAdmin = (userIdParam = 'userId') => {
  return async (req, res, next) => {
    const targetUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID',
        message: '缺少用户ID参数',
      });
    }

    // 检查是否为用户本人或管理员
    const isSelf = parseInt(targetUserId) === req.user.id;
    const isAdmin = req.user.isAdmin || false;

    if (!isSelf && !isAdmin) {
      businessLogger.securityEvent('unauthorized_access', req.user.id, req.ip, { 
        targetUserId, 
        action: req.method + ' ' + req.route?.path 
      });

      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: '您只能操作自己的数据',
      });
    }

    req.targetUserId = parseInt(targetUserId);
    req.isSelfOperation = isSelf;
    next();
  };
};

// 限制未验证用户的中间件
const requireEmailVerification = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'EMAIL_NOT_VERIFIED',
      message: '请先验证您的邮箱地址',
      verificationRequired: true,
    });
  }

  next();
};

// 账户状态检查中间件
const checkAccountStatus = (req, res, next) => {
  if (!req.user.is_active) {
    businessLogger.securityEvent('inactive_account_access', req.user.id, req.ip);
    
    return res.status(403).json({
      success: false,
      error: 'ACCOUNT_INACTIVE',
      message: '您的账户已被禁用，请联系客服',
    });
  }

  next();
};

// API密钥认证中间件（用于外部API访问）
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'MISSING_API_KEY',
        message: '缺少API密钥',
      });
    }

    // 验证API密钥（这里简化处理）
    const query = 'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = true AND expires_at > NOW()';
    const { rows: keys } = await db.query(query, [apiKey]);

    if (keys.length === 0) {
      businessLogger.securityEvent('invalid_api_key', null, req.ip, { apiKey: apiKey.substring(0, 8) + '...' });
      
      return res.status(401).json({
        success: false,
        error: 'INVALID_API_KEY',
        message: '无效的API密钥',
      });
    }

    const keyInfo = keys[0];
    
    // 更新使用统计
    setImmediate(async () => {
      try {
        await db.query(
          'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = ?',
          [keyInfo.id]
        );
      } catch (error) {
        errorLogger.database(error, 'update_api_key_usage', { keyId: keyInfo.id });
      }
    });

    req.apiKey = keyInfo;
    next();

  } catch (error) {
    errorLogger.api(error, req);
    
    return res.status(500).json({
      success: false,
      error: 'API_KEY_VALIDATION_ERROR',
      message: 'API密钥验证失败',
    });
  }
};

export {
  authenticate,
  optionalAuth,
  requirePermission,
  requireAdmin,
  validateRefreshToken,
  requireSelfOrAdmin,
  requireEmailVerification,
  checkAccountStatus,
  authenticateApiKey,
};