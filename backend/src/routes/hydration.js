import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  HydrationController,
  addRecordValidation,
  getRecordsValidation,
  recordIdValidation,
  updateRecordValidation,
  batchRecordsValidation,
} from '../controllers/hydrationController.js';
import {
  authenticate,
  checkAccountStatus,
  requirePermission,
} from '../middlewares/auth.js';

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

// 所有饮水记录路由都需要认证
router.use(authenticate);
router.use(checkAccountStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     HydrationRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         amount:
 *           type: integer
 *           minimum: 50
 *           maximum: 2000
 *         drinkType:
 *           type: string
 *           enum: [water, tea, coffee, juice, sports_drink, soda, alcohol, other]
 *         drinkName:
 *           type: string
 *         recordedAt:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         activityContext:
 *           type: string
 *           enum: [work, exercise, meal, wake_up, before_sleep, break, other]
 *         temperature:
 *           type: string
 *           enum: [hot, warm, room, cold, iced]
 *         source:
 *           type: string
 *           enum: [manual, quick_add, reminder_response, smart_cup, api_import]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/hydration/records:
 *   post:
 *     summary: 添加饮水记录
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 2000
 *                 description: 饮水量(ml)
 *               drinkType:
 *                 type: string
 *                 enum: [water, tea, coffee, juice, sports_drink, soda, alcohol, other]
 *                 default: water
 *                 description: 饮品类型
 *               drinkName:
 *                 type: string
 *                 maxLength: 100
 *                 description: 具体饮品名称
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *                 description: 记录的饮水时间（默认为当前时间）
 *               location:
 *                 type: string
 *                 maxLength: 100
 *                 description: 地点标签
 *               activityContext:
 *                 type: string
 *                 enum: [work, exercise, meal, wake_up, before_sleep, break, other]
 *                 description: 活动场景
 *               temperature:
 *                 type: string
 *                 enum: [hot, warm, room, cold, iced]
 *                 default: room
 *                 description: 温度
 *               deviceId:
 *                 type: string
 *                 description: 设备标识
 *     responses:
 *       201:
 *         description: 记录添加成功
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
 *                     recordId:
 *                       type: integer
 *                     amount:
 *                       type: integer
 *                     drinkType:
 *                       type: string
 *                     recordedAt:
 *                       type: string
 *                     todayProgress:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         goal:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                         remaining:
 *                           type: integer
 *                         records:
 *                           type: integer
 *       400:
 *         description: 输入验证失败或达到每日限制
 *       401:
 *         description: 未授权
 */
router.post(
  '/records',
  recordCreateLimiter,
  requirePermission('basic_recording'),
  addRecordValidation,
  HydrationController.addRecord
);

/**
 * @swagger
 * /api/v1/hydration/records:
 *   get:
 *     summary: 获取饮水记录列表
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: drinkType
 *         schema:
 *           type: string
 *           enum: [water, tea, coffee, juice, sports_drink, soda, alcohol, other]
 *         description: 饮品类型过滤
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [recorded_at, amount, drink_type, created_at]
 *           default: recorded_at
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 记录列表获取成功
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
 *                     records:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HydrationRecord'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalRecords:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *       401:
 *         description: 未授权
 */
router.get(
  '/records',
  generalLimiter,
  getRecordsValidation,
  HydrationController.getRecords
);

/**
 * @swagger
 * /api/v1/hydration/records/{recordId}:
 *   get:
 *     summary: 获取单个记录详情
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 记录ID
 *     responses:
 *       200:
 *         description: 记录详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HydrationRecord'
 *       404:
 *         description: 记录不存在
 *       401:
 *         description: 未授权
 */
router.get(
  '/records/:recordId',
  generalLimiter,
  recordIdValidation,
  HydrationController.getRecord
);

/**
 * @swagger
 * /api/v1/hydration/records/{recordId}:
 *   put:
 *     summary: 更新饮水记录
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 记录ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 2000
 *               drinkType:
 *                 type: string
 *                 enum: [water, tea, coffee, juice, sports_drink, soda, alcohol, other]
 *               drinkName:
 *                 type: string
 *                 maxLength: 100
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               activityContext:
 *                 type: string
 *                 enum: [work, exercise, meal, wake_up, before_sleep, break, other]
 *               temperature:
 *                 type: string
 *                 enum: [hot, warm, room, cold, iced]
 *     responses:
 *       200:
 *         description: 记录更新成功
 *       400:
 *         description: 输入验证失败
 *       404:
 *         description: 记录不存在
 *       401:
 *         description: 未授权
 */
router.put(
  '/records/:recordId',
  generalLimiter,
  updateRecordValidation,
  HydrationController.updateRecord
);

/**
 * @swagger
 * /api/v1/hydration/records/{recordId}:
 *   delete:
 *     summary: 删除饮水记录
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 记录ID
 *     responses:
 *       200:
 *         description: 记录删除成功
 *       404:
 *         description: 记录不存在
 *       401:
 *         description: 未授权
 */
router.delete(
  '/records/:recordId',
  generalLimiter,
  recordIdValidation,
  HydrationController.deleteRecord
);

/**
 * @swagger
 * /api/v1/hydration/records/batch:
 *   post:
 *     summary: 批量添加饮水记录
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - amount
 *                   properties:
 *                     amount:
 *                       type: integer
 *                       minimum: 50
 *                       maximum: 2000
 *                     drinkType:
 *                       type: string
 *                       enum: [water, tea, coffee, juice, sports_drink, soda, alcohol, other]
 *                       default: water
 *                     drinkName:
 *                       type: string
 *                       maxLength: 100
 *                     recordedAt:
 *                       type: string
 *                       format: date-time
 *                     location:
 *                       type: string
 *                       maxLength: 100
 *                     activityContext:
 *                       type: string
 *                       enum: [work, exercise, meal, wake_up, before_sleep, break, other]
 *                     temperature:
 *                       type: string
 *                       enum: [hot, warm, room, cold, iced]
 *                       default: room
 *     responses:
 *       201:
 *         description: 批量记录添加成功
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
 *                     recordCount:
 *                       type: integer
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recordId:
 *                             type: integer
 *                           amount:
 *                             type: integer
 *                           drinkType:
 *                             type: string
 *                           recordedAt:
 *                             type: string
 *       400:
 *         description: 输入验证失败或超出限制
 *       401:
 *         description: 未授权
 */
router.post(
  '/records/batch',
  recordCreateLimiter,
  requirePermission('basic_recording'),
  batchRecordsValidation,
  HydrationController.addBatchRecords
);

/**
 * @swagger
 * /api/v1/hydration/today:
 *   get:
 *     summary: 获取今日饮水进度
 *     tags: [Hydration Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 今日进度获取成功
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
 *                     date:
 *                       type: string
 *                       format: date
 *                     progress:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                         goal:
 *                           type: integer
 *                         percentage:
 *                           type: string
 *                         remaining:
 *                           type: integer
 *                         isGoalAchieved:
 *                           type: boolean
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         lastRecordTime:
 *                           type: string
 *                           format: date-time
 *                         timeDistribution:
 *                           type: object
 *                           properties:
 *                             morning:
 *                               type: integer
 *                             afternoon:
 *                               type: integer
 *                             evening:
 *                               type: integer
 *                         drinkDistribution:
 *                           type: object
 *                           properties:
 *                             water:
 *                               type: integer
 *                             tea:
 *                               type: integer
 *                             coffee:
 *                               type: integer
 *                             other:
 *                               type: integer
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recommendations:
 *                       type: object
 *                       properties:
 *                         nextReminderTime:
 *                           type: string
 *                         suggestedAmount:
 *                           type: integer
 *       404:
 *         description: 用户不存在
 *       401:
 *         description: 未授权
 */
router.get('/today', generalLimiter, HydrationController.getTodayProgress);

export default router;
