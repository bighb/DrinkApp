import { validationResult } from 'express-validator';
import * as ReminderModel from '../models/reminder.model.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import config from '../config/index.js';
import moment from 'moment-timezone';

/**
 * 提醒管理控制器 - 函数式风格
 */

// 获取提醒设置
export const getReminderSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await ReminderModel.getUserReminderSettings(userId);

    if (!settings) {
      // 如果没有设置，创建默认设置
      await ReminderModel.createDefaultReminderSettings(userId);
      const newSettings = await ReminderModel.getUserReminderSettings(userId);

      return res.json({
        success: true,
        data: { settings: newSettings },
      });
    }

    // 解析JSON字段
    if (
      settings.reminder_types &&
      typeof settings.reminder_types === 'string'
    ) {
      settings.reminder_types = JSON.parse(settings.reminder_types);
    }

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    errorLogger.api('Get reminder settings failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_SETTINGS_FAILED',
      message: '获取提醒设置失败',
    });
  }
};

// 更新提醒设置
export const updateReminderSettings = async (req, res) => {
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
    const settingsData = req.body;

    // 验证时间格式
    const timeFields = [
      'start_time',
      'end_time',
      'quiet_hours_start',
      'quiet_hours_end',
    ];
    for (const field of timeFields) {
      if (settingsData[field]) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(settingsData[field])) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_TIME_FORMAT',
            message: `${field} 时间格式无效，请使用 HH:mm 或 HH:mm:ss 格式`,
          });
        }
      }
    }

    // 验证间隔时间
    if (settingsData.interval_minutes) {
      const interval = parseInt(settingsData.interval_minutes);
      if (interval < 30 || interval > 480) {
        // 30分钟到8小时
        return res.status(400).json({
          success: false,
          error: 'INVALID_INTERVAL',
          message: '提醒间隔应在30分钟到8小时之间',
        });
      }
    }

    // 验证提醒类型
    if (settingsData.reminder_types) {
      const validTypes = ['push', 'sound', 'vibration', 'email'];
      const types = Array.isArray(settingsData.reminder_types)
        ? settingsData.reminder_types
        : JSON.parse(settingsData.reminder_types);

      const invalidTypes = types.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REMINDER_TYPES',
          message: `无效的提醒类型: ${invalidTypes.join(', ')}`,
        });
      }
    }

    // 更新设置
    const affectedRows = await ReminderModel.updateReminderSettings(
      userId,
      settingsData
    );

    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_CHANGES',
        message: '没有可更新的数据',
      });
    }

    // 获取更新后的设置
    const updatedSettings = await ReminderModel.getUserReminderSettings(userId);
    if (
      updatedSettings.reminder_types &&
      typeof updatedSettings.reminder_types === 'string'
    ) {
      updatedSettings.reminder_types = JSON.parse(
        updatedSettings.reminder_types
      );
    }

    businessLogger.info('Reminder settings updated', { userId, settingsData });

    res.json({
      success: true,
      message: '提醒设置更新成功',
      data: { settings: updatedSettings },
    });
  } catch (error) {
    errorLogger.api('Update reminder settings failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_SETTINGS_FAILED',
      message: '更新提醒设置失败',
    });
  }
};

// 获取提醒历史记录
export const getReminderHistory = async (req, res) => {
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
      status,
      reminderType,
    } = req.query;

    // 构建过滤条件
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;
    if (reminderType) filters.reminderType = reminderType;

    // 分页参数
    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      orderBy: 'scheduled_time DESC',
    };

    const result = await ReminderModel.getReminderHistory(
      userId,
      filters,
      pagination
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    errorLogger.api('Get reminder history failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_HISTORY_FAILED',
      message: '获取提醒历史失败',
    });
  }
};

// 手动触发提醒
export const triggerReminder = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户设置
    const settings = await ReminderModel.getUserReminderSettings(userId);
    if (!settings || !settings.is_enabled) {
      return res.status(400).json({
        success: false,
        error: 'REMINDERS_DISABLED',
        message: '提醒功能已关闭',
      });
    }

    // 创建即时提醒
    const reminderData = {
      scheduled_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      reminder_type: 'push',
      message_content: '💧 这是一个手动触发的饮水提醒～',
    };

    const reminderId = await ReminderModel.createReminderLog(
      userId,
      reminderData
    );

    // 立即标记为已发送（实际推送逻辑在这里处理）
    await ReminderModel.updateReminderStatus(reminderId, 'sent');

    businessLogger.info('Manual reminder triggered', { userId, reminderId });

    res.json({
      success: true,
      message: '提醒已发送',
      data: { reminder_id: reminderId },
    });
  } catch (error) {
    errorLogger.api('Trigger reminder failed:', error);
    res.status(500).json({
      success: false,
      error: 'TRIGGER_REMINDER_FAILED',
      message: '触发提醒失败',
    });
  }
};

