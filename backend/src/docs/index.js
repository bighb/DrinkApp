// Swagger API文档汇总 - JavaScript ES Module版本
import { authDocs } from './auth.docs.js';
import { userDocs } from './user.docs.js';
import { hydrationDocs } from './hydration.docs.js';
import { reminderDocs } from './reminder.docs.js';

// 基础Swagger配置
const baseConfig = {
  openapi: '3.0.0',
  info: {
    title: 'HydrationTracker API',
    version: '1.0.0',
    description: '智能饮水管理应用API文档',
    contact: {
      name: 'HydrationTracker Team',
      email: 'support@hydrationtracker.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '开发环境',
    },
    {
      url: 'https://api.hydrationtracker.com',
      description: '生产环境',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT认证令牌',
      },
      refreshToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '刷新令牌',
      },
    },
    parameters: {
      // 通用分页参数
      PageParam: {
        name: 'page',
        in: 'query',
        description: '页码（从1开始）',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: '每页数量',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      // 通用ID参数
      UserIdParam: {
        name: 'userId',
        in: 'path',
        description: '用户ID',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
      RecordIdParam: {
        name: 'recordId',
        in: 'path',
        description: '记录ID',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
      ReminderIdParam: {
        name: 'reminderId',
        in: 'path',
        description: '提醒ID',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    responses: {
      // 通用错误响应
      BadRequest: {
        description: '请求参数错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'BAD_REQUEST' },
                message: { type: 'string', example: '请求参数不正确' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: '未授权访问',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'UNAUTHORIZED' },
                message: { type: 'string', example: '访问令牌无效或已过期' },
              },
            },
          },
        },
      },
      Forbidden: {
        description: '访问被禁止',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'FORBIDDEN' },
                message: { type: 'string', example: '没有足够的权限执行此操作' },
              },
            },
          },
        },
      },
      NotFound: {
        description: '资源未找到',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: '请求的资源不存在' },
              },
            },
          },
        },
      },
      RateLimit: {
        description: '请求频率超限',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
                message: { type: 'string', example: '请求过于频繁，请稍后再试' },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
                message: { type: 'string', example: '服务器内部错误' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: '用户认证和授权相关接口',
    },
    {
      name: 'User Management',
      description: '用户管理相关接口',
    },
    {
      name: 'Hydration Records',
      description: '饮水记录管理接口',
    },
    {
      name: 'Reminders',
      description: '提醒设置和管理接口',
    },
  ],
};

// 深度合并所有文档配置
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// 合并所有文档配置
export const swaggerSpec = deepMerge(
  {},
  baseConfig,
  {
    paths: {
      ...authDocs.paths,
      ...userDocs.paths,
      ...hydrationDocs.paths,
      ...reminderDocs.paths,
    },
    components: {
      ...baseConfig.components,
      schemas: {
        ...authDocs.components?.schemas,
        ...userDocs.components?.schemas,
        ...hydrationDocs.components?.schemas,
        ...reminderDocs.components?.schemas,
      },
    },
  }
);

export default swaggerSpec;