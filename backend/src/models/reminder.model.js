import { 
  executeQuery, 
  findOne, 
  findMany, 
  create, 
  update, 
  softDelete,
  count,
  paginate
} from './base.model.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import moment from 'moment-timezone';

/**
 * 提醒相关数据模型
 */

// 获取用户提醒设置
export const getUserReminderSettings = async (userId) => {
  const query = `
    SELECT 
      rs.*,
      u.timezone
    FROM reminder_settings rs
    JOIN users u ON rs.user_id = u.id
    WHERE rs.user_id = ? AND u.deleted_at IS NULL
  `;
  
  const { rows } = await executeQuery(query, [userId]);
  return rows[0] || null;
};

// 更新用户提醒设置
export const updateReminderSettings = async (userId, settings) => {
  const allowedFields = [
    'is_enabled', 'start_time', 'end_time', 'interval_minutes',
    'smart_reminders', 'weekend_enabled', 'reminder_types',
    'quiet_hours_start', 'quiet_hours_end', 'intensity_level'
  ];
  
  // 过滤允许更新的字段
  const filteredSettings = Object.keys(settings)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = key === 'reminder_types' && Array.isArray(settings[key]) 
        ? JSON.stringify(settings[key]) 
        : settings[key];
      return obj;
    }, {});
  
  if (Object.keys(filteredSettings).length === 0) {
    return 0;
  }
  
  filteredSettings.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
  
  const affectedRows = await update('reminder_settings', filteredSettings, { user_id: userId });
  
  if (affectedRows > 0) {
    businessLogger.info('Reminder settings updated', { userId, settings: filteredSettings });
  }
  
  return affectedRows;
};

