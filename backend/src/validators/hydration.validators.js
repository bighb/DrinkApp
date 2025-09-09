import { body, query } from 'express-validator';
import { 
  numberRangeValidation,
  enumValidation,
  stringLengthValidation,
  dateTimeValidation,
  arrayValidation,
  paginationValidation,
  dateRangeValidation,
  periodValidation,
  timezoneValidation,
  recordIdValidation
} from './common.validators.js';
import config from '../config/index.js';

/**
 * 饮水记录相关验证器
 */

// 饮水量验证
export const hydrationAmountValidation = (fieldName = 'amount', required = true) => [
  ...numberRangeValidation(
    fieldName, 
    config.business?.minRecordAmount || 10, 
    config.business?.maxRecordAmount || 5000, 
    required
  ),
];

// 饮品类型验证
export const drinkTypeValidation = (fieldName = 'drinkType', required = false) => [
  ...enumValidation(fieldName, [
    'water', 'tea', 'coffee', 'juice', 'milk', 
    'sports_drink', 'soda', 'alcohol', 'other'
  ], required),
];

// 温度验证
export const temperatureValidation = (fieldName = 'temperature', required = false) => [
  ...enumValidation(fieldName, ['cold', 'room', 'warm', 'hot'], required),
];

// 记录来源验证
export const sourceValidation = (fieldName = 'source', required = false) => [
  ...enumValidation(fieldName, ['manual', 'auto', 'reminder', 'batch_import'], required),
];

// 添加饮水记录验证
export const addRecordValidation = [
  // 必填字段
  ...hydrationAmountValidation('amount', true),
  
  // 可选字段
  ...drinkTypeValidation('drinkType', false),
  ...stringLengthValidation('drinkName', 0, 50),
  ...stringLengthValidation('location', 0, 100),
  ...stringLengthValidation('activityContext', 0, 100),
  ...temperatureValidation('temperature', false),
  ...sourceValidation('source', false),
  ...stringLengthValidation('deviceId', 0, 50),
  
  // 记录时间验证
  body('recordedAt')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效')
    .custom(value => {
      if (value) {
        const recordTime = new Date(value);
        const now = new Date();
        
        // 检查是否是未来时间
        if (recordTime > now) {
          throw new Error('记录时间不能是未来时间');
        }
        
        // 检查是否太久以前（7天前）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (recordTime < sevenDaysAgo) {
          throw new Error('记录时间不能超过7天前');
        }
      }
      return true;
    }),
];

// 更新饮水记录验证
export const updateRecordValidation = [
  ...recordIdValidation,
  
  // 可选更新字段
  ...hydrationAmountValidation('amount', false),
  ...drinkTypeValidation('drinkType', false),
  ...stringLengthValidation('drinkName', 0, 50),
  ...stringLengthValidation('location', 0, 100),
  ...stringLengthValidation('activityContext', 0, 100),
  ...temperatureValidation('temperature', false),
  
  // 记录时间更新验证
  body('recordedAt')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效')
    .custom(value => {
      if (value) {
        const recordTime = new Date(value);
        const now = new Date();
        
        if (recordTime > now) {
          throw new Error('记录时间不能是未来时间');
        }
        
        // 更新时允许的时间范围可能不同
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (recordTime < sevenDaysAgo) {
          throw new Error('只能修改7天内的记录');
        }
      }
      return true;
    }),
];

