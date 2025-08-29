import { body, query, validationResult } from 'express-validator';
import db from '../config/database.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import PushNotificationService from '../utils/pushNotification.js';
import moment from 'moment-timezone';

class ReminderController {
  // 获取用户提醒设置
  static async getReminderSettings(req, res) {
    try {
      const userId = req.user.id;

      const settingsQuery = `
        SELECT 
          strategy_type, is_enabled, fixed_interval_minutes,
          start_time, end_time, weekday_enabled, weekend_enabled,
          weekend_start_time, weekend_end_time, consider_weather,
          consider_activity, consider_previous_intake,
          do_not_disturb_enabled, dnd_start_time, dnd_end_time,
          notification_type, notification_sound, custom_messages,
          created_at, updated_at
        FROM reminder_settings
        WHERE user_id = ?
      `;

      const { rows: settings } = await db.query(settingsQuery, [userId]);

      if (settings.length === 0) {
        // 创建默认设置
        const defaultSettings = await this.createDefaultReminderSettings(userId);
        return res.json({
          success: true,
          data: defaultSettings,
        });
      }

      const setting = settings[0];

      // 获取提醒统计信息
      const statsQuery = `
        SELECT 
          COUNT(*) as total_reminders,
          SUM(CASE WHEN status IN ('delivered', 'opened', 'responded') THEN 1 ELSE 0 END) as successful_reminders,
          SUM(CASE WHEN response_type IS NOT NULL THEN 1 ELSE 0 END) as responded_reminders,
          AVG(CASE WHEN response_type IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, sent_at, responded_at) ELSE NULL END) as avg_response_time
        FROM reminder_logs
        WHERE user_id = ? AND sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      const { rows: stats } = await db.query(statsQuery, [userId]);
      const reminderStats = stats[0] || {};

      const responseData = {
        strategyType: setting.strategy_type,
        isEnabled: setting.is_enabled,
        
        // 固定间隔设置
        fixedIntervalMinutes: setting.fixed_interval_minutes,
        
        // 时间范围设置
        timeRange: {
          startTime: setting.start_time,
          endTime: setting.end_time,
          weekdayEnabled: setting.weekday_enabled,
          weekendEnabled: setting.weekend_enabled,
          weekendStartTime: setting.weekend_start_time,
          weekendEndTime: setting.weekend_end_time,
        },

        // 智能设置
        intelligentSettings: {
          considerWeather: setting.consider_weather,
          considerActivity: setting.consider_activity,
          considerPreviousIntake: setting.consider_previous_intake,
        },

        // 免打扰设置
        doNotDisturb: {
          enabled: setting.do_not_disturb_enabled,
          startTime: setting.dnd_start_time,
          endTime: setting.dnd_end_time,
        },

        // 通知设置
        notification: {
          types: setting.notification_type ? setting.notification_type.split(',') : ['push'],
          sound: setting.notification_sound,
        },

        // 自定义消息
        customMessages: setting.custom_messages ? JSON.parse(setting.custom_messages) : [],

        // 统计信息
        statistics: {
          totalReminders: parseInt(reminderStats.total_reminders) || 0,
          successRate: reminderStats.total_reminders > 0 
            ? ((reminderStats.successful_reminders / reminderStats.total_reminders) * 100).toFixed(1)
            : 0,
          responseRate: reminderStats.total_reminders > 0
            ? ((reminderStats.responded_reminders / reminderStats.total_reminders) * 100).toFixed(1) 
            : 0,
          averageResponseTime: parseFloat(reminderStats.avg_response_time) || 0,
        },

        createdAt: setting.created_at,
        updatedAt: setting.updated_at,
      };

      res.json({
        success: true,
        data: responseData,
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_REMINDER_SETTINGS_ERROR',
        message: '获取提醒设置失败',
      });
    }
  }

  // 更新提醒设置
  static async updateReminderSettings(req, res) {
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
      const updateData = req.body;

      // 定义可更新的字段
      const allowedFields = {
        strategy_type: updateData.strategyType,
        is_enabled: updateData.isEnabled,
        fixed_interval_minutes: updateData.fixedIntervalMinutes,
        start_time: updateData.timeRange?.startTime,
        end_time: updateData.timeRange?.endTime,
        weekday_enabled: updateData.timeRange?.weekdayEnabled,
        weekend_enabled: updateData.timeRange?.weekendEnabled,
        weekend_start_time: updateData.timeRange?.weekendStartTime,
        weekend_end_time: updateData.timeRange?.weekendEndTime,
        consider_weather: updateData.intelligentSettings?.considerWeather,
        consider_activity: updateData.intelligentSettings?.considerActivity,
        consider_previous_intake: updateData.intelligentSettings?.considerPreviousIntake,
        do_not_disturb_enabled: updateData.doNotDisturb?.enabled,
        dnd_start_time: updateData.doNotDisturb?.startTime,
        dnd_end_time: updateData.doNotDisturb?.endTime,
        notification_type: updateData.notification?.types?.join(','),
        notification_sound: updateData.notification?.sound,
        custom_messages: updateData.customMessages ? JSON.stringify(updateData.customMessages) : null,
      };

      // 过滤掉未定义的字段
      const fieldsToUpdate = {};
      const values = [];
      const setClause = [];

      Object.entries(allowedFields).forEach(([dbField, value]) => {
        if (value !== undefined) {
          fieldsToUpdate[dbField] = value;
          values.push(value);
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

      // 检查设置是否存在
      const existingQuery = 'SELECT id FROM reminder_settings WHERE user_id = ?';
      const { rows: existing } = await db.query(existingQuery, [userId]);

      if (existing.length === 0) {
        // 创建新的设置记录
        const createQuery = `
          INSERT INTO reminder_settings (user_id, ${Object.keys(fieldsToUpdate).join(', ')})
          VALUES (?, ${values.map(() => '?').join(', ')})
        `;
        
        await db.query(createQuery, [userId, ...values]);
      } else {
        // 更新现有设置
        values.push(userId);
        const updateQuery = `
          UPDATE reminder_settings 
          SET ${setClause.join(', ')}, updated_at = NOW()
          WHERE user_id = ?
        `;

        await db.query(updateQuery, values);
      }

      // 如果启用了提醒，触发重新计算提醒计划
      if (updateData.isEnabled === true) {
        setImmediate(async () => {
          try {
            await this.scheduleNextReminder(userId);
          } catch (error) {
            errorLogger.database(error, 'schedule_reminder_after_update', { userId });
          }
        });
      }

      businessLogger.userAction(userId, 'update_reminder_settings', {
        updatedFields: Object.keys(fieldsToUpdate),
        isEnabled: updateData.isEnabled,
      });

      res.json({
        success: true,
        message: '提醒设置更新成功',
        data: {
          updatedFields: Object.keys(fieldsToUpdate),
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'UPDATE_REMINDER_SETTINGS_ERROR',
        message: '更新提醒设置失败',
      });
    }
  }

  // 获取提醒历史
  static async getReminderHistory(req, res) {
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
        status,
        startDate,
        endDate
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 构建查询条件
      let whereConditions = ['user_id = ?'];
      let queryParams = [userId];

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (startDate) {
        whereConditions.push('DATE(scheduled_at) >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push('DATE(scheduled_at) <= ?');
        queryParams.push(endDate);
      }

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reminder_logs
        WHERE ${whereConditions.join(' AND ')}
      `;

      const { rows: countResult } = await db.query(countQuery, queryParams);
      const totalRecords = countResult[0].total;

      // 查询提醒历史
      const historyQuery = `
        SELECT 
          id, scheduled_at, sent_at, message, notification_type,
          status, response_type, responded_at, context,
          created_at, updated_at
        FROM reminder_logs
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY scheduled_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), offset);
      const { rows: history } = await db.query(historyQuery, queryParams);

      // 计算分页信息
      const totalPages = Math.ceil(totalRecords / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      // 格式化历史数据
      const formattedHistory = history.map(record => ({
        id: record.id,
        scheduledAt: record.scheduled_at,
        sentAt: record.sent_at,
        message: record.message,
        notificationType: record.notification_type,
        status: record.status,
        responseType: record.response_type,
        respondedAt: record.responded_at,
        responseTime: record.responded_at && record.sent_at 
          ? moment(record.responded_at).diff(moment(record.sent_at), 'minutes')
          : null,
        context: record.context ? JSON.parse(record.context) : null,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }));

      res.json({
        success: true,
        data: {
          history: formattedHistory,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRecords,
            limit: parseInt(limit),
            hasNextPage,
            hasPrevPage,
          },
          filters: {
            status: status || null,
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_REMINDER_HISTORY_ERROR',
        message: '获取提醒历史失败',
      });
    }
  }

  // 手动发送提醒
  static async sendInstantReminder(req, res) {
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
      const { message, notificationType = 'push' } = req.body;

      // 获取用户设备信息
      const deviceQuery = `
        SELECT push_token, device_type, platform
        FROM user_devices
        WHERE user_id = ? AND is_active = true AND push_enabled = true
      `;

      const { rows: devices } = await db.query(deviceQuery, [userId]);

      if (devices.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_DEVICES_FOUND',
          message: '未找到可用的推送设备',
        });
      }

      // 创建提醒记录
      const reminderMessage = message || await this.generateReminderMessage(userId);
      
      const logQuery = `
        INSERT INTO reminder_logs (
          user_id, scheduled_at, message, notification_type, status
        ) VALUES (?, NOW(), ?, ?, 'scheduled')
      `;

      const { rows: logResult } = await db.query(logQuery, [
        userId,
        reminderMessage,
        notificationType
      ]);

      const reminderId = logResult.insertId;

      try {
        // 发送推送通知
        const sendPromises = devices.map(device => 
          PushNotificationService.sendNotification(device.push_token, {
            title: '💧 饮水提醒',
            body: reminderMessage,
            data: {
              type: 'hydration_reminder',
              reminderId: reminderId.toString(),
              userId: userId.toString(),
            },
          }, device.platform)
        );

        const sendResults = await Promise.allSettled(sendPromises);
        const successCount = sendResults.filter(result => result.status === 'fulfilled').length;

        // 更新提醒状态
        const newStatus = successCount > 0 ? 'sent' : 'failed';
        await db.query(
          'UPDATE reminder_logs SET status = ?, sent_at = NOW() WHERE id = ?',
          [newStatus, reminderId]
        );

        businessLogger.userAction(userId, 'send_instant_reminder', {
          reminderId,
          devicesCount: devices.length,
          successCount,
          message: reminderMessage,
        });

        res.json({
          success: true,
          message: '提醒发送成功',
          data: {
            reminderId,
            message: reminderMessage,
            devicesCount: devices.length,
            successCount,
          },
        });

      } catch (sendError) {
        // 更新提醒状态为失败
        await db.query(
          'UPDATE reminder_logs SET status = \'failed\' WHERE id = ?',
          [reminderId]
        );

        throw sendError;
      }

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'SEND_REMINDER_ERROR',
        message: '发送提醒失败',
      });
    }
  }

  // 响应提醒
  static async respondToReminder(req, res) {
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
      const { reminderId } = req.params;
      const { responseType, amount } = req.body;

      // 验证提醒记录
      const reminderQuery = `
        SELECT id, scheduled_at, sent_at, status
        FROM reminder_logs
        WHERE id = ? AND user_id = ?
      `;

      const { rows: reminders } = await db.query(reminderQuery, [reminderId, userId]);

      if (reminders.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'REMINDER_NOT_FOUND',
          message: '提醒记录不存在',
        });
      }

      const reminder = reminders[0];

      // 更新提醒响应
      await db.query(
        'UPDATE reminder_logs SET response_type = ?, responded_at = NOW(), status = ? WHERE id = ?',
        [responseType, 'responded', reminderId]
      );

      // 如果用户记录了饮水，自动添加记录
      if (responseType === 'drink_logged' && amount) {
        try {
          const recordQuery = `
            INSERT INTO hydration_records (
              user_id, amount, drink_type, recorded_at, source, activity_context
            ) VALUES (?, ?, 'water', NOW(), 'reminder_response', 'reminder')
          `;

          await db.query(recordQuery, [userId, amount]);

          businessLogger.userAction(userId, 'reminder_drink_logged', {
            reminderId,
            amount,
            responseTime: moment().diff(moment(reminder.sent_at), 'minutes'),
          });
        } catch (recordError) {
          errorLogger.database(recordError, 'add_reminder_response_record', { userId, reminderId });
        }
      }

      // 根据响应类型调整下次提醒
      if (responseType === 'snooze_5min') {
        await this.scheduleSnoozeReminder(userId, 5);
      } else if (responseType === 'snooze_15min') {
        await this.scheduleSnoozeReminder(userId, 15);
      }

      businessLogger.userAction(userId, 'respond_to_reminder', {
        reminderId,
        responseType,
        amount: amount || null,
      });

      res.json({
        success: true,
        message: '提醒响应记录成功',
        data: {
          reminderId,
          responseType,
          amount: amount || null,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'RESPOND_TO_REMINDER_ERROR',
        message: '响应提醒失败',
      });
    }
  }

  // 获取提醒统计
  static async getReminderStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'week' } = req.query;

      let dateCondition = '';
      
      switch (period) {
        case 'today':
          dateCondition = 'AND DATE(scheduled_at) = CURDATE()';
          break;
        case 'week':
          dateCondition = 'AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateCondition = 'AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        default:
          dateCondition = 'AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      }

      // 基础统计
      const statsQuery = `
        SELECT 
          COUNT(*) as total_reminders,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_reminders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_reminders,
          SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened_reminders,
          SUM(CASE WHEN response_type IS NOT NULL THEN 1 ELSE 0 END) as responded_reminders,
          SUM(CASE WHEN response_type = 'drink_logged' THEN 1 ELSE 0 END) as drink_logged_reminders,
          SUM(CASE WHEN response_type IN ('snooze_5min', 'snooze_15min') THEN 1 ELSE 0 END) as snoozed_reminders,
          SUM(CASE WHEN response_type = 'dismiss' THEN 1 ELSE 0 END) as dismissed_reminders,
          AVG(CASE WHEN responded_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, sent_at, responded_at) ELSE NULL END) as avg_response_time_minutes
        FROM reminder_logs
        WHERE user_id = ? ${dateCondition}
      `;

      const { rows: stats } = await db.query(statsQuery, [userId]);
      const statistics = stats[0] || {};

      // 每日统计
      const dailyStatsQuery = `
        SELECT 
          DATE(scheduled_at) as date,
          COUNT(*) as daily_reminders,
          SUM(CASE WHEN response_type IS NOT NULL THEN 1 ELSE 0 END) as daily_responses,
          SUM(CASE WHEN response_type = 'drink_logged' THEN 1 ELSE 0 END) as daily_drinks
        FROM reminder_logs
        WHERE user_id = ? ${dateCondition}
        GROUP BY DATE(scheduled_at)
        ORDER BY date DESC
      `;

      const { rows: dailyStats } = await db.query(dailyStatsQuery, [userId]);

      // 按小时统计（发现最佳提醒时间）
      const hourlyStatsQuery = `
        SELECT 
          HOUR(scheduled_at) as hour,
          COUNT(*) as reminders_count,
          SUM(CASE WHEN response_type IS NOT NULL THEN 1 ELSE 0 END) as responses_count,
          (SUM(CASE WHEN response_type IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100) as response_rate
        FROM reminder_logs
        WHERE user_id = ? ${dateCondition}
        GROUP BY HOUR(scheduled_at)
        ORDER BY response_rate DESC
      `;

      const { rows: hourlyStats } = await db.query(hourlyStatsQuery, [userId]);

      // 计算各种比率
      const totalReminders = parseInt(statistics.total_reminders) || 0;
      const deliveryRate = totalReminders > 0 
        ? ((statistics.delivered_reminders / totalReminders) * 100).toFixed(1)
        : 0;
      const responseRate = totalReminders > 0
        ? ((statistics.responded_reminders / totalReminders) * 100).toFixed(1)
        : 0;
      const effectivenessRate = totalReminders > 0
        ? ((statistics.drink_logged_reminders / totalReminders) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          period,
          overview: {
            totalReminders,
            sentReminders: parseInt(statistics.sent_reminders) || 0,
            deliveredReminders: parseInt(statistics.delivered_reminders) || 0,
            respondedReminders: parseInt(statistics.responded_reminders) || 0,
            deliveryRate: parseFloat(deliveryRate),
            responseRate: parseFloat(responseRate),
            effectivenessRate: parseFloat(effectivenessRate),
            averageResponseTime: parseFloat(statistics.avg_response_time_minutes) || 0,
          },
          responseTypes: {
            drinkLogged: parseInt(statistics.drink_logged_reminders) || 0,
            snoozed: parseInt(statistics.snoozed_reminders) || 0,
            dismissed: parseInt(statistics.dismissed_reminders) || 0,
          },
          dailyBreakdown: dailyStats.map(day => ({
            date: day.date,
            reminders: parseInt(day.daily_reminders),
            responses: parseInt(day.daily_responses),
            drinks: parseInt(day.daily_drinks),
            responseRate: day.daily_reminders > 0 
              ? ((day.daily_responses / day.daily_reminders) * 100).toFixed(1)
              : 0,
          })),
          hourlyBreakdown: hourlyStats.map(hour => ({
            hour: parseInt(hour.hour),
            reminders: parseInt(hour.reminders_count),
            responses: parseInt(hour.responses_count),
            responseRate: parseFloat(hour.response_rate).toFixed(1),
          })),
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_REMINDER_STATISTICS_ERROR',
        message: '获取提醒统计失败',
      });
    }
  }

  // 辅助方法：创建默认提醒设置
  static async createDefaultReminderSettings(userId) {
    try {
      const defaultSettings = {
        strategy_type: 'smart_adaptive',
        is_enabled: true,
        fixed_interval_minutes: 60,
        start_time: '07:00:00',
        end_time: '22:00:00',
        weekday_enabled: true,
        weekend_enabled: true,
        weekend_start_time: '09:00:00',
        weekend_end_time: '23:00:00',
        consider_weather: false,
        consider_activity: true,
        consider_previous_intake: true,
        do_not_disturb_enabled: false,
        notification_type: 'push',
        notification_sound: 'default'
      };

      const createQuery = `
        INSERT INTO reminder_settings (
          user_id, strategy_type, is_enabled, fixed_interval_minutes,
          start_time, end_time, weekday_enabled, weekend_enabled,
          weekend_start_time, weekend_end_time, consider_weather,
          consider_activity, consider_previous_intake, do_not_disturb_enabled,
          notification_type, notification_sound
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.query(createQuery, [
        userId,
        defaultSettings.strategy_type,
        defaultSettings.is_enabled,
        defaultSettings.fixed_interval_minutes,
        defaultSettings.start_time,
        defaultSettings.end_time,
        defaultSettings.weekday_enabled,
        defaultSettings.weekend_enabled,
        defaultSettings.weekend_start_time,
        defaultSettings.weekend_end_time,
        defaultSettings.consider_weather,
        defaultSettings.consider_activity,
        defaultSettings.consider_previous_intake,
        defaultSettings.do_not_disturb_enabled,
        defaultSettings.notification_type,
        defaultSettings.notification_sound
      ]);

      return {
        strategyType: defaultSettings.strategy_type,
        isEnabled: defaultSettings.is_enabled,
        fixedIntervalMinutes: defaultSettings.fixed_interval_minutes,
        timeRange: {
          startTime: defaultSettings.start_time,
          endTime: defaultSettings.end_time,
          weekdayEnabled: defaultSettings.weekday_enabled,
          weekendEnabled: defaultSettings.weekend_enabled,
          weekendStartTime: defaultSettings.weekend_start_time,
          weekendEndTime: defaultSettings.weekend_end_time,
        },
        intelligentSettings: {
          considerWeather: defaultSettings.consider_weather,
          considerActivity: defaultSettings.consider_activity,
          considerPreviousIntake: defaultSettings.consider_previous_intake,
        },
        doNotDisturb: {
          enabled: defaultSettings.do_not_disturb_enabled,
        },
        notification: {
          types: [defaultSettings.notification_type],
          sound: defaultSettings.notification_sound,
        },
        customMessages: [],
        statistics: {
          totalReminders: 0,
          successRate: 0,
          responseRate: 0,
          averageResponseTime: 0,
        },
      };

    } catch (error) {
      errorLogger.database(error, 'create_default_reminder_settings', { userId });
      throw error;
    }
  }

  // 辅助方法：生成提醒消息
  static async generateReminderMessage(userId) {
    try {
      // 获取自定义消息
      const settingsQuery = 'SELECT custom_messages FROM reminder_settings WHERE user_id = ?';
      const { rows: settings } = await db.query(settingsQuery, [userId]);

      if (settings.length > 0 && settings[0].custom_messages) {
        const customMessages = JSON.parse(settings[0].custom_messages);
        if (customMessages.length > 0) {
          return customMessages[Math.floor(Math.random() * customMessages.length)];
        }
      }

      // 默认消息列表
      const defaultMessages = [
        '该喝水啦！保持身体水分充足 💧',
        '别忘了给自己补充水分哦 🌊',
        '小小一口水，大大的健康 💙',
        '你的身体在呼唤水分 🚰',
        '喝水时间到！为健康干杯 🥤',
        '补充水分，精神百倍 ✨',
        '记得喝水，关爱自己 💕',
        '清澈的水，清爽的你 🌟',
      ];

      return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];

    } catch (error) {
      errorLogger.database(error, 'generate_reminder_message', { userId });
      return '该喝水啦！💧';
    }
  }

