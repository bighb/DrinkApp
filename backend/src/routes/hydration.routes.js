import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  addRecord,
  getRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  addBatchRecords,
  getTodayProgress,
  getStatistics,
} from '../controllers/hydration.controller.js';
import {
  authenticate,
  checkAccountStatus,
  requirePermission,
} from '../middlewares/auth.js';
import {
  addRecordValidation,
  addBatchRecordsValidation,
  updateRecordValidation,
  getRecordsValidation,
} from '../validators/hydration.validators.js';
import { 
  paginationValidation, 
  recordIdValidation 
} from '../validators/common.validators.js';

const router = express.Router();

// 通用限流配置
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 最多200次请求（记录操作比较频繁）
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 记录创建限流配置（防止恶意刷记录）
const recordCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 最多20次记录创建
  message: {
    success: false,
    error: 'RECORD_CREATE_RATE_LIMIT',
    message: '记录创建过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 批量操作限流配置
const batchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次批量操作
  message: {
    success: false,
    error: 'BATCH_RATE_LIMIT',
    message: '批量操作过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 所有饮水记录路由都需要认证
router.use(authenticate);
router.use(checkAccountStatus);

// 添加饮水记录
router.post('/', recordCreateLimiter, addRecordValidation, addRecord);

// 批量添加饮水记录
router.post('/batch', 
  batchLimiter, 
  requirePermission('batch_operations'),
  addBatchRecordsValidation, 
  addBatchRecords
);

// 获取饮水记录列表
router.get('/', generalLimiter, paginationValidation, getRecordsValidation, getRecords);

// 获取今日饮水进度
router.get('/today-progress', getTodayProgress);

// 获取饮水统计信息
router.get('/statistics', getStatistics);

// 获取单条饮水记录
router.get('/:recordId', recordIdValidation, getRecord);

// 更新饮水记录
router.put('/:recordId', generalLimiter, recordIdValidation, updateRecordValidation, updateRecord);

// 删除饮水记录
router.delete('/:recordId', recordIdValidation, deleteRecord);

export default router;