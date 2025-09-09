import { validationResult } from 'express-validator';
import * as HydrationModel from '../models/hydration.model.js';
import * as UserModel from '../models/user.model.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import config from '../config/index.js';
import moment from 'moment-timezone';

/**
 * 饮水记录控制器 - 函数式风格
 */

// 添加饮水记录
export const addRecord = async (req, res) => {
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

    const userId = req.user.id;
    const {
      amount,
      drinkType = 'water',
      drinkName,
      recordedAt,
      location,
      activityContext,
      temperature = 'room',
      source = 'manual',
      deviceId,
    } = req.body;

    // 检查每日记录数量限制
    const limitCheck = await HydrationModel.checkDailyRecordLimit(
      userId,
      config.business.maxDailyRecords
    );

    if (!limitCheck.can_add) {
      return res.status(400).json({
        success: false,
        error: 'DAILY_LIMIT_EXCEEDED',
        message: `每日最多只能记录${config.business.maxDailyRecords}次`,
        current_count: limitCheck.current_count,
        limit: config.business.maxDailyRecords,
      });
    }

    // 验证饮水量范围
    if (
      amount < config.business.minRecordAmount ||
      amount > config.business.maxRecordAmount
    ) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: `饮水量应在 ${config.business.minRecordAmount}ml - ${config.business.maxRecordAmount}ml 之间`,
      });
    }

    // 验证时间不能太久以前或未来
    const recordTime = recordedAt ? moment(recordedAt) : moment();
    const now = moment();

    if (recordTime.isAfter(now)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TIME',
        message: '记录时间不能是未来时间',
      });
    }

    if (recordTime.isBefore(now.subtract(7, 'days'))) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TIME',
        message: '记录时间不能超过7天前',
      });
    }

    // 创建记录数据
    const recordData = {
      amount,
      drink_type: drinkType,
      drink_name: drinkName,
      recorded_at: recordedAt,
      location,
      activity_context: activityContext,
      temperature,
      source,
      device_id: deviceId,
    };

    // 添加饮水记录
    const recordId = await HydrationModel.createHydrationRecord(
      userId,
      recordData
    );

    // 更新用户统计信息
    await HydrationModel.updateUserStatistics(userId);

    // 获取今日进度
    const todayProgress =
      await HydrationModel.getTodayHydrationProgress(userId);

    businessLogger.info('Hydration record added', {
      userId,
      recordId,
      amount,
      drink_type: drinkType,
    });

    res.status(201).json({
      success: true,
      message: '饮水记录添加成功',
      data: {
        record: {
          id: recordId,
          amount,
          drink_type: drinkType,
          drink_name: drinkName,
          recorded_at: recordTime.format('YYYY-MM-DD HH:mm:ss'),
        },
        today_progress: todayProgress,
      },
    });
  } catch (error) {
    errorLogger.api('Add hydration record failed:', error);
    res.status(500).json({
      success: false,
      error: 'ADD_RECORD_FAILED',
      message: '添加饮水记录失败',
    });
  }
};

// 获取饮水记录列表
export const getRecords = async (req, res) => {
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

    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      drinkType,
      source,
      minAmount,
      maxAmount,
    } = req.query;

    // 构建过滤条件
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (drinkType) filters.drinkType = drinkType;
    if (source) filters.source = source;
    if (minAmount) filters.minAmount = parseInt(minAmount);
    if (maxAmount) filters.maxAmount = parseInt(maxAmount);

    // 分页参数
    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // 限制最大每页数量
      orderBy: 'recorded_at DESC',
    };

    // 获取记录
    const result = await HydrationModel.getUserHydrationRecords(
      userId,
      filters,
      pagination
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    errorLogger.api('Get hydration records failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_RECORDS_FAILED',
      message: '获取饮水记录失败',
    });
  }
};

// 获取单条饮水记录
export const getRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recordId } = req.params;

    // 验证recordId
    if (!recordId || isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RECORD_ID',
        message: '无效的记录ID',
      });
    }

    const record = await HydrationModel.getHydrationRecordById(
      recordId,
      userId
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'RECORD_NOT_FOUND',
        message: '饮水记录不存在',
      });
    }

    res.json({
      success: true,
      data: { record },
    });
  } catch (error) {
    errorLogger.api('Get hydration record failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_RECORD_FAILED',
      message: '获取饮水记录失败',
    });
  }
};

// 更新饮水记录
export const updateRecord = async (req, res) => {
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

    const userId = req.user.id;
    const { recordId } = req.params;
    const updateData = req.body;

    // 验证recordId
    if (!recordId || isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RECORD_ID',
        message: '无效的记录ID',
      });
    }

    // 验证饮水量范围
    if (
      updateData.amount &&
      (updateData.amount < config.business.minRecordAmount ||
        updateData.amount > config.business.maxRecordAmount)
    ) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: `饮水量应在 ${config.business.minRecordAmount}ml - ${config.business.maxRecordAmount}ml 之间`,
      });
    }

    // 验证记录是否存在且属于当前用户
    const existingRecord = await HydrationModel.getHydrationRecordById(
      recordId,
      userId
    );
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: 'RECORD_NOT_FOUND',
        message: '饮水记录不存在',
      });
    }

    // 检查记录是否太旧（只能修改7天内的记录）
    const recordDate = moment(existingRecord.recorded_at);
    const daysDiff = moment().diff(recordDate, 'days');

    if (daysDiff > 7) {
      return res.status(400).json({
        success: false,
        error: 'RECORD_TOO_OLD',
        message: '只能修改7天内的记录',
      });
    }

    // 更新记录
    const affectedRows = await HydrationModel.updateHydrationRecord(
      recordId,
      userId,
      updateData
    );

    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_CHANGES',
        message: '没有可更新的数据',
      });
    }

    // 重新计算统计信息
    await HydrationModel.updateUserStatistics(
      userId,
      recordDate.format('YYYY-MM-DD')
    );

    // 获取更新后的记录
    const updatedRecord = await HydrationModel.getHydrationRecordById(
      recordId,
      userId
    );

    businessLogger.info('Hydration record updated', {
      userId,
      recordId,
      updateData,
    });

    res.json({
      success: true,
      message: '饮水记录更新成功',
      data: { record: updatedRecord },
    });
  } catch (error) {
    errorLogger.api('Update hydration record failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_RECORD_FAILED',
      message: '更新饮水记录失败',
    });
  }
};

