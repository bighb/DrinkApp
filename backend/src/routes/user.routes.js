import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getUserProfile,
  updateUserProfile,
  getUserStatistics,
  updateWaterGoal,
  changePassword,
  uploadAvatar,
  removeAvatar,
  getUserPreferences,
  exportUserData,
  deleteAccount,
} from '../controllers/user.controller.js';
import {
  authenticate,
  checkAccountStatus,
  requirePermission,
} from '../middlewares/auth.js';
import {
  updateProfileValidation,
  updateWaterGoalValidation,
  changePasswordValidation,
  avatarUploadValidation,
} from '../validators/user.validators.js';

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

// 所有用户路由都需要认证
router.use(authenticate);
router.use(checkAccountStatus);

// 获取用户资料
router.get('/profile', getUserProfile);

// 更新用户资料
router.put('/profile', generalLimiter, updateProfileValidation, updateUserProfile);

// 获取用户统计信息
router.get('/statistics', getUserStatistics);

// 更新饮水目标
router.put('/goal', generalLimiter, updateWaterGoalValidation, updateWaterGoal);

// 修改密码
router.put('/password', sensitiveLimiter, changePasswordValidation, changePassword);

// 上传头像
router.post('/avatar', generalLimiter, avatarUploadValidation, uploadAvatar);

// 删除头像
router.delete('/avatar', removeAvatar);

// 获取用户偏好分析
router.get('/preferences', getUserPreferences);

// 导出用户数据
router.get('/export', generalLimiter, exportUserData);

// 删除用户账户
router.delete('/account', 
  sensitiveLimiter, 
  requirePermission('delete_account'), 
  deleteAccount
);

export default router;