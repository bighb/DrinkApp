import { validationResult } from 'express-validator';
import * as AuthModel from '../models/auth.model.js';
import * as UserModel from '../models/user.model.js';
import AuthService from '../utils/auth.js';
import EmailService from '../utils/email.js';
import config from '../config/index.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import moment from 'moment-timezone';

/**
 * 认证控制器 - 函数式风格
 */

// 用户注册
export const register = async (req, res) => {
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
      activityLevel,
    } = req.body;

    // 检查邮箱和用户名是否已存在
    const existingUser = await AuthModel.findUserByEmailOrUsername(
      email,
      username
    );
    if (existingUser) {
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

    // 准备用户数据
    const userData = {
      email,
      username,
      password_hash: passwordHash,
      full_name: fullName || null,
      gender: gender || 'prefer_not_to_say',
      date_of_birth: dateOfBirth || null,
      height: height || null,
      weight: weight || null,
      activity_level: activityLevel || 'moderately_active',
    };

    // 使用事务创建用户及默认设置
    const userId = await AuthModel.registerUserWithDefaults(userData);

    // 生成访问令牌
    const tokens = await AuthService.generateTokens(userId);

    // 创建会话记录
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['x-platform'] || 'web',
      appVersion: req.headers['x-app-version'] || '1.0.0',
    };

    const sessionData = {
      user_id: userId,
      session_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      device_info: deviceInfo,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: moment()
        .add(config.jwt.accessTokenExpiry, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss'),
    };

    await AuthModel.createSession(sessionData);

    // 发送欢迎邮件（异步）
    if (config.email.enabled) {
      EmailService.sendWelcomeEmail(email, fullName || username).catch(
        error => {
          errorLogger.api(error, req);
        }
      );
    }

    businessLogger.info('User registered successfully', {
      userId,
      email,
      username,
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: userId,
          email,
          username,
          fullName: fullName || null,
        },
        tokens,
      },
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'REGISTRATION_FAILED',
      message: '注册失败，请稍后重试',
    });
  }
};

// 用户登录
export const login = async (req, res) => {
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

    const { login, password, rememberMe } = req.body;

    // 加密密码进行验证
    const passwordHash = await AuthService.hashPassword(password);
    const user = await AuthModel.validateUserCredentials(login, passwordHash);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: '邮箱/用户名或密码错误',
      });
    }

    // 更新最后登录时间
    await AuthModel.updateLastLoginTime(user.id);

    // 生成令牌
    const expiryMinutes = rememberMe
      ? config.jwt.refreshTokenExpiry
      : config.jwt.accessTokenExpiry;
    const tokens = await AuthService.generateTokens(user.id, expiryMinutes);

    // 创建会话记录
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['x-platform'] || 'web',
      appVersion: req.headers['x-app-version'] || '1.0.0',
    };

    const sessionData = {
      user_id: user.id,
      session_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      device_info: deviceInfo,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: moment()
        .add(expiryMinutes, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss'),
    };

    await AuthModel.createSession(sessionData);

    // 获取用户统计摘要
    const userStats = await AuthModel.getUserStatsSummary(user.id);

    businessLogger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          emailVerified: user.email_verified,
          ...userStats,
        },
        tokens,
      },
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'LOGIN_FAILED',
      message: '登录失败，请稍后重试',
    });
  }
};

// 刷新令牌
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'REFRESH_TOKEN_REQUIRED',
        message: '刷新令牌不能为空',
      });
    }

    // 验证刷新令牌
    const decoded = await AuthService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: '刷新令牌无效或已过期',
      });
    }

    // 生成新的令牌对
    const newTokens = await AuthService.generateTokens(decoded.userId);
    const newExpiresAt = moment()
      .add(config.jwt.accessTokenExpiry, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');

    // 更新会话记录
    await AuthModel.refreshSession(
      refreshToken,
      newTokens.accessToken,
      newTokens.refreshToken,
      newExpiresAt
    );

    businessLogger.info('Token refreshed successfully', {
      userId: decoded.userId,
    });

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { tokens: newTokens },
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'TOKEN_REFRESH_FAILED',
      message: '令牌刷新失败',
    });
  }
};

