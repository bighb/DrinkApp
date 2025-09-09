import { body, query, param } from 'express-validator';

/**
 * 通用验证器
 */

// 分页参数验证
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
];

// 日期范围验证
export const dateRangeValidation = [
  query('startDate')
    .optional()
    .isDate()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('结束日期格式无效')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('结束日期不能早于开始日期');
        }
      }
      return true;
    }),
];

// 时间段参数验证
export const periodValidation = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '3m'])
    .withMessage('时间段参数必须是 7d, 30d 或 3m'),
];

// 时区验证
export const timezoneValidation = [
  query('timezone')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('时区参数格式无效'),
];

// ID参数验证（用于路径参数）
export const idValidation = (paramName = 'id') => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName}不能为空`)
    .isInt({ min: 1 })
    .withMessage(`${paramName}必须是大于0的整数`),
];

// 记录ID验证
export const recordIdValidation = idValidation('recordId');

// 提醒ID验证
export const reminderIdValidation = idValidation('reminderId');

// 排序参数验证
export const sortValidation = (validFields = ['created_at', 'updated_at']) => [
  query('sort')
    .optional()
    .isIn(validFields)
    .withMessage(`排序字段必须是: ${validFields.join(', ')}`),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc'),
];

// 字符串长度验证
export const stringLengthValidation = (fieldName, min = 0, max = 255) => [
  body(fieldName)
    .optional()
    .isString()
    .isLength({ min, max })
    .withMessage(`${fieldName}长度必须在${min}-${max}字符之间`)
    .trim(),
];

// 非空字符串验证
export const requiredStringValidation = (fieldName, min = 1, max = 255) => [
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName}不能为空`)
    .isString()
    .isLength({ min, max })
    .withMessage(`${fieldName}长度必须在${min}-${max}字符之间`)
    .trim(),
];

// 数值范围验证
export const numberRangeValidation = (fieldName, min, max, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isNumeric()
      .withMessage(`${fieldName}必须是数字`)
      .custom(value => {
        const num = parseFloat(value);
        if (num < min || num > max) {
          throw new Error(`${fieldName}必须在${min}-${max}之间`);
        }
        return true;
      }),
  ];
};

// 整数范围验证
export const intRangeValidation = (fieldName, min, max, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isInt({ min, max })
      .withMessage(`${fieldName}必须是${min}-${max}之间的整数`),
  ];
};

// 枚举值验证
export const enumValidation = (fieldName, values, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isIn(values)
      .withMessage(`${fieldName}必须是以下值之一: ${values.join(', ')}`),
  ];
};

// 数组验证
export const arrayValidation = (fieldName, minItems = 0, maxItems = 100, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isArray({ min: minItems, max: maxItems })
      .withMessage(`${fieldName}必须是包含${minItems}-${maxItems}个元素的数组`),
  ];
};

// 布尔值验证
export const booleanValidation = (fieldName, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isBoolean()
      .withMessage(`${fieldName}必须是布尔值`),
  ];
};

// 日期时间验证
export const dateTimeValidation = (fieldName, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isISO8601()
      .withMessage(`${fieldName}必须是有效的日期时间格式`)
      .custom(value => {
        const date = new Date(value);
        const now = new Date();
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          throw new Error(`${fieldName}日期格式无效`);
        }
        
        // 检查是否是未来时间
        if (date > now) {
          throw new Error(`${fieldName}不能是未来时间`);
        }
        
        // 检查是否太久以前（超过1年）
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (date < oneYearAgo) {
          throw new Error(`${fieldName}不能超过1年前`);
        }
        
        return true;
      }),
  ];
};

// 邮箱验证
export const emailValidation = (fieldName = 'email', required = true) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isEmail()
      .withMessage(`${fieldName}格式无效`)
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage(`${fieldName}长度不能超过255字符`),
  ];
};

// URL验证
export const urlValidation = (fieldName, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .isURL({
        protocols: ['http', 'https'],
        require_protocol: true,
      })
      .withMessage(`${fieldName}必须是有效的URL地址`),
  ];
};

// 时间格式验证（HH:mm 或 HH:mm:ss）
export const timeFormatValidation = (fieldName, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .withMessage(`${fieldName}时间格式无效，请使用 HH:mm 或 HH:mm:ss 格式`),
  ];
};

// JSON字符串验证
export const jsonValidation = (fieldName, required = false) => {
  const validator = required ? body(fieldName).notEmpty().withMessage(`${fieldName}不能为空`) : body(fieldName).optional();
  
  return [
    validator
      .custom(value => {
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch (error) {
            throw new Error(`${fieldName}必须是有效的JSON字符串`);
          }
        } else if (typeof value === 'object') {
          return true; // 已经是对象，无需验证
        } else {
          throw new Error(`${fieldName}必须是JSON字符串或对象`);
        }
      }),
  ];
};

// 组合验证：通用查询参数
export const commonQueryValidation = [
  ...paginationValidation,
  ...dateRangeValidation,
  ...timezoneValidation,
];

// 组合验证：通用ID和分页
export const commonIdAndPaginationValidation = (paramName = 'id') => [
  ...idValidation(paramName),
  ...paginationValidation,
];