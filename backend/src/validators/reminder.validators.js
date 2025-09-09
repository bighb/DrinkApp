import { body, query } from 'express-validator';
import { 
  timeFormatValidation,
  intRangeValidation,
  booleanValidation,
  enumValidation,
  arrayValidation,
  stringLengthValidation,
  paginationValidation,
  dateRangeValidation,
  periodValidation,
  reminderIdValidation
} from './common.validators.js';

/**
 * 提醒管理相关验证器
 */

// 提醒开关验证
export const reminderEnabledValidation = [
  ...booleanValidation('is_enabled', false),
];

// 时间间隔验证
export const reminderIntervalValidation = [
  ...intRangeValidation('interval_minutes', 30, 480, false), // 30分钟到8小时
];

// 提醒类型数组验证
export const reminderTypesValidation = [
  body('reminder_types')
    .optional()
    .custom(value => {
      // 支持数组或JSON字符串
      let types = value;
      if (typeof value === 'string') {
        try {
          types = JSON.parse(value);
        } catch (error) {
          throw new Error('提醒类型格式无效');
        }
      }
      
      if (!Array.isArray(types)) {
        throw new Error('提醒类型必须是数组');
      }
      
      if (types.length === 0) {
        throw new Error('至少需要选择一种提醒类型');
      }
      
      const validTypes = ['push', 'sound', 'vibration', 'email'];
      const invalidTypes = types.filter(type => !validTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        throw new Error(`无效的提醒类型: ${invalidTypes.join(', ')}`);
      }
      
      // 检查重复
      const uniqueTypes = [...new Set(types)];
      if (uniqueTypes.length !== types.length) {
        throw new Error('提醒类型不能重复');
      }
      
      return true;
    }),
];

// 强度等级验证
export const intensityLevelValidation = [
  ...enumValidation('intensity_level', ['low', 'medium', 'high'], false),
];

// 提醒设置更新验证
export const updateReminderSettingsValidation = [
  ...reminderEnabledValidation,
  
  // 时间验证
  ...timeFormatValidation('start_time', false),
  ...timeFormatValidation('end_time', false),
  ...timeFormatValidation('quiet_hours_start', false),
  ...timeFormatValidation('quiet_hours_end', false),
  
  // 间隔验证
  ...reminderIntervalValidation,
  
  // 其他设置
  ...booleanValidation('smart_reminders', false),
  ...booleanValidation('weekend_enabled', false),
  ...reminderTypesValidation,
  ...intensityLevelValidation,
  
  // 自定义时间逻辑验证
  body(['start_time', 'end_time'])
    .custom((value, { req }) => {
      const startTime = req.body.start_time;
      const endTime = req.body.end_time;
      
      if (startTime && endTime) {
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        
        if (start >= end) {
          throw new Error('结束时间必须晚于开始时间');
        }
        
        // 检查时间跨度是否合理（至少1小时）
        const timeDiff = (end - start) / (1000 * 60 * 60);
        if (timeDiff < 1) {
          throw new Error('提醒时间段至少需要1小时');
        }
      }
      
      return true;
    }),
  
  // 免打扰时间验证
  body(['quiet_hours_start', 'quiet_hours_end'])
    .custom((value, { req }) => {
      const quietStart = req.body.quiet_hours_start;
      const quietEnd = req.body.quiet_hours_end;
      
      if (quietStart && quietEnd && quietStart === quietEnd) {
        throw new Error('免打扰开始和结束时间不能相同');
      }
      
      return true;
    }),
];

// 提醒历史查询验证
export const getReminderHistoryValidation = [
  ...paginationValidation,
  ...dateRangeValidation,
  
  query('status')
    .optional()
    .isIn(['scheduled', 'sent', 'failed', 'responded'])
    .withMessage('状态必须是 scheduled, sent, failed 或 responded'),
  
  query('reminderType')
    .optional()
    .isIn(['push', 'sound', 'vibration', 'email'])
    .withMessage('提醒类型必须是 push, sound, vibration 或 email'),
];

