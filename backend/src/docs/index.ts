/**
 * 统一的Swagger文档配置
 */

import { authSchemas, authPaths, authSecurity } from './auth.docs.js';
import { userSchemas, userPaths } from './user.docs.js';
import { hydrationSchemas, hydrationPaths } from './hydration.docs.js';
import { reminderSchemas, reminderPaths } from './reminder.docs.js';

// Swagger基础配置
export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: '喝水提醒 API',
    version: '1.0.0',
    description: `
## 喝水提醒应用 RESTful API 文档

这是一个智能饮水管理应用的后端API，提供用户管理、饮水记录、智能提醒等功能。

### 功能特性
- 🔐 完整的用户认证系统
- 💧 智能饮水记录管理
- ⏰ 个性化提醒设置
- 📊 详细的统计分析
- 📱 多设备推送支持

### API版本
当前版本：v1.0.0

### 认证方式
API使用JWT Bearer Token进行认证。请在请求头中包含：
\`Authorization: Bearer <your-access-token>\`

### 响应格式
所有API响应都遵循统一的格式：
\`\`\`json
{
  "success": true,
  "message": "操作成功",
  "data": {...},
  "error": "ERROR_CODE", // 仅错误时存在
  "details": [...] // 仅验证错误时存在
}
\`\`\`

### 错误码说明
- \`VALIDATION_ERROR\` - 输入参数验证失败
- \`UNAUTHORIZED\` - 未授权访问
- \`FORBIDDEN\` - 权限不足
- \`NOT_FOUND\` - 资源不存在
- \`RATE_LIMIT_EXCEEDED\` - 请求频率超限
- \`INTERNAL_ERROR\` - 服务器内部错误

### 开发环境
- 开发服务器：http://localhost:3000
- 测试环境：https://test-api.drinkapp.com
- 生产环境：https://api.drinkapp.com
    `,
    contact: {
      name: 'API Support',
      url: 'https://github.com/drinkapp/backend',
      email: 'support@drinkapp.com',
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
      url: 'https://test-api.drinkapp.com',
      description: '测试环境',
    },
    {
      url: 'https://api.drinkapp.com',
      description: '生产环境',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: '用户认证相关接口',
    },
    {
      name: 'User Management',
      description: '用户管理相关接口',
    },
    {
      name: 'Hydration Records',
      description: '饮水记录相关接口',
    },
    {
      name: 'Reminder Management',
      description: '提醒管理相关接口',
    },
  ],
  components: {
    schemas: {
      // 合并所有数据模型
      ...authSchemas,
      ...userSchemas,
      ...hydrationSchemas,
      ...reminderSchemas,
    },
    securitySchemes: {
      ...authSecurity,
    },
    parameters: {
      // 通用参数定义
      PageParam: {
        name: 'page',
        in: 'query',
        description: '页码',
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
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      StartDateParam: {
        name: 'startDate',
        in: 'query',
        description: '开始日期',
        schema: {
          type: 'string',
          format: 'date',
          example: '2024-01-01',
        },
      },
      EndDateParam: {
        name: 'endDate',
        in: 'query',
        description: '结束日期',
        schema: {
          type: 'string',
          format: 'date',
          example: '2024-01-31',
        },
      },
      TimezoneParam: {
        name: 'timezone',
        in: 'query',
        description: '时区',
        schema: {
          type: 'string',
          default: 'UTC',
          example: 'Asia/Shanghai',
        },
      },
    },
    responses: {
      // 通用响应定义
      UnauthorizedError: {
        description: '未授权',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
            example: {
              success: false,
              error: 'UNAUTHORIZED',
              message: '请先登录',
            },
          },
        },
      },
      ForbiddenError: {
        description: '权限不足',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
            example: {
              success: false,
              error: 'FORBIDDEN',
              message: '权限不足',
            },
          },
        },
      },
      NotFoundError: {
        description: '资源不存在',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
            example: {
              success: false,
              error: 'NOT_FOUND',
              message: '资源不存在',
            },
          },
        },
      },
      ValidationError: {
        description: '验证错误',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
            example: {
              success: false,
              error: 'VALIDATION_ERROR',
              message: '输入数据验证失败',
              details: [
                {
                  field: 'email',
                  message: '邮箱格式不正确',
                },
              ],
            },
          },
        },
      },
      RateLimitError: {
        description: '请求频率超限',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
            example: {
              success: false,
              error: 'RATE_LIMIT_EXCEEDED',
              message: '请求过于频繁，请稍后再试',
            },
          },
        },
        headers: {
          'X-RateLimit-Limit': {
            description: '速率限制',
            schema: {
              type: 'integer',
            },
          },
          'X-RateLimit-Remaining': {
            description: '剩余请求次数',
            schema: {
              type: 'integer',
            },
          },
          'X-RateLimit-Reset': {
            description: '重置时间戳',
            schema: {
              type: 'integer',
            },
          },
        },
      },
      InternalServerError: {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
            example: {
              success: false,
              error: 'INTERNAL_ERROR',
              message: '服务器内部错误',
            },
          },
        },
      },
    },
  },
  paths: {
    // 合并所有路径定义
    ...authPaths,
    ...userPaths,
    ...hydrationPaths,
    ...reminderPaths,
  },
  // 全局安全配置
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// 导出用于swagger-ui-express的配置
export const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none', // 默认折叠所有操作
    filter: true, // 启用搜索过滤
    showRequestHeaders: true, // 显示请求头
    showCommonExtensions: true, // 显示通用扩展
    tryItOutEnabled: true, // 启用"Try it out"功能
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #2563eb; font-size: 2rem; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .swagger-ui .opblock.opblock-post { border-color: #059669; background: rgba(5, 150, 105, 0.1); }
    .swagger-ui .opblock.opblock-get { border-color: #0d9488; background: rgba(13, 148, 136, 0.1); }
    .swagger-ui .opblock.opblock-put { border-color: #ea580c; background: rgba(234, 88, 12, 0.1); }
    .swagger-ui .opblock.opblock-delete { border-color: #dc2626; background: rgba(220, 38, 38, 0.1); }
  `,
  customSiteTitle: '喝水提醒 API 文档',
  customfavIcon: '/favicon.ico',
};

export default swaggerConfig;