  // 辅助方法：安排下一次提醒
  static async scheduleNextReminder(userId) {
    try {
      // 这里实现智能提醒调度逻辑
      // 可以基于用户习惯、当前摄入量、时间等因素
      // 简化实现，实际应用中会更复杂
      
      const settingsQuery = `
        SELECT strategy_type, fixed_interval_minutes, start_time, end_time, is_enabled
        FROM reminder_settings
        WHERE user_id = ? AND is_enabled = true
      `;

      const { rows: settings } = await db.query(settingsQuery, [userId]);

      if (settings.length === 0) {
        return;
      }

      const setting = settings[0];
      const now = moment();
      let nextReminderTime;

      if (setting.strategy_type === 'fixed_interval') {
        nextReminderTime = now.add(setting.fixed_interval_minutes, 'minutes');
      } else {
        // 智能提醒算法（简化版）
        // 实际应用中会考虑更多因素
        nextReminderTime = now.add(60, 'minutes'); // 默认60分钟后
      }

      // 检查是否在允许的时间范围内
      const nextHour = nextReminderTime.hour();
      const startHour = parseInt(setting.start_time.split(':')[0]);
      const endHour = parseInt(setting.end_time.split(':')[0]);

      if (nextHour < startHour) {
        nextReminderTime.hour(startHour).minute(0).second(0);
      } else if (nextHour > endHour) {
        // 调整到第二天的开始时间
        nextReminderTime.add(1, 'day').hour(startHour).minute(0).second(0);
      }

      // 这里应该将提醒加入到调度队列中
      // 实际实现会使用 node-cron 或类似的调度器

    } catch (error) {
      errorLogger.database(error, 'schedule_next_reminder', { userId });
    }
  }

