import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { join, extname } from 'node:path';
import {
  UserController,
  updateProfileValidation,
  changePasswordValidation,
  deleteAccountValidation,
  statisticsValidation
} from '../controllers/userController.js';
import {
  authenticate,
  requireEmailVerification,
  checkAccountStatus
} from '../middlewares/auth.js';

const router = express.Router();

// 通用限流配置
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 敏感操作限流配置
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次尝试
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '敏感操作过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(process.cwd(), 'uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPG, PNG, GIF, WebP 格式的图片'));
    }
  }
});

// 所有用户路由都需要认证
router.use(authenticate);
router.use(checkAccountStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     UserStatistics:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: integer
 *         totalIntake:
 *           type: integer
 *         activeDays:
 *           type: integer
 *         todayIntake:
 *           type: integer
 *         currentStreak:
 *           type: integer
 *         bestStreak:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: 获取用户资料
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户资料获取成功
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
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     personalInfo:
 *                       type: object
 *                       properties:
 *                         gender:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                         height:
 *                           type: number
 *                         weight:
 *                           type: number
 *                         activityLevel:
 *                           type: string
 *                     goals:
 *                       type: object
 *                       properties:
 *                         dailyWaterGoal:
 *                           type: integer
 *                         wakeUpTime:
 *                           type: string
 *                         sleepTime:
 *                           type: string
 *                     settings:
 *                       type: object
 *                       properties:
 *                         timezone:
 *                           type: string
 *                         locale:
 *                           type: string
 *                         dataSharingEnabled:
 *                           type: boolean
 *                         analyticsEnabled:
 *                           type: boolean
 *                     account:
 *                       type: object
 *                       properties:
 *                         emailVerified:
 *                           type: boolean
 *                         isPremium:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     statistics:
 *                       $ref: '#/components/schemas/UserStatistics'
 *                     recentRecords:
 *                       type: array
 *                       items:
 *                         type: object
 *                     weeklyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户不存在
 */
router.get('/profile', generalLimiter, UserController.getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: 更新用户资料
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 maxLength: 50
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               height:
 *                 type: number
 *                 minimum: 100
 *                 maximum: 250
 *               weight:
 *                 type: number
 *                 minimum: 30
 *                 maximum: 300
 *               activityLevel:
 *                 type: string
 *                 enum: [sedentary, lightly_active, moderately_active, very_active, extremely_active]
 *               dailyWaterGoal:
 *                 type: integer
 *                 minimum: 500
 *                 maximum: 5000
 *               wakeUpTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               sleepTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               timezone:
 *                 type: string
 *               locale:
 *                 type: string
 *               dataSharingEnabled:
 *                 type: boolean
 *               analyticsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 用户资料更新成功
 *       400:
 *         description: 输入验证失败
 *       401:
 *         description: 未授权
 */
router.put('/profile', generalLimiter, updateProfileValidation, UserController.updateProfile);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: 修改密码
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: 新密码（至少8位，包含大小写字母和数字）
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       400:
 *         description: 当前密码错误或新密码格式无效
 *       401:
 *         description: 未授权
 */
router.post('/change-password', sensitiveLimiter, changePasswordValidation, UserController.changePassword);

/**
 * @swagger
 * /api/v1/users/avatar:
 *   post:
 *     summary: 上传头像
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 头像图片文件（JPG, PNG, GIF, WebP，最大5MB）
 *     responses:
 *       200:
 *         description: 头像上传成功
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
 *                     avatarUrl:
 *                       type: string
 *       400:
 *         description: 文件格式不支持或文件过大
 *       401:
 *         description: 未授权
 */
router.post('/avatar', generalLimiter, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: '文件大小不能超过5MB',
        });
      }
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: 'FILE_UPLOAD_ERROR',
        message: err.message,
      });
    }
    next();
  });
}, UserController.uploadAvatar);

/**
 * @swagger
 * /api/v1/users/avatar:
 *   delete:
 *     summary: 删除头像
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 头像删除成功
 *       401:
 *         description: 未授权
 */
router.delete('/avatar', generalLimiter, UserController.deleteAvatar);

/**
 * @swagger
 * /api/v1/users/statistics:
 *   get:
 *     summary: 获取用户统计数据
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: week
 *         description: 统计时间范围
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（与period二选一）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（与period二选一）
 *     responses:
 *       200:
 *         description: 统计数据获取成功
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
 *                     period:
 *                       type: string
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                         endDate:
 *                           type: string
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         totalIntake:
 *                           type: integer
 *                         averagePerRecord:
 *                           type: number
 *                         activeDays:
 *                           type: integer
 *                     goals:
 *                       type: object
 *                       properties:
 *                         currentGoal:
 *                           type: integer
 *                         achievementRate:
 *                           type: number
 *                         achievedDays:
 *                           type: integer
 *                         currentStreak:
 *                           type: integer
 *                         bestStreak:
 *                           type: integer
 *                     distribution:
 *                       type: object
 *                       properties:
 *                         drinkTypes:
 *                           type: object
 *                         timeOfDay:
 *                           type: object
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: 未授权
 */
router.get('/statistics', generalLimiter, statisticsValidation, UserController.getStatistics);

/**
 * @swagger
 * /api/v1/users/delete-account:
 *   post:
 *     summary: 注销账户
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmDelete
 *             properties:
 *               password:
 *                 type: string
 *                 description: 当前密码
 *               confirmDelete:
 *                 type: string
 *                 enum: [DELETE_ACCOUNT]
 *                 description: 确认删除文本，必须为 "DELETE_ACCOUNT"
 *     responses:
 *       200:
 *         description: 账户删除成功
 *       400:
 *         description: 密码错误或确认文本不正确
 *       401:
 *         description: 未授权
 */
router.post('/delete-account', sensitiveLimiter, deleteAccountValidation, UserController.deleteAccount);

export default router;