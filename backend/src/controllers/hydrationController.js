import { body, query, param, validationResult } from 'express-validator';
import db from '../config/database.js';
import config from '../config/index.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import moment from 'moment-timezone';

class HydrationController {
  // 添加饮水记录
  static async addRecord(req, res) {
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
        deviceId
      } = req.body;

      // 检查每日记录数量限制
      const todayRecordsQuery = `
        SELECT COUNT(*) as count
        FROM hydration_records
        WHERE user_id = ? AND DATE(recorded_at) = CURDATE() AND deleted_at IS NULL
      `;

      const { rows: countResult } = await db.query(todayRecordsQuery, [userId]);
      const todayRecordsCount = countResult[0].count;

      if (todayRecordsCount >= config.business.maxDailyRecords) {
        return res.status(400).json({
          success: false,
          error: 'DAILY_LIMIT_EXCEEDED',
          message: `每日最多只能记录${config.business.maxDailyRecords}次`,
          currentCount: todayRecordsCount,
          limit: config.business.maxDailyRecords,
        });
      }

      // 处理记录时间（如果未提供则使用当前时间）
      const recordTime = recordedAt 
        ? moment.tz(recordedAt, req.user.timezone || 'Asia/Shanghai')
        : moment.tz(req.user.timezone || 'Asia/Shanghai');

      // 插入饮水记录
      const insertQuery = `
        INSERT INTO hydration_records (
          user_id, amount, drink_type, drink_name, recorded_at,
          location, activity_context, temperature, source, device_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const { rows: insertResult } = await db.query(insertQuery, [
        userId,
        amount,
        drinkType,
        drinkName || null,
        recordTime.format('YYYY-MM-DD HH:mm:ss'),
        location || null,
        activityContext || null,
        temperature,
        source,
        deviceId || null
      ]);

      const recordId = insertResult.insertId;

      // 异步更新用户统计和成就检查
      setImmediate(async () => {
        try {
          await this.updateUserStatistics(userId, recordTime.format('YYYY-MM-DD'));
          await this.checkAndUpdateGoalProgress(userId, recordTime.format('YYYY-MM-DD'));
          await this.checkAchievements(userId, recordId);
        } catch (error) {
          errorLogger.database(error, 'post_record_updates', { userId, recordId });
        }
      });

      // 获取今日统计信息
      const todayStatsQuery = `
        SELECT 
          COALESCE(SUM(amount), 0) as today_total,
          COUNT(*) as today_records,
          (SELECT daily_water_goal FROM users WHERE id = ?) as daily_goal
        FROM hydration_records
        WHERE user_id = ? AND DATE(recorded_at) = CURDATE() AND deleted_at IS NULL
      `;

      const { rows: todayStats } = await db.query(todayStatsQuery, [userId, userId]);
      const stats = todayStats[0] || {};

      const todayTotal = parseInt(stats.today_total);
      const dailyGoal = parseInt(stats.daily_goal);
      const progressPercentage = dailyGoal > 0 ? (todayTotal / dailyGoal * 100).toFixed(1) : 0;

      // 记录日志
      businessLogger.userAction(userId, 'add_hydration_record', {
        recordId,
        amount,
        drinkType,
        recordedAt: recordTime.format(),
        todayTotal,
        progressPercentage,
      });

      res.status(201).json({
        success: true,
        message: '记录添加成功',
        data: {
          recordId,
          amount,
          drinkType,
          recordedAt: recordTime.format(),
          todayProgress: {
            total: todayTotal,
            goal: dailyGoal,
            percentage: parseFloat(progressPercentage),
            remaining: Math.max(0, dailyGoal - todayTotal),
            records: parseInt(stats.today_records),
          },
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'ADD_RECORD_ERROR',
        message: '添加记录失败，请稍后重试',
      });
    }
  }

  // 获取饮水记录列表
  static async getRecords(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '查询参数验证失败',
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
        sortBy = 'recorded_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 构建查询条件
      let whereConditions = ['user_id = ?', 'deleted_at IS NULL'];
      let queryParams = [userId];

      if (startDate) {
        whereConditions.push('DATE(recorded_at) >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push('DATE(recorded_at) <= ?');
        queryParams.push(endDate);
      }

      if (drinkType) {
        whereConditions.push('drink_type = ?');
        queryParams.push(drinkType);
      }

      // 验证排序字段
      const allowedSortFields = ['recorded_at', 'amount', 'drink_type', 'created_at'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'recorded_at';
      const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

      // 查询记录总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM hydration_records
        WHERE ${whereConditions.join(' AND ')}
      `;