  // 辅助方法：安排贪睡提醒
  static async scheduleSnoozeReminder(userId, minutes) {
    try {
      const reminderTime = moment().add(minutes, 'minutes');
      const message = await this.generateReminderMessage(userId);

      const logQuery = `
        INSERT INTO reminder_logs (
          user_id, scheduled_at, message, notification_type, status
        ) VALUES (?, ?, ?, 'push', 'scheduled')
      `;

      await db.query(logQuery, [
        userId,
        reminderTime.format('YYYY-MM-DD HH:mm:ss'),
        message + ' (贪睡提醒)'
      ]);

    } catch (error) {
      errorLogger.database(error, 'schedule_snooze_reminder', { userId, minutes });
    }
  }
}

// 输入验证规则
const updateReminderSettingsValidation = [
  body('strategyType')
    .optional()
    .isIn(['fixed_interval', 'smart_adaptive', 'activity_based', 'custom'])
    .withMessage('提醒策略类型无效'),
  body('isEnabled')
    .optional()
    .isBoolean()
    .withMessage('启用状态必须是布尔值'),
  body('fixedIntervalMinutes')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('固定间隔应在15-240分钟之间'),
  body('timeRange.startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('开始时间格式无效'),
  body('timeRange.endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('结束时间格式无效'),
  body('customMessages')
    .optional()
    .isArray({ max: 20 })
    .withMessage('自定义消息列表最多包含20条'),
  body('customMessages.*')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('自定义消息长度应在1-200个字符之间'),
];

const reminderHistoryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量应在1-100之间'),
  query('status')
    .optional()
    .isIn(['scheduled', 'sent', 'delivered', 'opened', 'responded', 'ignored', 'failed'])
    .withMessage('状态参数无效'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
];

const sendInstantReminderValidation = [
  body('message')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('提醒消息长度应在1-200个字符之间'),
  body('notificationType')
    .optional()
    .isIn(['push', 'sound', 'vibration'])
    .withMessage('通知类型无效'),
];

const respondToReminderValidation = [
  body('responseType')
    .isIn(['drink_logged', 'snooze_5min', 'snooze_15min', 'dismiss', 'none'])
    .withMessage('响应类型无效'),
  body('amount')
    .optional()
    .isInt({ min: 50, max: 1000 })
    .withMessage('饮水量应在50-1000ml之间'),
];

export {
  ReminderController,
  updateReminderSettingsValidation,
  reminderHistoryValidation,
  sendInstantReminderValidation,
  respondToReminderValidation,
};

export default ReminderController;