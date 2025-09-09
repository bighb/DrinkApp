import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshToken,
  logout,
  sendEmailVerification,
  verifyEmail,
  sendPasswordReset,
  resetPassword,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import {
  authenticate,
  checkAccountStatus,
  validateRefreshToken,
} from '../middlewares/auth.js';
import {
  registerValidation,
  loginValidation,
  passwordResetValidation,
  emailValidationRequest,
} from '../validators/auth.validators.js';

const router = express.Router();

// 认证相关的限流配置
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 最多20次请求
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 用户注册
router.post('/register', authLimiter, registerValidation, register);

// 用户登录
router.post('/login', authLimiter, loginValidation, login);

// 刷新令牌
router.post('/refresh', validateRefreshToken, refreshToken);

// 用户登出
router.post('/logout', authenticate, checkAccountStatus, logout);

// 发送邮箱验证
router.post('/send-email-verification', 
  authenticate, 
  checkAccountStatus, 
  generalLimiter, 
  sendEmailVerification
);

// 验证邮箱
router.get('/verify-email/:token', verifyEmail);

// 发送密码重置邮件
router.post('/send-password-reset', authLimiter, emailValidationRequest, sendPasswordReset);

// 重置密码
router.post('/reset-password', authLimiter, passwordResetValidation, resetPassword);

// 获取当前用户信息
router.get('/me', authenticate, checkAccountStatus, getCurrentUser);

export default router;