// 响应提醒验证
export const respondToReminderValidation = [
  ...reminderIdValidation,
  
  body('responseAction')
    .notEmpty()
    .withMessage('响应动作不能为空')
    .isIn(['drink_logged', 'snooze', 'dismiss', 'disabled'])
    .withMessage('响应动作必须是 drink_logged, snooze, dismiss 或 disabled'),
  
  body('amountLogged')
    .optional()
    .isFloat({ min: 0, max: 5000 })
    .withMessage('记录饮水量必须在0-5000ml之间')
    .custom((amountLogged, { req }) => {
      // 只有当响应动作是记录饮水时才需要饮水量
      if (req.body.responseAction === 'drink_logged' && !amountLogged) {
        throw new Error('选择记录饮水时必须提供饮水量');
      }
      return true;
    }),
  
  body('responseDelay')
    .optional()
    .isInt({ min: 0, max: 1440 }) // 最多24小时的延迟
    .withMessage('响应延迟必须在0-1440分钟之间'),
];

// 智能提醒建议查询验证
export const getSmartSuggestionsValidation = [
  query('date')
    .optional()
    .isDate()
    .withMessage('日期格式无效')
    .custom(value => {
      if (value) {
        const date = new Date(value);
        const today = new Date();
        const maxFutureDate = new Date();
        maxFutureDate.setDate(today.getDate() + 30);
        
        if (date > maxFutureDate) {
          throw new Error('日期不能超过30天后');
        }
        
        const minPastDate = new Date();
        minPastDate.setDate(today.getDate() - 7);
        
        if (date < minPastDate) {
          throw new Error('日期不能超过7天前');
        }
      }
      return true;
    }),
  
  query('includeReasons')
    .optional()
    .isBoolean()
    .withMessage('includeReasons必须是布尔值'),
];

// 提醒统计查询验证
export const getReminderStatisticsValidation = [
  ...periodValidation,
  
  query('includeDetails')
    .optional()
    .isBoolean()
    .withMessage('includeDetails必须是布尔值'),
  
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('分组方式必须是 day, week 或 month'),
];

// 设备令牌更新验证
export const updateDeviceTokenValidation = [
  body('deviceToken')
    .notEmpty()
    .withMessage('设备令牌不能为空')
    .isString()
    .withMessage('设备令牌必须是字符串')
    .isLength({ min: 10, max: 500 })
    .withMessage('设备令牌长度必须在10-500字符之间')
    .matches(/^[a-zA-Z0-9_:.-]+$/)
    .withMessage('设备令牌格式无效'),
  
  body('deviceType')
    .optional()
    .isIn(['mobile', 'web', 'tablet'])
    .withMessage('设备类型必须是 mobile, web 或 tablet'),
  
  body('platform')
    .optional()
    .isIn(['ios', 'android', 'web', 'windows', 'macos'])
    .withMessage('平台类型无效'),
  
  body('appVersion')
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('应用版本格式无效，应为 x.y.z 格式'),
];

// 禁用设备验证
export const disableDeviceValidation = [
  body('deviceToken')
    .notEmpty()
    .withMessage('设备令牌不能为空')
    .isString()
    .withMessage('设备令牌必须是字符串'),
  
  body('reason')
    .optional()
    .isIn(['user_request', 'token_expired', 'app_uninstalled', 'other'])
    .withMessage('禁用原因无效'),
];

// 测试提醒验证
export const testReminderValidation = [
  body('testMessage')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('测试消息长度必须在1-200字符之间')
    .trim(),
  
  body('testType')
    .optional()
    .isIn(['push', 'sound', 'vibration', 'email'])
    .withMessage('测试类型无效'),
];

// 提醒消息自定义验证
export const customReminderMessageValidation = [
  body('messages')
    .notEmpty()
    .withMessage('消息数组不能为空')
    .isArray({ min: 1, max: 20 })
    .withMessage('消息数组长度必须在1-20之间'),
  
  body('messages.*')
    .isString()
    .isLength({ min: 5, max: 200 })
    .withMessage('每条消息长度必须在5-200字符之间')
    .trim(),
  
  body('messageType')
    .optional()
    .isIn(['motivational', 'reminder', 'achievement', 'tip'])
    .withMessage('消息类型必须是 motivational, reminder, achievement 或 tip'),
];

