import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  AuthController,
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation
} from '../controllers/authController.js';
import {
  validateRefreshToken
} from '../middlewares/auth.js';

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

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: 访问令牌
 *         refreshToken:
 *           type: string
 *           description: 刷新令牌
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: 令牌过期时间
 *     
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         username:
 *           type: string
 *         fullName:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         emailVerified:
 *           type: boolean
 *         isPremium:
 *           type: boolean
 *         timezone:
 *           type: string
 *         locale:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: 密码（至少8位，包含大小写字母和数字）
 *               fullName:
 *                 type: string
 *                 maxLength: 50
 *                 description: 真实姓名
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *                 description: 性别
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: 出生日期
 *               height:
 *                 type: number
 *                 minimum: 100
 *                 maximum: 250
 *                 description: 身高(cm)
 *               weight:
 *                 type: number
 *                 minimum: 30
 *                 maximum: 300
 *                 description: 体重(kg)
 *               activityLevel:
 *                 type: string
 *                 enum: [sedentary, lightly_active, moderately_active, very_active, extremely_active]
 *                 description: 活动水平
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     verificationSent:
 *                       type: boolean
 *       409:
 *         description: 用户已存在
 *       400:
 *         description: 输入验证失败
 */
router.post('/register', authLimiter, registerValidation, AuthController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: 邮箱或用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *               deviceInfo:
 *                 type: object
 *                 description: 设备信息
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   platform:
 *                     type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: 登录失败
 *       403:
 *         description: 账户被禁用
 */
router.post('/login', authLimiter, loginValidation, AuthController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: 刷新令牌无效或过期
 */
router.post('/refresh', generalLimiter, validateRefreshToken, AuthController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: 未授权
 */
router.post('/logout', generalLimiter, AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: 从所有设备登出
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 全部登出成功
 *       401:
 *         description: 未授权
 */
router.post('/logout-all', generalLimiter, AuthController.logoutAll);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     summary: 获取活跃会话列表
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 会话列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sessionToken:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastUsedAt:
 *                             type: string
 *                             format: date-time
 *                           ipAddress:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           device:
 *                             type: object
 *                     currentSessionId:
 *                       type: string
 */
router.get('/sessions', generalLimiter, AuthController.getSessions);

/**
 * @swagger
 * /api/v1/auth/sessions/{sessionToken}:
 *   delete:
 *     summary: 撤销指定会话
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话令牌
 *     responses:
 *       200:
 *         description: 会话撤销成功
 *       404:
 *         description: 会话不存在
 *       401:
 *         description: 未授权
 */
router.delete('/sessions/:sessionToken', generalLimiter, AuthController.revokeSession);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: 发送邮箱验证邮件
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 验证邮件发送成功
 *       400:
 *         description: 邮箱已验证
 *       401:
 *         description: 未授权
 */
router.post('/verify-email', generalLimiter, AuthController.sendVerificationEmail);

/**
 * @swagger
 * /api/v1/auth/verify-email/confirm:
 *   post:
 *     summary: 确认邮箱验证
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 验证令牌
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *       400:
 *         description: 令牌无效或已过期
 */
router.post('/verify-email/confirm', generalLimiter, AuthController.verifyEmail);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: 发送密码重置邮件
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *     responses:
 *       200:
 *         description: 重置邮件发送成功（无论邮箱是否存在）
 *       400:
 *         description: 输入验证失败
 */
router.post('/forgot-password', authLimiter, emailValidation, AuthController.sendPasswordResetEmail);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: 重置密码
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: 重置令牌
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: 新密码（至少8位，包含大小写字母和数字）
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 令牌无效或已过期
 */
router.post('/reset-password', authLimiter, resetPasswordValidation, AuthController.resetPassword);

export default router;