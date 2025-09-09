import { body } from 'express-validator';
import { 
  stringLengthValidation,
  enumValidation,
  numberRangeValidation,
  booleanValidation,
  periodValidation,
  timezoneValidation,
  paginationValidation
} from './common.validators.js';
import { passwordValidation } from './auth.validators.js';

/**
 * 用户管理相关验证器
 */

// 用户资料更新验证
export const updateProfileValidation = [
  // 全名验证
  ...stringLengthValidation('fullName', 0, 50),
  
  // 性别验证
  ...enumValidation('gender', ['male', 'female', 'other', 'prefer_not_to_say'], false),
  
  // 出生日期验证
  body('dateOfBirth')
    .optional()
    .isDate()
    .withMessage('出生日期格式无效')
    .custom(value => {
      if (value) {
        const birthDate = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - birthDate.getFullYear();
        
        // 检查年龄合理性
        if (age < 13) {
          throw new Error('用户年龄必须满13岁');
        }
        
        if (age > 120) {
          throw new Error('出生日期不合理');
        }
        
        // 检查是否是未来日期
        if (birthDate > now) {
          throw new Error('出生日期不能是未来日期');
        }
      }
      return true;
    }),
  
  // 身高验证（厘米）
  ...numberRangeValidation('height', 100, 300, false),
  
  // 体重验证（公斤）
  ...numberRangeValidation('weight', 20, 500, false),
  
  // 活动水平验证
  ...enumValidation('activityLevel', [
    'sedentary', 
    'lightly_active', 
    'moderately_active', 
    'very_active', 
    'extremely_active'
  ], false),
  
  // 时区验证
  body('timezone')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('时区格式无效')
    .matches(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .withMessage('时区格式无效，例如: Asia/Shanghai'),
  
  // 语言偏好验证
  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('语言代码长度无效')
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('语言代码格式无效，例如: zh-CN'),
];

// 饮水目标更新验证
export const updateWaterGoalValidation = [
  body('goalValue')
    .notEmpty()
    .withMessage('目标值不能为空')
    .isInt({ min: 500, max: 8000 })
    .withMessage('每日饮水目标必须在500-8000ml之间')
    .custom(value => {
      // 检查目标值是否是合理的倍数（50ml的倍数）
      if (value % 50 !== 0) {
        throw new Error('目标值建议设置为50ml的倍数');
      }
      return true;
    }),
  
  ...enumValidation('goalType', ['daily', 'weekly', 'custom'], false),
];

// 修改密码验证
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空')
    .isLength({ min: 1 })
    .withMessage('当前密码不能为空'),
  
  ...passwordValidation('newPassword', true),
  
  // 检查新密码与当前密码不同
  body('newPassword')
    .custom((newPassword, { req }) => {
      if (newPassword === req.body.currentPassword) {
        throw new Error('新密码不能与当前密码相同');
      }
      return true;
    }),
];

// 头像上传验证
export const avatarUploadValidation = [
  // 这里主要是文件验证，通常在middleware中处理
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('头像URL格式无效')
    .isLength({ max: 500 })
    .withMessage('头像URL长度不能超过500字符'),
];

// 用户统计查询验证
export const userStatisticsValidation = [
  ...periodValidation,
  ...timezoneValidation,
];

// 用户偏好查询验证
export const userPreferencesValidation = [
  body('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('天数必须在1-365之间'),
];

// 数据导出验证
export const dataExportValidation = [
  body('format')
    .optional()
    .isIn(['json', 'csv', 'excel'])
    .withMessage('导出格式必须是 json, csv 或 excel'),
  
  body('includeRecords')
    .optional()
    .isBoolean()
    .withMessage('includeRecords必须是布尔值'),
  
  body('includeStatistics')
    .optional()
    .isBoolean()
    .withMessage('includeStatistics必须是布尔值'),
  
  body('dateRange')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('日期范围必须在1-365天之间'),
];

// 删除账户验证
export const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 1 })
    .withMessage('密码不能为空'),
  
  body('confirmText')
    .notEmpty()
    .withMessage('确认文本不能为空')
    .equals('删除我的账户')
    .withMessage('请输入正确的确认文本："删除我的账户"'),
  
  // 可选的删除原因
  body('deleteReason')
    .optional()
    .isIn([
      'not_useful',
      'too_complicated',
      'privacy_concerns',
      'switching_apps',
      'temporary_break',
      'other'
    ])
    .withMessage('删除原因无效'),
  
  body('feedback')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('反馈内容不能超过500字符')
    .trim(),
];