// 创建默认提醒设置
export const createDefaultReminderSettings = async (userId) => {
  const defaultSettings = {
    user_id: userId,
    is_enabled: true,
    start_time: '08:00:00',
    end_time: '22:00:00',
    interval_minutes: 120, // 2小时
    smart_reminders: true,
    weekend_enabled: true,
    reminder_types: JSON.stringify(['push', 'sound']),
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00',
    intensity_level: 'medium',
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  const result = await create('reminder_settings', defaultSettings);
  
  businessLogger.info('Default reminder settings created', { userId });
  
  return result.insertId;
};

// 获取提醒历史记录
export const getReminderHistory = async (userId, filters = {}, pagination = {}) => {
  const {
    startDate,
    endDate,
    status,
    reminderType,
  } = filters;
  
  const {
    page = 1,
    limit = 20,
    orderBy = 'scheduled_time DESC',
  } = pagination;

  let whereConditions = ['rl.user_id = ?', 'rl.deleted_at IS NULL'];
  let params = [userId];

  // 构建查询条件
  if (startDate) {
    whereConditions.push('DATE(rl.scheduled_time) >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    whereConditions.push('DATE(rl.scheduled_time) <= ?');
    params.push(endDate);
  }
  
  if (status) {
    whereConditions.push('rl.status = ?');
    params.push(status);
  }
  
  if (reminderType) {
    whereConditions.push('rl.reminder_type = ?');
    params.push(reminderType);
  }

  const whereClause = whereConditions.join(' AND ');
  const offset = (page - 1) * limit;
  
  // 查询记录
  const dataQuery = `
    SELECT 
      rl.id, rl.scheduled_time, rl.sent_time, rl.response_time,
      rl.status, rl.reminder_type, rl.message_content,
      rl.response_action, rl.created_at
    FROM reminder_logs rl
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
  const { rows: data } = await executeQuery(dataQuery, [...params, limit, offset]);
  
  // 查询总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM reminder_logs rl
    WHERE ${whereClause}
  `;
  
  const { rows: countResult } = await executeQuery(countQuery, params);
  const total = countResult[0].total;
  
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// 创建提醒日志
export const createReminderLog = async (userId, reminderData) => {
  const {
    scheduled_time,
    reminder_type = 'push',
    message_content,
    device_token,
    channel,
  } = reminderData;

  const logData = {
    user_id: userId,
    scheduled_time,
    reminder_type,
    message_content,
    device_token,
    channel,
    status: 'scheduled',
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  const result = await create('reminder_logs', logData);
  
  businessLogger.info('Reminder log created', { 
    userId, 
    logId: result.insertId,
    scheduled_time,
    reminder_type 
  });
  
  return result.insertId;
};

// 更新提醒状态
export const updateReminderStatus = async (reminderId, status, additionalData = {}) => {
  const updateData = {
    status,
    updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    ...additionalData,
  };

  if (status === 'sent') {
    updateData.sent_time = moment().format('YYYY-MM-DD HH:mm:ss');
  }

  const affectedRows = await update('reminder_logs', updateData, { id: reminderId });
  
  if (affectedRows > 0) {
    businessLogger.info('Reminder status updated', { reminderId, status });
  }
  
  return affectedRows;
};

// 记录用户对提醒的响应
export const recordReminderResponse = async (reminderId, responseData) => {
  const {
    response_action,
    amount_logged,
    response_delay_minutes,
  } = responseData;

  const updateData = {
    response_time: moment().format('YYYY-MM-DD HH:mm:ss'),
    response_action,
    amount_logged,
    response_delay_minutes,
    status: 'responded',
  };

  const affectedRows = await update('reminder_logs', updateData, { id: reminderId });
  
  if (affectedRows > 0) {
    businessLogger.info('Reminder response recorded', { 
      reminderId, 
      response_action,
      amount_logged 
    });
  }
  
  return affectedRows;
};

// 获取提醒统计信息
export const getReminderStatistics = async (userId, period = '30d') => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  
  const query = `
    SELECT 
      COUNT(*) as total_reminders,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_reminders,
      SUM(CASE WHEN status = 'responded' THEN 1 ELSE 0 END) as responded_reminders,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_reminders,
      AVG(response_delay_minutes) as avg_response_delay,
      SUM(amount_logged) as total_amount_from_reminders
    FROM reminder_logs
    WHERE user_id = ? 
      AND scheduled_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND deleted_at IS NULL
  `;
  
  const { rows } = await executeQuery(query, [userId, days]);
  const stats = rows[0] || {};
  
  // 计算响应率
  const responseRate = stats.sent_reminders > 0 
    ? (stats.responded_reminders / stats.sent_reminders) * 100 
    : 0;
    
  // 计算成功率
  const successRate = stats.total_reminders > 0
    ? (stats.sent_reminders / stats.total_reminders) * 100
    : 0;

  return {
    period,
    ...stats,
    response_rate: Math.round(responseRate * 10) / 10,
    success_rate: Math.round(successRate * 10) / 10,
  };
};

// 获取智能提醒建议时间
export const getSmartReminderTimes = async (userId, date = null) => {
  const targetDate = date || moment().format('YYYY-MM-DD');
  
  // 获取用户的历史饮水模式
  const patternQuery = `
    SELECT 
      HOUR(recorded_at) as hour,
      COUNT(*) as frequency,
      AVG(amount) as avg_amount
    FROM hydration_records
    WHERE user_id = ? 
      AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND deleted_at IS NULL
    GROUP BY HOUR(recorded_at)
    HAVING frequency >= 3  -- 至少出现3次的时间点
    ORDER BY frequency DESC, hour ASC
  `;
  
  const { rows: patterns } = await executeQuery(patternQuery, [userId]);
  
  // 获取用户提醒设置
  const settings = await getUserReminderSettings(userId);
  if (!settings) {
    return [];
  }
  
  const startHour = parseInt(settings.start_time.split(':')[0]);
  const endHour = parseInt(settings.end_time.split(':')[0]);
  const intervalMinutes = settings.interval_minutes;
  
  // 基于用户历史模式和设置计算建议时间
  const suggestedTimes = [];
  
  if (patterns.length > 0) {
    // 使用历史模式
    for (const pattern of patterns.slice(0, 8)) { // 最多8个提醒
      if (pattern.hour >= startHour && pattern.hour <= endHour) {
        suggestedTimes.push({
          time: `${String(pattern.hour).padStart(2, '0')}:00:00`,
          confidence: Math.min(pattern.frequency / 10, 1), // 信心度
          reason: 'historical_pattern',
        });
      }
    }
  } else {
    // 使用默认间隔
    let currentHour = startHour;
    while (currentHour <= endHour) {
      suggestedTimes.push({
        time: `${String(currentHour).padStart(2, '0')}:00:00`,
        confidence: 0.5,
        reason: 'default_interval',
      });
      currentHour += Math.floor(intervalMinutes / 60);
    }
  }
  
  return suggestedTimes;
};

// 安排下一个提醒
export const scheduleNextReminder = async (userId, baseTime = null) => {
  const settings = await getUserReminderSettings(userId);
  if (!settings || !settings.is_enabled) {
    return null;
  }
  
  const now = moment();
  const currentTime = baseTime ? moment(baseTime) : now;
  
  // 检查是否在安静时间
  const quietStart = moment(settings.quiet_hours_start, 'HH:mm:ss');
  const quietEnd = moment(settings.quiet_hours_end, 'HH:mm:ss');
  
  if (currentTime.isBetween(quietStart, quietEnd)) {
    // 安排到安静时间结束后
    const nextReminderTime = quietEnd.clone().add(settings.interval_minutes, 'minutes');
    return scheduleReminder(userId, nextReminderTime.format('YYYY-MM-DD HH:mm:ss'));
  }
  
  // 计算下一个提醒时间
  let nextReminderTime = currentTime.clone().add(settings.interval_minutes, 'minutes');
  
  // 检查是否超出活跃时间范围
  const endTime = moment(settings.end_time, 'HH:mm:ss');
  if (nextReminderTime.isAfter(endTime)) {
    // 安排到第二天的开始时间
    nextReminderTime = moment().add(1, 'day')
      .set('hour', parseInt(settings.start_time.split(':')[0]))
      .set('minute', parseInt(settings.start_time.split(':')[1]))
      .set('second', 0);
  }
  
  return scheduleReminder(userId, nextReminderTime.format('YYYY-MM-DD HH:mm:ss'));
};

// 创建提醒任务
const scheduleReminder = async (userId, scheduledTime) => {
  // 获取个性化消息
  const message = await generateReminderMessage(userId);
  
  const reminderData = {
    user_id: userId,
    scheduled_time: scheduledTime,
    reminder_type: 'push',
    message_content: message,
    status: 'scheduled',
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  const result = await create('reminder_logs', reminderData);
  
  businessLogger.info('Reminder scheduled', { 
    userId, 
    reminderId: result.insertId,
    scheduled_time: scheduledTime 
  });
  
  return result.insertId;
};

// 生成个性化提醒消息
const generateReminderMessage = async (userId) => {
  // 获取今日进度
  const todayQuery = `
    SELECT 
      COALESCE(SUM(hr.amount), 0) as today_intake,
      hg.daily_goal
    FROM users u
    LEFT JOIN hydration_records hr ON u.id = hr.user_id 
      AND DATE(hr.recorded_at) = CURDATE()
      AND hr.deleted_at IS NULL
    LEFT JOIN hydration_goals hg ON u.id = hg.user_id AND hg.is_active = true
    WHERE u.id = ?
  `;
  
  const { rows } = await executeQuery(todayQuery, [userId]);
  const progress = rows[0] || { today_intake: 0, daily_goal: 2000 };
  
  const progressPercentage = (progress.today_intake / progress.daily_goal) * 100;
  
  // 根据进度生成不同的消息
  const messages = {
    low: [
      '💧 该喝水啦！今天还没开始补充水分呢～',
      '🌟 新的一天，从一杯水开始！',
      '💪 保持活力，记得喝水哦！',
    ],
    medium: [
      '👍 进度不错！继续保持喝水的好习惯～',
      '💧 距离目标越来越近了，再喝一杯吧！',
      '🎯 已经完成了一半，加油！',
    ],
    high: [
      '🔥 今天的表现很棒！再坚持一下就达标啦～',
      '🏆 你今天很认真在补充水分，继续保持！',
      '💯 最后冲刺，距离目标只差一点点！',
    ],
    completed: [
      '🎉 恭喜！今天的饮水目标已完成，继续保持～',
      '✨ 目标达成！适量补充就好，不要过量哦～',
      '👑 今天你是喝水小能手！',
    ],
  };
  
  let messageCategory = 'low';
  if (progressPercentage >= 100) {
    messageCategory = 'completed';
  } else if (progressPercentage >= 75) {
    messageCategory = 'high';
  } else if (progressPercentage >= 25) {
    messageCategory = 'medium';
  }
  
  const categoryMessages = messages[messageCategory];
  const randomMessage = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  
  return randomMessage;
};

// 获取用户设备信息（用于推送）
export const getUserDevices = async (userId) => {
  const query = `
    SELECT device_token, device_type, is_active
    FROM user_devices
    WHERE user_id = ? AND is_active = true AND deleted_at IS NULL
  `;
  
  const { rows } = await executeQuery(query, [userId]);
  return rows;
};

// 更新设备令牌
export const updateDeviceToken = async (userId, deviceToken, deviceType) => {
  // 先检查是否存在
  const existing = await findOne('user_devices', { 
    user_id: userId, 
    device_token: deviceToken 
  });
  
  if (existing) {
    // 更新现有记录
    return await update('user_devices', 
      { 
        is_active: true,
        last_active: moment().format('YYYY-MM-DD HH:mm:ss')
      }, 
      { id: existing.id }
    );
  } else {
    // 创建新记录
    const deviceData = {
      user_id: userId,
      device_token: deviceToken,
      device_type: deviceType,
      is_active: true,
      created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      last_active: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    
    return await create('user_devices', deviceData);
  }
};

// 禁用设备令牌
export const deactivateDevice = async (userId, deviceToken) => {
  return await update('user_devices', 
    { is_active: false }, 
    { user_id: userId, device_token: deviceToken }
  );
};