// 用户登出
export const logout = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    const { logoutAllDevices } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'SESSION_TOKEN_REQUIRED',
        message: '会话令牌不能为空',
      });
    }

    if (logoutAllDevices) {
      // 注销用户所有会话
      await AuthModel.removeAllUserSessions(req.user.id);
      businessLogger.info('User logged out from all devices', {
        userId: req.user.id,
      });
    } else {
      // 注销当前会话
      await AuthModel.removeSession(sessionToken);
      businessLogger.info('User logged out', { userId: req.user.id });
    }

    res.json({
      success: true,
      message: logoutAllDevices ? '已从所有设备注销' : '注销成功',
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'LOGOUT_FAILED',
      message: '注销失败',
    });
  }
};

// 发送邮箱验证
export const sendEmailVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await AuthModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_ALREADY_VERIFIED',
        message: '邮箱已经验证过了',
      });
    }

    // 生成验证令牌
    const verificationToken =
      await AuthService.generateEmailVerificationToken(userId);

    // 发送验证邮件
    if (config.email.enabled) {
      await EmailService.sendEmailVerification(user.email, verificationToken);
    }

    businessLogger.info('Email verification sent', {
      userId,
      email: user.email,
    });

    res.json({
      success: true,
      message: '验证邮件已发送',
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'EMAIL_VERIFICATION_FAILED',
      message: '发送验证邮件失败',
    });
  }
};

// 验证邮箱
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // 验证令牌
    const decoded = await AuthService.verifyEmailVerificationToken(token);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_VERIFICATION_TOKEN',
        message: '验证令牌无效或已过期',
      });
    }

    // 更新邮箱验证状态
    await AuthModel.updateEmailVerification(decoded.userId, true);

    businessLogger.info('Email verified successfully', {
      userId: decoded.userId,
    });

    res.json({
      success: true,
      message: '邮箱验证成功',
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'EMAIL_VERIFICATION_FAILED',
      message: '邮箱验证失败',
    });
  }
};

// 发送密码重置邮件
export const sendPasswordReset = async (req, res) => {
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

    const user = await AuthModel.findUserByEmailOrUsername(email, email);
    if (!user) {
      // 为了安全，不暴露用户是否存在
      return res.json({
        success: true,
        message: '如果该邮箱已注册，您将收到重置密码的邮件',
      });
    }

    // 生成重置令牌
    const resetToken = await AuthService.generatePasswordResetToken();
    const expiresAt = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

    // 保存重置令牌
    await AuthModel.createPasswordResetToken(user.id, resetToken, expiresAt);

    // 发送重置邮件
    if (config.email.enabled) {
      await EmailService.sendPasswordReset(user.email, resetToken);
    }

    businessLogger.info('Password reset email sent', {
      userId: user.id,
      email,
    });

    res.json({
      success: true,
      message: '如果该邮箱已注册，您将收到重置密码的邮件',
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: '发送重置邮件失败',
    });
  }
};

// 重置密码
export const resetPassword = async (req, res) => {
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

    // 验证重置令牌
    const tokenData = await AuthModel.validatePasswordResetToken(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESET_TOKEN',
        message: '重置令牌无效或已过期',
      });
    }

    // 加密新密码
    const passwordHash = await AuthService.hashPassword(newPassword);

    // 更新密码
    await AuthModel.updatePassword(tokenData.user_id, passwordHash);

    // 标记令牌为已使用
    await AuthModel.markResetTokenAsUsed(token);

    // 注销用户所有会话（强制重新登录）
    await AuthModel.removeAllUserSessions(tokenData.user_id);

    businessLogger.info('Password reset successfully', {
      userId: tokenData.user_id,
    });

    res.json({
      success: true,
      message: '密码重置成功，请重新登录',
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: '密码重置失败',
    });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await UserModel.getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    // 获取今日统计
    const todayStats = await UserModel.getTodayStatistics(userId);

    res.json({
      success: true,
      data: {
        user: {
          ...userProfile,
          ...todayStats,
        },
      },
    });
  } catch (error) {
    errorLogger.api(error, req);
    res.status(500).json({
      success: false,
      error: 'GET_USER_FAILED',
      message: '获取用户信息失败',
    });
  }
};