// 用户搜索验证
export const userSearchValidation = [
  ...paginationValidation,
  
  body('query')
    .optional()
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('搜索关键词长度必须在2-50字符之间')
    .trim(),
  
  body('filters')
    .optional()
    .isObject()
    .withMessage('过滤条件必须是对象'),
];

// 用户设置验证
export const userSettingsValidation = [
  // 隐私设置
  ...booleanValidation('profilePublic', false),
  ...booleanValidation('statisticsPublic', false),
  ...booleanValidation('allowDataCollection', false),
  
  // 通知设置
  ...booleanValidation('emailNotifications', false),
  ...booleanValidation('pushNotifications', false),
  ...booleanValidation('weeklyReports', false),
  ...booleanValidation('monthlyReports', false),
  
  // 显示设置
  ...enumValidation('theme', ['light', 'dark', 'auto'], false),
  ...enumValidation('language', ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], false),
  ...enumValidation('dateFormat', ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], false),
  ...enumValidation('timeFormat', ['24h', '12h'], false),
  
  // 单位设置
  ...enumValidation('volumeUnit', ['ml', 'fl_oz', 'cup'], false),
  ...enumValidation('weightUnit', ['kg', 'lb'], false),
  ...enumValidation('heightUnit', ['cm', 'ft_in'], false),
];

// 个人信息完整性验证
export const profileCompletenessValidation = [
  body('requiredFields')
    .optional()
    .isArray()
    .withMessage('必填字段必须是数组')
    .custom(fields => {
      const validFields = [
        'fullName', 'gender', 'dateOfBirth', 'height', 'weight', 
        'activityLevel', 'timezone', 'language'
      ];
      const invalidFields = fields.filter(field => !validFields.includes(field));
      if (invalidFields.length > 0) {
        throw new Error(`无效的字段: ${invalidFields.join(', ')}`);
      }
      return true;
    }),
];

// 用户活跃度统计验证
export const userActivityValidation = [
  ...periodValidation,
  
  body('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive必须是布尔值'),
  
  body('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('分组方式必须是 day, week 或 month'),
];

// 自定义验证器：BMI计算和验证
export const validateBMI = (height, weight) => {
  if (!height || !weight) return null;
  
  const heightInM = height / 100; // 转换为米
  const bmi = weight / (heightInM * heightInM);
  
  let category = '';
  let recommendation = '';
  
  if (bmi < 18.5) {
    category = 'underweight';
    recommendation = '体重偏轻，建议适当增加饮水量';
  } else if (bmi < 25) {
    category = 'normal';
    recommendation = '体重正常，保持当前饮水习惯';
  } else if (bmi < 30) {
    category = 'overweight';
    recommendation = '体重偏重，建议适当增加饮水量';
  } else {
    category = 'obese';
    recommendation = '建议咨询医生制定个性化饮水计划';
  }
  
  return {
    value: Math.round(bmi * 10) / 10,
    category,
    recommendation,
    isHealthy: bmi >= 18.5 && bmi < 25,
  };
};

// 自定义验证器：饮水目标合理性检查
export const validateWaterGoalReasonableness = (goalValue, userProfile) => {
  const { weight, height, activityLevel, gender } = userProfile;
  
  // 基础需水量计算
  let baseWater = weight * 35; // ml
  
  // 活动水平调整
  const activityMultipliers = {
    sedentary: 1.0,
    lightly_active: 1.1,
    moderately_active: 1.2,
    very_active: 1.4,
    extremely_active: 1.6,
  };
  
  baseWater *= (activityMultipliers[activityLevel] || 1.0);
  
  // 性别调整
  if (gender === 'male') {
    baseWater *= 1.05;
  }
  
  const recommendedGoal = Math.round(baseWater / 100) * 100;
  const difference = Math.abs(goalValue - recommendedGoal);
  const percentageDiff = (difference / recommendedGoal) * 100;
  
  return {
    recommendedGoal,
    currentGoal: goalValue,
    difference,
    percentageDiff: Math.round(percentageDiff),
    isReasonable: percentageDiff <= 30, // 允许30%的偏差
    suggestion: percentageDiff > 30 
      ? `建议目标设置在${recommendedGoal}ml附近更合理`
      : '目标设置合理',
  };
};

// 组合验证器：完整个人资料验证
export const completeProfileValidation = [
  ...updateProfileValidation,
  // 可以添加额外的完整性检查
];

// 组合验证器：用户安全设置验证
export const userSecurityValidation = [
  ...changePasswordValidation,
  // 可以添加其他安全相关的验证
];