      const { rows: countResult } = await db.query(countQuery, queryParams);
      const totalRecords = countResult[0].total;

      // 查询记录列表
      const recordsQuery = `
        SELECT 
          id, amount, drink_type, drink_name, recorded_at,
          location, activity_context, temperature, source,
          created_at, updated_at
        FROM hydration_records
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${validSortBy} ${validSortOrder}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), offset);
      const { rows: records } = await db.query(recordsQuery, queryParams);

      // 计算分页信息
      const totalPages = Math.ceil(totalRecords / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      // 格式化记录数据
      const formattedRecords = records.map(record => ({
        id: record.id,
        amount: record.amount,
        drinkType: record.drink_type,
        drinkName: record.drink_name,
        recordedAt: record.recorded_at,
        location: record.location,
        activityContext: record.activity_context,
        temperature: record.temperature,
        source: record.source,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }));

      res.json({
        success: true,
        data: {
          records: formattedRecords,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRecords,
            limit: parseInt(limit),
            hasNextPage,
            hasPrevPage,
          },
          filters: {
            startDate: startDate || null,
            endDate: endDate || null,
            drinkType: drinkType || null,
          },
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_RECORDS_ERROR',
        message: '获取记录列表失败',
      });
    }
  }

  // 获取单个记录详情
  static async getRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const recordId = req.params.recordId;

      const recordQuery = `
        SELECT 
          id, amount, drink_type, drink_name, recorded_at,
          location, activity_context, temperature, source,
          device_id, created_at, updated_at
        FROM hydration_records
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `;

      const { rows: records } = await db.query(recordQuery, [recordId, userId]);

      if (records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: '记录不存在',
        });
      }

      const record = records[0];

      res.json({
        success: true,
        data: {
          id: record.id,
          amount: record.amount,
          drinkType: record.drink_type,
          drinkName: record.drink_name,
          recordedAt: record.recorded_at,
          location: record.location,
          activityContext: record.activity_context,
          temperature: record.temperature,
          source: record.source,
          deviceId: record.device_id,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_RECORD_ERROR',
        message: '获取记录详情失败',
      });
    }
  }

  // 更新饮水记录
  static async updateRecord(req, res) {
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
      const recordId = req.params.recordId;
      const updateData = req.body;

      // 检查记录是否存在且属于当前用户
      const existingRecordQuery = `
        SELECT id, amount, recorded_at
        FROM hydration_records
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `;

      const { rows: existingRecords } = await db.query(existingRecordQuery, [recordId, userId]);

      if (existingRecords.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: '记录不存在',
        });
      }

      const existingRecord = existingRecords[0];

      // 定义可更新的字段
      const allowedFields = {
        amount: updateData.amount,
        drink_type: updateData.drinkType,
        drink_name: updateData.drinkName,
        recorded_at: updateData.recordedAt,
        location: updateData.location,
        activity_context: updateData.activityContext,
        temperature: updateData.temperature,
      };

      // 过滤掉未定义的字段
      const fieldsToUpdate = {};
      const values = [];
      const setClause = [];

      Object.entries(allowedFields).forEach(([dbField, value]) => {
        if (value !== undefined) {
          fieldsToUpdate[dbField] = value;
          
          // 处理记录时间格式
          if (dbField === 'recorded_at' && value) {
            const recordTime = moment.tz(value, req.user.timezone || 'Asia/Shanghai');
            values.push(recordTime.format('YYYY-MM-DD HH:mm:ss'));
          } else {
            values.push(value);
          }
          
          setClause.push(`${dbField} = ?`);
        }
      });

      if (setClause.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_FIELDS_TO_UPDATE',
          message: '没有需要更新的字段',
        });
      }

      // 执行更新
      values.push(recordId, userId);
      const updateQuery = `
        UPDATE hydration_records 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = ? AND user_id = ?
      `;

      await db.query(updateQuery, values);

      // 如果更新了数量或时间，重新计算统计
      if (updateData.amount !== undefined || updateData.recordedAt !== undefined) {
        const oldDate = moment(existingRecord.recorded_at).format('YYYY-MM-DD');
        const newDate = updateData.recordedAt 
          ? moment.tz(updateData.recordedAt, req.user.timezone || 'Asia/Shanghai').format('YYYY-MM-DD')
          : oldDate;

        setImmediate(async () => {
          try {
            await this.updateUserStatistics(userId, oldDate);
            if (oldDate !== newDate) {
              await this.updateUserStatistics(userId, newDate);
            }
            await this.checkAndUpdateGoalProgress(userId, newDate);
          } catch (error) {
            errorLogger.database(error, 'post_update_statistics', { userId, recordId });
          }
        });
      }

      businessLogger.userAction(userId, 'update_hydration_record', {
        recordId,
        updatedFields: Object.keys(fieldsToUpdate),
        oldAmount: existingRecord.amount,
        newAmount: updateData.amount,
      });

      res.json({
        success: true,
        message: '记录更新成功',
        data: {
          recordId,
          updatedFields: Object.keys(fieldsToUpdate),
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'UPDATE_RECORD_ERROR',
        message: '更新记录失败',
      });
    }
  }

  // 删除饮水记录
  static async deleteRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const recordId = req.params.recordId;

      // 检查记录是否存在且属于当前用户
      const existingRecordQuery = `
        SELECT id, amount, recorded_at
        FROM hydration_records
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `;

      const { rows: existingRecords } = await db.query(existingRecordQuery, [recordId, userId]);

      if (existingRecords.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: '记录不存在',
        });
      }

      const existingRecord = existingRecords[0];

      // 软删除记录
      await db.query(
        'UPDATE hydration_records SET deleted_at = NOW() WHERE id = ? AND user_id = ?',
        [recordId, userId]
      );

      // 重新计算统计
      const recordDate = moment(existingRecord.recorded_at).format('YYYY-MM-DD');
      setImmediate(async () => {
        try {
          await this.updateUserStatistics(userId, recordDate);
          await this.checkAndUpdateGoalProgress(userId, recordDate);
        } catch (error) {
          errorLogger.database(error, 'post_delete_statistics', { userId, recordId });
        }
      });

      businessLogger.userAction(userId, 'delete_hydration_record', {
        recordId,
        deletedAmount: existingRecord.amount,
        recordDate,
      });

      res.json({
        success: true,
        message: '记录删除成功',
        data: {
          recordId,
          deletedAmount: existingRecord.amount,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'DELETE_RECORD_ERROR',
        message: '删除记录失败',
      });
    }
  }

  // 批量添加记录
  static async addBatchRecords(req, res) {
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

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_RECORDS',
          message: '记录列表不能为空',
        });
      }

      if (records.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'TOO_MANY_RECORDS',
          message: '一次最多只能添加50条记录',
        });
      }

      // 检查每日记录数量限制
      const dates = [...new Set(records.map(r => 
        moment.tz(r.recordedAt || new Date(), req.user.timezone || 'Asia/Shanghai').format('YYYY-MM-DD')
      ))];

      const dateChecks = await Promise.all(dates.map(async (date) => {
        const countQuery = `
          SELECT COUNT(*) as count
          FROM hydration_records
          WHERE user_id = ? AND DATE(recorded_at) = ? AND deleted_at IS NULL
        `;
        const { rows: result } = await db.query(countQuery, [userId, date]);
        return { date, count: result[0].count };
      }));

      // 检查是否超出限制
      for (const check of dateChecks) {
        const newRecordsForDate = records.filter(r => {
          const recordDate = moment.tz(r.recordedAt || new Date(), req.user.timezone || 'Asia/Shanghai').format('YYYY-MM-DD');
          return recordDate === check.date;
        }).length;

        if (check.count + newRecordsForDate > config.business.maxDailyRecords) {
          return res.status(400).json({
            success: false,
            error: 'DAILY_LIMIT_EXCEEDED',
            message: `${check.date} 的记录数量将超出每日限制`,
            date: check.date,
            currentCount: check.count,
            newRecords: newRecordsForDate,
            limit: config.business.maxDailyRecords,
          });
        }
      }

      // 批量插入记录
      const insertedRecords = await db.transaction(async (connection) => {
        const results = [];

        for (const record of records) {
          const {
            amount,
            drinkType = 'water',
            drinkName,
            recordedAt,
            location,
            activityContext,
            temperature = 'room',
            source = 'batch_import'
          } = record;

          const recordTime = recordedAt 
            ? moment.tz(recordedAt, req.user.timezone || 'Asia/Shanghai')
            : moment.tz(req.user.timezone || 'Asia/Shanghai');

          const insertQuery = `
            INSERT INTO hydration_records (
              user_id, amount, drink_type, drink_name, recorded_at,
              location, activity_context, temperature, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const [insertResult] = await connection.execute(insertQuery, [
            userId,
            amount,
            drinkType,
            drinkName || null,
            recordTime.format('YYYY-MM-DD HH:mm:ss'),
            location || null,
            activityContext || null,
            temperature,
            source
          ]);

          results.push({
            recordId: insertResult.insertId,
            amount,
            drinkType,
            recordedAt: recordTime.format(),
          });
        }

