import { body } from 'express-validator';
import { 
  emailValidation, 
  requiredStringValidation, 
  stringLengthValidation,
  enumValidation,
  numberRangeValidation,
  booleanValidation
} from './common.validators.js';

/**
 * 认证相关验证器
 */

// 密码验证
export const passwordValidation = (fieldName = 'password', required = true) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isLength({ min: 8, max: 128 })
      .withMessage(`${fieldName}长度必须在8-128字符之间`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(`${fieldName}必须包含至少一个小写字母、一个大写字母和一个数字`),
  ];
};

// 用户名验证
export const usernameValidation = (fieldName = 'username', required = true) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isLength({ min: 3, max: 20 })
      .withMessage(`${fieldName}长度必须在3-20字符之间`)
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(`${fieldName}只能包含字母、数字和下划线`),
  ];
};

// 用户注册验证
export const registerValidation = [
  // 基础必填字段
  ...emailValidation('email', true),
  ...usernameValidation('username', true),
  ...passwordValidation('password', true),
  
  // 可选个人信息
  ...stringLengthValidation('fullName', 0, 50),
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
        
        if (age < 13) {
          throw new Error('用户年龄必须满13岁');
        }
        
        if (age > 120) {
          throw new Error('出生日期不合理');
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
];

// 用户登录验证
export const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('邮箱或用户名不能为空')
    .isLength({ min: 3, max: 255 })
    .withMessage('邮箱或用户名长度无效')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 1 })
    .withMessage('密码不能为空'),
  
  ...booleanValidation('rememberMe', false),
];

// 刷新令牌验证
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空')
    .isString()
    .withMessage('刷新令牌格式无效')
    .isLength({ min: 10 })
    .withMessage('刷新令牌格式无效'),
];

// 邮箱验证请求
export const emailValidationRequest = [
  ...emailValidation('email', true),
];

// 密码重置请求验证
export const passwordResetRequestValidation = [
  ...emailValidation('email', true),
];

// 密码重置验证
export const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空')
    .isString()
    .withMessage('重置令牌格式无效')
    .isLength({ min: 10 })
    .withMessage('重置令牌格式无效'),
  
  ...passwordValidation('newPassword', true),
  
  // 确认密码验证
  body('confirmPassword')
    .notEmpty()
    .withMessage('确认密码不能为空')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    }),
];

// 修改密码验证
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空')
    .isLength({ min: 1 })
    .withMessage('当前密码不能为空'),
  
  ...passwordValidation('newPassword', true),
  
  // 确认新密码验证
  body('confirmPassword')
    .notEmpty()
    .withMessage('确认密码不能为空')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    }),
  
  // 检查新密码与当前密码不同
  body('newPassword')
    .custom((newPassword, { req }) => {
      if (newPassword === req.body.currentPassword) {
        throw new Error('新密码不能与当前密码相同');
      }
      return true;
    }),
];

// 登出验证
export const logoutValidation = [
  ...booleanValidation('logoutAllDevices', false),
];

// 验证令牌参数（用于邮箱验证、密码重置等）
export const tokenParamValidation = [
  body('token')
    .notEmpty()
    .withMessage('验证令牌不能为空')
    .isString()
    .withMessage('验证令牌格式无效')
    .isLength({ min: 10, max: 500 })
    .withMessage('验证令牌长度无效'),
];

// 用户唯一性验证中间件函数（需要在controller中使用）
export const validateUserUniqueness = async (email, username, excludeUserId = null) => {
  // 这个函数需要在controller中调用，因为需要访问数据库
  // 这里只定义接口，具体实现在controller中
  return {
    isEmailUnique: true, // 需要在controller中实现查询逻辑
    isUsernameUnique: true, // 需要在controller中实现查询逻辑
  };
};

// 自定义验证器：检查密码强度
export const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  
  return {
    isValid: score >= 3, // 至少满足3个条件
    score,
    requirements,
    strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong',
  };
};

// 自定义验证器：检查邮箱域名
export const validateEmailDomain = (email) => {
  const allowedDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'qq.com', '163.com', '126.com', 'sina.com',
  ];
  
  const domain = email.split('@')[1];
  const isAllowedDomain = allowedDomains.includes(domain);
  
  return {
    isValid: isAllowedDomain,
    domain,
    suggestion: isAllowedDomain ? null : '建议使用常见邮箱服务商',
  };
};

// 自定义验证器：检查用户名可用性
export const validateUsernameFormat = (username) => {
  const requirements = {
    validLength: username.length >= 3 && username.length <= 20,
    validCharacters: /^[a-zA-Z0-9_]+$/.test(username),
    notAllNumbers: !/^\d+$/.test(username),
    notStartWithNumber: !/^\d/.test(username),
  };
  
  const issues = [];
  if (!requirements.validLength) issues.push('用户名长度必须在3-20字符之间');
  if (!requirements.validCharacters) issues.push('用户名只能包含字母、数字和下划线');
  if (!requirements.notAllNumbers) issues.push('用户名不能全是数字');
  if (!requirements.notStartWithNumber) issues.push('用户名不能以数字开头');
  
  return {
    isValid: Object.values(requirements).every(Boolean),
    requirements,
    issues,
  };
};

// 组合验证器：完整注册验证
export const fullRegistrationValidation = [
  ...registerValidation,
  // 额外的自定义验证可以在这里添加
];

// 组合验证器：安全登录验证
export const secureLoginValidation = [
  ...loginValidation,
  // 可以添加额外的安全检查，如IP地址验证等
];