// 响应提醒（用户点击提醒后的反馈）
export const respondToReminder = async (req, res) => {
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
    const { responseAction, amountLogged } = req.body;

    // 验证reminderId
    if (!reminderId || isNaN(reminderId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REMINDER_ID',
        message: '无效的提醒ID',
      });
    }

    // 验证响应动作
    const validActions = ['drink_logged', 'snooze', 'dismiss', 'disabled'];
    if (!validActions.includes(responseAction)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESPONSE_ACTION',
        message: '无效的响应动作',
      });
    }

    // 计算响应延迟时间（从提醒发送到用户响应的时间）
    const reminderHistory = await ReminderModel.getReminderHistory(
      userId,
      {},
      { limit: 100 }
    );
    const reminder = reminderHistory.data.find(r => r.id == reminderId);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: 'REMINDER_NOT_FOUND',
        message: '提醒记录不存在',
      });
    }

    const responseDelayMinutes = reminder.sent_time
      ? moment().diff(moment(reminder.sent_time), 'minutes')
      : 0;

    // 记录响应
    const responseData = {
      response_action: responseAction,
      amount_logged: amountLogged || null,
      response_delay_minutes: responseDelayMinutes,
    };

    await ReminderModel.recordReminderResponse(reminderId, responseData);

    // 如果用户选择暂停，安排下一个提醒
    if (responseAction === 'snooze') {
      const snoozeMinutes = 15; // 暂停15分钟
      await ReminderModel.scheduleNextReminder(
        userId,
        moment().add(snoozeMinutes, 'minutes')
      );
    }

    businessLogger.info('Reminder response recorded', {
      userId,
      reminderId,
      responseAction,
      amountLogged,
    });

    res.json({
      success: true,
      message: '响应记录成功',
      data: {
        response_action: responseAction,
        response_delay_minutes: responseDelayMinutes,
      },
    });
  } catch (error) {
    errorLogger.api('Respond to reminder failed:', error);
    res.status(500).json({
      success: false,
      error: 'RESPOND_REMINDER_FAILED',
      message: '记录提醒响应失败',
    });
  }
};

// 获取智能提醒建议
export const getSmartReminderSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    const suggestions = await ReminderModel.getSmartReminderTimes(userId, date);

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    errorLogger.api('Get smart reminder suggestions failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_SUGGESTIONS_FAILED',
      message: '获取智能提醒建议失败',
    });
  }
};

// 获取提醒统计信息
export const getReminderStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // 验证period参数
    const validPeriods = ['7d', '30d', '3m'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PERIOD',
        message: '无效的时间段参数',
      });
    }

    const statistics = await ReminderModel.getReminderStatistics(
      userId,
      period
    );

    res.json({
      success: true,
      data: { statistics },
    });
  } catch (error) {
    errorLogger.api('Get reminder statistics failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_STATISTICS_FAILED',
      message: '获取提醒统计失败',
    });
  }
};

// 更新设备令牌（用于推送通知）
export const updateDeviceToken = async (req, res) => {
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
    const { deviceToken, deviceType = 'mobile' } = req.body;

    // 验证设备类型
    const validDeviceTypes = ['mobile', 'web', 'tablet'];
    if (!validDeviceTypes.includes(deviceType)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DEVICE_TYPE',
        message: '无效的设备类型',
      });
    }

    // 更新设备令牌
    await ReminderModel.updateDeviceToken(userId, deviceToken, deviceType);

    businessLogger.info('Device token updated', { userId, deviceType });

    res.json({
      success: true,
      message: '设备令牌更新成功',
    });
  } catch (error) {
    errorLogger.api('Update device token failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_DEVICE_TOKEN_FAILED',
      message: '更新设备令牌失败',
    });
  }
};

// 禁用设备推送
export const disableDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        error: 'DEVICE_TOKEN_REQUIRED',
        message: '设备令牌不能为空',
      });
    }

    await ReminderModel.deactivateDevice(userId, deviceToken);

    businessLogger.info('Device deactivated', { userId, deviceToken });

    res.json({
      success: true,
      message: '设备已禁用推送',
    });
  } catch (error) {
    errorLogger.api('Disable device failed:', error);
    res.status(500).json({
      success: false,
      error: 'DISABLE_DEVICE_FAILED',
      message: '禁用设备失败',
    });
  }
};

// 测试提醒推送
export const testReminder = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户设备
    const devices = await ReminderModel.getUserDevices(userId);

    if (devices.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_DEVICES_FOUND',
        message: '未找到可用设备，请先注册设备令牌',
      });
    }

    // 创建测试提醒
    const testReminderData = {
      scheduled_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      reminder_type: 'push',
      message_content:
        '🧪 这是一个测试提醒，如果您收到此消息说明推送功能正常！',
    };

    const reminderId = await ReminderModel.createReminderLog(
      userId,
      testReminderData
    );

    // 标记为测试提醒并发送
    await ReminderModel.updateReminderStatus(reminderId, 'sent', {
      is_test: true,
    });

    businessLogger.info('Test reminder sent', { userId, reminderId });

    res.json({
      success: true,
      message: '测试提醒已发送',
      data: {
        reminder_id: reminderId,
        device_count: devices.length,
      },
    });
  } catch (error) {
    errorLogger.api('Test reminder failed:', error);
    res.status(500).json({
      success: false,
      error: 'TEST_REMINDER_FAILED',
      message: '测试提醒失败',
    });
  }
};