// 批量添加记录验证
export const addBatchRecordsValidation = [
  body('records')
    .notEmpty()
    .withMessage('记录数组不能为空')
    .isArray({ min: 1, max: config.business?.maxBatchRecords || 20 })
    .withMessage(`记录数组长度必须在1-${config.business?.maxBatchRecords || 20}之间`),
  
  body('records.*.amount')
    .notEmpty()
    .withMessage('饮水量不能为空')
    .isFloat({ 
      min: config.business?.minRecordAmount || 10, 
      max: config.business?.maxRecordAmount || 5000 
    })
    .withMessage(`饮水量必须在${config.business?.minRecordAmount || 10}-${config.business?.maxRecordAmount || 5000}ml之间`),
  
  body('records.*.drink_type')
    .optional()
    .isIn(['water', 'tea', 'coffee', 'juice', 'milk', 'sports_drink', 'soda', 'alcohol', 'other'])
    .withMessage('饮品类型无效'),
  
  body('records.*.drink_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('饮品名称长度不能超过50字符'),
  
  body('records.*.recorded_at')
    .optional()
    .isISO8601()
    .withMessage('记录时间格式无效'),
  
  body('records.*.location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('地点长度不能超过100字符'),
  
  body('records.*.activity_context')
    .optional()
    .isLength({ max: 100 })
    .withMessage('活动场景长度不能超过100字符'),
  
  body('records.*.temperature')
    .optional()
    .isIn(['cold', 'room', 'warm', 'hot'])
    .withMessage('温度选项无效'),
];

// 获取记录列表验证
export const getRecordsValidation = [
  ...paginationValidation,
  ...dateRangeValidation,
  
  // 过滤参数验证
  ...drinkTypeValidation('drinkType', false),
  ...sourceValidation('source', false),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小饮水量必须大于等于0'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大饮水量必须大于等于0')
    .custom((maxAmount, { req }) => {
      const minAmount = parseFloat(req.query.minAmount);
      if (minAmount && maxAmount && maxAmount < minAmount) {
        throw new Error('最大饮水量不能小于最小饮水量');
      }
      return true;
    }),
];

// 获取统计信息验证
export const getStatisticsValidation = [
  ...periodValidation,
  ...timezoneValidation,
  
  query('includeDetails')
    .optional()
    .isBoolean()
    .withMessage('includeDetails必须是布尔值'),
  
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('分组方式必须是 hour, day, week 或 month'),
];

// 今日进度查询验证
export const getTodayProgressValidation = [
  ...timezoneValidation,
  
  query('includeRecords')
    .optional()
    .isBoolean()
    .withMessage('includeRecords必须是布尔值'),
];

// 记录搜索验证
export const searchRecordsValidation = [
  ...paginationValidation,
  ...dateRangeValidation,
  
  query('keyword')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('搜索关键词长度必须在1-50字符之间')
    .trim(),
  
  query('sortBy')
    .optional()
    .isIn(['recorded_at', 'amount', 'drink_type', 'created_at'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc'),
];

// 记录导出验证
export const exportRecordsValidation = [
  ...dateRangeValidation,
  
  query('format')
    .optional()
    .isIn(['json', 'csv', 'excel'])
    .withMessage('导出格式必须是 json, csv 或 excel'),
  
  query('includeStats')
    .optional()
    .isBoolean()
    .withMessage('includeStats必须是布尔值'),
  
  query('maxRecords')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('最大记录数必须在1-10000之间'),
];

// 数据分析验证
export const dataAnalysisValidation = [
  ...periodValidation,
  ...timezoneValidation,
  
  query('analysisType')
    .optional()
    .isIn(['trends', 'patterns', 'goals', 'habits'])
    .withMessage('分析类型必须是 trends, patterns, goals 或 habits'),
  
  query('includeComparisons')
    .optional()
    .isBoolean()
    .withMessage('includeComparisons必须是布尔值'),
];

// 自定义验证器：检查饮水记录的合理性
export const validateRecordReasonableness = (amount, drinkType, recordedAt) => {
  const issues = [];
  const suggestions = [];
  
  // 检查单次饮水量是否合理
  if (amount > 1000) {
    issues.push('单次饮水量过大，可能影响健康');
    suggestions.push('建议单次饮水量控制在500ml以内');
  } else if (amount < 50) {
    suggestions.push('可以适当增加单次饮水量');
  }
  
  // 检查饮品类型和时间的合理性
  if (recordedAt) {
    const recordHour = new Date(recordedAt).getHours();
    
    if (drinkType === 'coffee' && recordHour > 18) {
      suggestions.push('晚上饮用咖啡可能影响睡眠');
    }
    
    if (drinkType === 'alcohol') {
      issues.push('酒精饮品不计入有效饮水量');
      suggestions.push('建议额外补充等量的水');
    }
    
    if (recordHour < 6 || recordHour > 23) {
      suggestions.push('注意饮水时间，避免影响睡眠');
    }
  }
  
  return {
    isReasonable: issues.length === 0,
    issues,
    suggestions,
    healthScore: Math.max(0, 100 - issues.length * 20), // 每个问题扣20分
  };
};

// 自定义验证器：检查每日饮水记录限制
export const validateDailyRecordLimit = async (userId, currentCount) => {
  const maxDailyRecords = config.business?.maxDailyRecords || 50;
  
  return {
    canAdd: currentCount < maxDailyRecords,
    currentCount,
    limit: maxDailyRecords,
    remaining: Math.max(0, maxDailyRecords - currentCount),
    warningThreshold: Math.floor(maxDailyRecords * 0.8), // 80%时开始警告
    shouldWarn: currentCount >= Math.floor(maxDailyRecords * 0.8),
  };
};

// 自定义验证器：检查记录时间的有效性
export const validateRecordTime = (recordedAt) => {
  if (!recordedAt) return { isValid: true };
  
  const recordTime = new Date(recordedAt);
  const now = new Date();
  const timeDiff = now - recordTime;
  
  // 时间差相关计算
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  const validations = {
    isFuture: recordTime > now,
    isTooOld: daysDiff > 7,
    isRecentEnough: daysDiff <= 1, // 24小时内
    hoursAgo: Math.round(hoursDiff),
    daysAgo: Math.round(daysDiff),
  };
  
  let status = 'valid';
  let message = '记录时间有效';
  
  if (validations.isFuture) {
    status = 'invalid';
    message = '记录时间不能是未来时间';
  } else if (validations.isTooOld) {
    status = 'invalid';
    message = '记录时间不能超过7天前';
  } else if (!validations.isRecentEnough) {
    status = 'warning';
    message = `记录时间是${validations.daysAgo}天前，确认是否正确`;
  }
  
  return {
    isValid: status !== 'invalid',
    status,
    message,
    ...validations,
  };
};

// 自定义验证器：饮水目标进度检查
export const validateGoalProgress = (todayIntake, dailyGoal) => {
  if (!dailyGoal) return null;
  
  const progress = (todayIntake / dailyGoal) * 100;
  const remaining = Math.max(0, dailyGoal - todayIntake);
  
  let status = 'on_track';
  let message = '进度正常';
  
  if (progress >= 100) {
    status = 'achieved';
    message = '恭喜！已完成今日目标';
  } else if (progress >= 80) {
    status = 'near_goal';
    message = '距离目标很近了，加油！';
  } else if (progress < 30) {
    status = 'behind';
    message = '进度较慢，建议增加饮水频率';
  }
  
  return {
    progress: Math.round(progress * 10) / 10,
    remaining,
    status,
    message,
    isAchieved: progress >= 100,
    needsMotivation: progress < 50,
  };
};

// 组合验证器：完整的记录添加验证
export const completeAddRecordValidation = [
  ...addRecordValidation,
  // 可以添加额外的业务逻辑验证
];

// 组合验证器：记录查询和过滤验证
export const completeRecordQueryValidation = [
  ...getRecordsValidation,
  ...searchRecordsValidation,
];