// 删除饮水记录
export const deleteRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recordId } = req.params;

    // 验证recordId
    if (!recordId || isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RECORD_ID',
        message: '无效的记录ID',
      });
    }

    // 验证记录是否存在且属于当前用户
    const existingRecord = await HydrationModel.getHydrationRecordById(
      recordId,
      userId
    );
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: 'RECORD_NOT_FOUND',
        message: '饮水记录不存在',
      });
    }

    // 删除记录
    const affectedRows = await HydrationModel.deleteHydrationRecord(
      recordId,
      userId
    );

    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'DELETE_FAILED',
        message: '删除失败',
      });
    }

    // 重新计算统计信息
    const recordDate = moment(existingRecord.recorded_at);
    await HydrationModel.updateUserStatistics(
      userId,
      recordDate.format('YYYY-MM-DD')
    );

    businessLogger.info('Hydration record deleted', { userId, recordId });

    res.json({
      success: true,
      message: '饮水记录删除成功',
    });
  } catch (error) {
    errorLogger.api('Delete hydration record failed:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_RECORD_FAILED',
      message: '删除饮水记录失败',
    });
  }
};

// 批量添加饮水记录
export const addBatchRecords = async (req, res) => {
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

    const userId = req.user.id;
    const { records } = req.body;

    // 验证批量记录数量限制
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RECORDS',
        message: '记录数据无效',
      });
    }

    if (records.length > config.business.maxBatchRecords) {
      return res.status(400).json({
        success: false,
        error: 'TOO_MANY_RECORDS',
        message: `批量添加最多支持${config.business.maxBatchRecords}条记录`,
      });
    }

    // 验证每条记录的数据
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (
        !record.amount ||
        record.amount < config.business.minRecordAmount ||
        record.amount > config.business.maxRecordAmount
      ) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_RECORD_DATA',
          message: `第${i + 1}条记录的饮水量无效`,
        });
      }
    }

    // 检查每日记录总数限制
    const limitCheck = await HydrationModel.checkDailyRecordLimit(userId);
    if (
      limitCheck.current_count + records.length >
      config.business.maxDailyRecords
    ) {
      return res.status(400).json({
        success: false,
        error: 'DAILY_LIMIT_EXCEEDED',
        message: `今日记录数量将超过限制（${config.business.maxDailyRecords}条）`,
        current_count: limitCheck.current_count,
        new_records: records.length,
        limit: config.business.maxDailyRecords,
      });
    }

    // 批量添加记录
    const result = await HydrationModel.createBatchHydrationRecords(
      userId,
      records
    );

    // 更新用户统计信息
    await HydrationModel.updateUserStatistics(userId);

    // 获取今日进度
    const todayProgress =
      await HydrationModel.getTodayHydrationProgress(userId);

    businessLogger.info('Batch hydration records added', {
      userId,
      recordCount: records.length,
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    });

    res.status(201).json({
      success: true,
      message: `成功添加${records.length}条饮水记录`,
      data: {
        added_count: records.length,
        affected_rows: result.affectedRows,
        today_progress: todayProgress,
      },
    });
  } catch (error) {
    errorLogger.api('Add batch hydration records failed:', error);
    res.status(500).json({
      success: false,
      error: 'ADD_BATCH_RECORDS_FAILED',
      message: '批量添加饮水记录失败',
    });
  }
};

// 获取今日饮水进度
export const getTodayProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timezone = 'UTC' } = req.query;

    const progress = await HydrationModel.getTodayHydrationProgress(
      userId,
      timezone
    );

    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    errorLogger.api('Get today progress failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_PROGRESS_FAILED',
      message: '获取今日进度失败',
    });
  }
};

// 获取饮水统计信息
export const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '7d', timezone = 'UTC' } = req.query;

    // 验证period参数
    const validPeriods = ['7d', '30d', '3m'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PERIOD',
        message: '无效的时间段参数',
      });
    }

    const statistics = await HydrationModel.getHydrationStatistics(
      userId,
      period,
      timezone
    );
    const drinkTypeStats = await HydrationModel.getDrinkTypeStatistics(userId);
    const hourlyPattern = await HydrationModel.getHourlyPattern(userId);

    res.json({
      success: true,
      data: {
        period_statistics: statistics,
        drink_type_statistics: drinkTypeStats,
        hourly_pattern: hourlyPattern,
      },
    });
  } catch (error) {
    errorLogger.api('Get hydration statistics failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_STATISTICS_FAILED',
      message: '获取饮水统计失败',
    });
  }
};
