import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getReminderSettings,
  updateReminderSettings,
  getReminderHistory,
  triggerReminder,
  respondToReminder,
  getSmartReminderSuggestions,
  getReminderStatistics,
  updateDeviceToken,
  disableDevice,
  testReminder,
} from '../controllers/reminder.controller.js';
import {
  authenticate,
  checkAccountStatus,
  requirePermission,
} from '../middlewares/auth.js';
import {
  updateReminderSettingsValidation,
  testReminderValidation,
  respondToReminderValidation,
  updateDeviceTokenValidation,
} from '../validators/reminder.validators.js';
import { 
  paginationValidation,
  reminderIdValidation 
} from '../validators/common.validators.js';

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

// 提醒触发限流配置
const reminderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 最多10次手动提醒
  message: {
    success: false,
    error: 'REMINDER_RATE_LIMIT',
    message: '提醒触发过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 设备操作限流配置
const deviceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 最多20次设备操作
  message: {
    success: false,
    error: 'DEVICE_RATE_LIMIT',
    message: '设备操作过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 所有提醒路由都需要认证
router.use(authenticate);
router.use(checkAccountStatus);

// 获取提醒设置
router.get('/settings', getReminderSettings);

// 更新提醒设置
router.put('/settings', generalLimiter, updateReminderSettingsValidation, updateReminderSettings);

// 获取提醒历史记录
router.get('/history', paginationValidation, getReminderHistory);

// 手动触发提醒
router.post('/trigger', reminderLimiter, testReminderValidation, triggerReminder);

// 响应提醒（用户点击提醒后的反馈）
router.post('/:reminderId/respond', reminderIdValidation, respondToReminderValidation, respondToReminder);

// 获取智能提醒建议
router.get('/smart-suggestions', getSmartReminderSuggestions);

// 获取提醒统计信息
router.get('/statistics', getReminderStatistics);

// 更新设备令牌（用于推送通知）
router.post('/device-token', deviceLimiter, updateDeviceTokenValidation, updateDeviceToken);

// 禁用设备推送
router.post('/device/disable', disableDevice);

// 测试提醒推送
router.post('/test', 
  reminderLimiter, 
  requirePermission('test_reminders'), 
  testReminder
);

export default router;