        return results;
      });

      // 异步更新统计
      setImmediate(async () => {
        try {
          const uniqueDates = [...new Set(insertedRecords.map(r => 
            moment(r.recordedAt).format('YYYY-MM-DD')
          ))];
          
          for (const date of uniqueDates) {
            await this.updateUserStatistics(userId, date);
            await this.checkAndUpdateGoalProgress(userId, date);
          }
        } catch (error) {
          errorLogger.database(error, 'post_batch_insert_updates', { userId });
        }
      });

      businessLogger.userAction(userId, 'add_batch_records', {
        recordCount: insertedRecords.length,
        totalAmount: insertedRecords.reduce((sum, r) => sum + r.amount, 0),
      });

      res.status(201).json({
        success: true,
        message: `成功添加${insertedRecords.length}条记录`,
        data: {
          recordCount: insertedRecords.length,
          records: insertedRecords,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'ADD_BATCH_RECORDS_ERROR',
        message: '批量添加记录失败',
      });
    }
  }

  // 获取今日进度
  static async getTodayProgress(req, res) {
    try {
      const userId = req.user.id;
      const userTimezone = req.user.timezone || 'Asia/Shanghai';
      const today = moment.tz(userTimezone).format('YYYY-MM-DD');

      // 获取今日统计和用户目标
      const progressQuery = `
        SELECT 
          COALESCE(SUM(hr.amount), 0) as today_total,
          COUNT(hr.id) as today_records,
          u.daily_water_goal,
          -- 按时间段统计
          SUM(CASE WHEN HOUR(hr.recorded_at) BETWEEN 6 AND 11 THEN hr.amount ELSE 0 END) as morning_intake,
          SUM(CASE WHEN HOUR(hr.recorded_at) BETWEEN 12 AND 17 THEN hr.amount ELSE 0 END) as afternoon_intake,
          SUM(CASE WHEN HOUR(hr.recorded_at) BETWEEN 18 AND 23 THEN hr.amount ELSE 0 END) as evening_intake,
          -- 按饮品类型统计
          SUM(CASE WHEN hr.drink_type = 'water' THEN hr.amount ELSE 0 END) as water_amount,
          SUM(CASE WHEN hr.drink_type = 'tea' THEN hr.amount ELSE 0 END) as tea_amount,
          SUM(CASE WHEN hr.drink_type = 'coffee' THEN hr.amount ELSE 0 END) as coffee_amount,
          -- 最后一次记录时间
          MAX(hr.recorded_at) as last_record_time
        FROM users u
        LEFT JOIN hydration_records hr ON u.id = hr.user_id 
          AND DATE(hr.recorded_at) = ? 
          AND hr.deleted_at IS NULL
        WHERE u.id = ?
        GROUP BY u.id, u.daily_water_goal
      `;

      const { rows: progressData } = await db.query(progressQuery, [today, userId]);

      if (progressData.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在',
        });
      }

      const progress = progressData[0];
      const todayTotal = parseInt(progress.today_total);
      const dailyGoal = parseInt(progress.daily_water_goal);
      const progressPercentage = dailyGoal > 0 ? (todayTotal / dailyGoal * 100) : 0;

      // 获取今日记录列表
      const recordsQuery = `
        SELECT id, amount, drink_type, recorded_at, activity_context
        FROM hydration_records
        WHERE user_id = ? AND DATE(recorded_at) = ? AND deleted_at IS NULL
        ORDER BY recorded_at DESC
      `;

      const { rows: todayRecords } = await db.query(recordsQuery, [userId, today]);

      // 计算下一个建议记录时间（基于用户习惯）
      const nextReminderTime = await this.calculateNextReminderTime(userId);

      res.json({
        success: true,
        data: {
          date: today,
          progress: {
            current: todayTotal,
            goal: dailyGoal,
            percentage: Math.min(100, progressPercentage).toFixed(1),
            remaining: Math.max(0, dailyGoal - todayTotal),
            isGoalAchieved: todayTotal >= dailyGoal,
          },
          statistics: {
            totalRecords: parseInt(progress.today_records),
            lastRecordTime: progress.last_record_time,
            timeDistribution: {
              morning: parseInt(progress.morning_intake),
              afternoon: parseInt(progress.afternoon_intake),
              evening: parseInt(progress.evening_intake),
            },
            drinkDistribution: {
              water: parseInt(progress.water_amount),
              tea: parseInt(progress.tea_amount),
              coffee: parseInt(progress.coffee_amount),
              other: todayTotal - parseInt(progress.water_amount) - parseInt(progress.tea_amount) - parseInt(progress.coffee_amount),
            },
          },
          records: todayRecords.map(record => ({
            id: record.id,
            amount: record.amount,
            drinkType: record.drink_type,
            recordedAt: record.recorded_at,
            activityContext: record.activity_context,
          })),
          recommendations: {
            nextReminderTime,
            suggestedAmount: this.calculateSuggestedAmount(todayTotal, dailyGoal, progress.today_records),
          },
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_TODAY_PROGRESS_ERROR',
        message: '获取今日进度失败',
      });
    }
  }

  // 辅助方法：更新用户统计
  static async updateUserStatistics(userId, date) {
    try {
      const statsQuery = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_intake,
          COUNT(*) as record_count,
          AVG(amount) as avg_amount,
          AVG(TIMESTAMPDIFF(MINUTE, LAG(recorded_at) OVER (ORDER BY recorded_at), recorded_at)) as avg_interval,
          HOUR(recorded_at) as hour,
          COUNT(*) as hour_count
        FROM hydration_records
        WHERE user_id = ? AND DATE(recorded_at) = ? AND deleted_at IS NULL
      `;

      const { rows: stats } = await db.query(statsQuery, [userId, date]);
      // 这里可以实现更复杂的统计更新逻辑
    } catch (error) {
      errorLogger.database(error, 'update_user_statistics', { userId, date });
    }
  }

  // 辅助方法：检查并更新目标进度
  static async checkAndUpdateGoalProgress(userId, date) {
    try {
      // 获取当日总摄入量和目标
      const progressQuery = `
        SELECT 
          COALESCE(SUM(hr.amount), 0) as daily_total,
          ug.target_value,
          ug.id as goal_id,
          ug.current_streak,
          ug.best_streak
        FROM user_goals ug
        LEFT JOIN hydration_records hr ON hr.user_id = ug.user_id 
          AND DATE(hr.recorded_at) = ? 
          AND hr.deleted_at IS NULL
        WHERE ug.user_id = ? AND ug.is_active = true
        ORDER BY ug.created_at DESC
        LIMIT 1
      `;

      const { rows: progressData } = await db.query(progressQuery, [date, userId]);

      if (progressData.length > 0) {
        const progress = progressData[0];
        const isGoalAchieved = progress.daily_total >= progress.target_value;

        if (isGoalAchieved) {
          // 更新连续达成天数
          const newStreak = progress.current_streak + 1;
          const newBestStreak = Math.max(newStreak, progress.best_streak);

          await db.query(
            'UPDATE user_goals SET current_streak = ?, best_streak = ?, updated_at = NOW() WHERE id = ?',
            [newStreak, newBestStreak, progress.goal_id]
          );
        }
      }
    } catch (error) {
      errorLogger.database(error, 'check_goal_progress', { userId, date });
    }
  }

  // 辅助方法：检查成就
  static async checkAchievements(userId, recordId) {
    try {
      // 这里实现成就检查逻辑
      // 例如：第一次记录、连续记录、达成目标等
    } catch (error) {
      errorLogger.database(error, 'check_achievements', { userId, recordId });
    }
  }

  // 辅助方法：计算下一次提醒时间
  static async calculateNextReminderTime(userId) {
    try {
      // 获取用户提醒设置
      const reminderQuery = `
        SELECT strategy_type, fixed_interval_minutes, start_time, end_time
        FROM reminder_settings
        WHERE user_id = ? AND is_enabled = true
      `;

      const { rows: settings } = await db.query(reminderQuery, [userId]);

      if (settings.length === 0) {
        return null;
      }

      const setting = settings[0];
      const now = moment();

      if (setting.strategy_type === 'fixed_interval') {
        return now.add(setting.fixed_interval_minutes, 'minutes').format();
      }

      // 智能提醒逻辑（简化版）
      const defaultInterval = 60; // 默认60分钟
      return now.add(defaultInterval, 'minutes').format();

    } catch (error) {
      errorLogger.database(error, 'calculate_reminder_time', { userId });
      return null;
    }
  }

  // 辅助方法：计算建议饮水量
  static calculateSuggestedAmount(currentTotal, dailyGoal, recordCount) {
    const remaining = Math.max(0, dailyGoal - currentTotal);
    const hoursLeft = Math.max(1, 24 - new Date().getHours());
    
    if (remaining === 0) {
      return 200; // 已达目标，建议少量补充
    }

    // 基于剩余时间和剩余量计算
    const suggestedPerHour = Math.ceil(remaining / hoursLeft);
    
    // 限制在合理范围内
    return Math.max(100, Math.min(500, suggestedPerHour));
  }
}

// 输入验证规则
const addRecordValidation = [
  body('amount')
    .isInt({ min: config.business.minRecordAmount, max: config.business.maxRecordAmount })
    .withMessage(`饮水量应在${config.business.minRecordAmount}-${config.business.maxRecordAmount}ml之间`),
  body('drinkType')
    .optional()
    .isIn(['water', 'tea', 'coffee', 'juice', 'sports_drink', 'soda', 'alcohol', 'other'])
    .withMessage('饮品类型无效'),
  body('drinkName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('饮品名称不能超过100个字符'),
  body('recordedAt')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('地点标签不能超过100个字符'),
  body('activityContext')
    .optional()
    .isIn(['work', 'exercise', 'meal', 'wake_up', 'before_sleep', 'break', 'other'])
    .withMessage('活动场景无效'),
  body('temperature')
    .optional()
    .isIn(['hot', 'warm', 'room', 'cold', 'iced'])
    .withMessage('温度选项无效'),
];

const getRecordsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量应在1-100之间'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  query('drinkType')
    .optional()
    .isIn(['water', 'tea', 'coffee', 'juice', 'sports_drink', 'soda', 'alcohol', 'other'])
    .withMessage('饮品类型无效'),
  query('sortBy')
    .optional()
    .isIn(['recorded_at', 'amount', 'drink_type', 'created_at'])
    .withMessage('排序字段无效'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向无效'),
];

const recordIdValidation = [
  param('recordId')
    .isInt({ min: 1 })
    .withMessage('记录ID必须是正整数'),
];

const updateRecordValidation = [
  ...recordIdValidation,
  body('amount')
    .optional()
    .isInt({ min: config.business.minRecordAmount, max: config.business.maxRecordAmount })
    .withMessage(`饮水量应在${config.business.minRecordAmount}-${config.business.maxRecordAmount}ml之间`),
  body('drinkType')
    .optional()
    .isIn(['water', 'tea', 'coffee', 'juice', 'sports_drink', 'soda', 'alcohol', 'other'])
    .withMessage('饮品类型无效'),
  body('drinkName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('饮品名称不能超过100个字符'),
  body('recordedAt')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效'),
];

const batchRecordsValidation = [
  body('records')
    .isArray({ min: 1, max: 50 })
    .withMessage('记录列表应包含1-50条记录'),
  body('records.*.amount')
    .isInt({ min: config.business.minRecordAmount, max: config.business.maxRecordAmount })
    .withMessage(`饮水量应在${config.business.minRecordAmount}-${config.business.maxRecordAmount}ml之间`),
  body('records.*.drinkType')
    .optional()
    .isIn(['water', 'tea', 'coffee', 'juice', 'sports_drink', 'soda', 'alcohol', 'other'])
    .withMessage('饮品类型无效'),
];

export {
  HydrationController,
  addRecordValidation,
  getRecordsValidation,
  recordIdValidation,
  updateRecordValidation,
  batchRecordsValidation,
};

export default HydrationController;