// 自定义验证器：验证提醒时间合理性
export const validateReminderTimeReasonableness = (startTime, endTime, intervalMinutes) => {
  if (!startTime || !endTime || !intervalMinutes) return null;
  
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  const totalMinutes = (end - start) / (1000 * 60);
  const maxReminders = Math.floor(totalMinutes / intervalMinutes);
  
  const issues = [];
  const suggestions = [];
  
  if (maxReminders > 20) {
    issues.push('每日提醒次数过多，可能造成打扰');
    suggestions.push('建议增加提醒间隔或缩短活跃时间');
  } else if (maxReminders < 3) {
    suggestions.push('提醒次数较少，可以适当增加频率');
  }
  
  if (intervalMinutes < 60) {
    suggestions.push('提醒间隔较短，注意避免过度打扰');
  } else if (intervalMinutes > 240) {
    suggestions.push('提醒间隔较长，可能影响饮水习惯养成');
  }
  
  // 检查时间段是否覆盖主要活跃时间
  const startHour = start.getHours();
  const endHour = end.getHours();
  
  if (startHour > 9) {
    suggestions.push('建议将开始时间提前到9点前');
  }
  
  if (endHour < 21) {
    suggestions.push('建议将结束时间延长到21点后');
  }
  
  return {
    maxReminders,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    isReasonable: issues.length === 0,
    issues,
    suggestions,
    effectiveness: maxReminders >= 6 && maxReminders <= 12 ? 'high' : 
                  maxReminders >= 4 || maxReminders <= 15 ? 'medium' : 'low',
  };
};

// 自定义验证器：检查免打扰时间设置
export const validateQuietHours = (quietStart, quietEnd) => {
  if (!quietStart || !quietEnd) return null;
  
  const start = new Date(`2000-01-01 ${quietStart}`);
  const end = new Date(`2000-01-01 ${quietEnd}`);
  
  // 处理跨天情况
  let quietDuration;
  if (end <= start) {
    // 跨天的情况，比如23:00到07:00
    quietDuration = (24 * 60 - (start.getHours() * 60 + start.getMinutes())) + 
                    (end.getHours() * 60 + end.getMinutes());
  } else {
    // 同一天内
    quietDuration = (end - start) / (1000 * 60);
  }
  
  const suggestions = [];
  
  if (quietDuration < 360) { // 少于6小时
    suggestions.push('免打扰时间较短，建议保证至少6小时的安静时间');
  } else if (quietDuration > 600) { // 超过10小时
    suggestions.push('免打扰时间较长，可能影响饮水提醒效果');
  }
  
  // 检查是否覆盖了典型的睡眠时间
  const startHour = start.getHours();
  const endHour = end.getHours();
  
  if (startHour < 22 || (endHour > 8 && endHour < startHour)) {
    suggestions.push('建议免打扰时间覆盖22:00-08:00的睡眠时段');
  }
  
  return {
    duration: Math.round(quietDuration / 60 * 10) / 10, // 小时
    isAcrossDay: end <= start,
    suggestions,
    isReasonable: quietDuration >= 360 && quietDuration <= 600,
  };
};

// 自定义验证器：提醒效果分析
export const validateReminderEffectiveness = (statistics) => {
  if (!statistics) return null;
  
  const { 
    total_reminders, 
    sent_reminders, 
    responded_reminders,
    avg_response_delay 
  } = statistics;
  
  const sendRate = sent_reminders / total_reminders;
  const responseRate = responded_reminders / sent_reminders;
  
  let effectiveness = 'low';
  let recommendations = [];
  
  if (responseRate > 0.7 && avg_response_delay < 10) {
    effectiveness = 'high';
    recommendations.push('提醒效果很好，继续保持');
  } else if (responseRate > 0.5) {
    effectiveness = 'medium';
    if (avg_response_delay > 15) {
      recommendations.push('响应延迟较长，考虑调整提醒方式');
    }
  } else {
    effectiveness = 'low';
    recommendations.push('提醒响应率较低，建议调整提醒策略');
    
    if (sendRate < 0.8) {
      recommendations.push('提醒发送成功率较低，检查设备设置');
    }
    
    if (responseRate < 0.3) {
      recommendations.push('考虑调整提醒时间或类型');
    }
  }
  
  return {
    effectiveness,
    sendRate: Math.round(sendRate * 1000) / 10,
    responseRate: Math.round(responseRate * 1000) / 10,
    recommendations,
    needsAdjustment: effectiveness === 'low',
  };
};

// 组合验证器：完整的提醒设置验证
export const completeReminderSettingsValidation = [
  ...updateReminderSettingsValidation,
  // 可以添加额外的业务逻辑验证
];

// 组合验证器：提醒统计和历史验证
export const completeReminderQueryValidation = [
  ...getReminderHistoryValidation,
  ...getReminderStatisticsValidation,
];