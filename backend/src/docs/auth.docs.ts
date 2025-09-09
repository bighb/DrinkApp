/**
 * 认证相关API文档定义
 */

// 通用数据模型定义
export const authSchemas = {
  AuthTokens: {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        description: '访问令牌',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshToken: {
        type: 'string',
        description: '刷新令牌',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        description: '令牌过期时间',
        example: '2024-12-31T23:59:59.000Z',
      },
    },
    required: ['accessToken', 'refreshToken', 'expiresAt'],
  },

  UserProfile: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: '用户ID',
        example: 12345,
      },
      email: {
        type: 'string',
        format: 'email',
        description: '邮箱地址',
        example: 'user@example.com',
      },
      username: {
        type: 'string',
        description: '用户名',
        example: 'john_doe',
      },
      fullName: {
        type: 'string',
        description: '用户全名',
        example: '张三',
      },
      avatarUrl: {
        type: 'string',
        format: 'uri',
        description: '头像URL',
        example: 'https://example.com/avatars/user123.jpg',
      },
      emailVerified: {
        type: 'boolean',
        description: '邮箱是否已验证',
        example: true,
      },
      accountStatus: {
        type: 'string',
        enum: ['active', 'suspended', 'deleted'],
        description: '账户状态',
        example: 'active',
      },
      timezone: {
        type: 'string',
        description: '时区',
        example: 'Asia/Shanghai',
      },
      language: {
        type: 'string',
        description: '语言偏好',
        example: 'zh-CN',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '账户创建时间',
        example: '2024-01-01T12:00:00.000Z',
      },
    },
    required: ['id', 'email', 'username', 'emailVerified', 'accountStatus', 'createdAt'],
  },

  ApiResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: '请求是否成功',
        example: true,
      },
      message: {
        type: 'string',
        description: '响应消息',
        example: '操作成功',
      },
      data: {
        type: 'object',
        description: '响应数据',
      },
      error: {
        type: 'string',
        description: '错误代码',
        example: 'VALIDATION_ERROR',
      },
      details: {
        type: 'array',
        description: '详细错误信息',
        items: {
          type: 'object',
        },
      },
    },
    required: ['success'],
  },
};

// API路径定义
export const authPaths = {
  '/api/v1/auth/register': {
    post: {
      summary: '用户注册',
      description: '创建新用户账户',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'username', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: '邮箱地址',
                  example: 'user@example.com',
                },
                username: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 20,
                  pattern: '^[a-zA-Z0-9_]+$',
                  description: '用户名（3-20位字母数字下划线）',
                  example: 'john_doe',
                },
                password: {
                  type: 'string',
                  minLength: 8,
                  description: '密码（至少8位）',
                  example: 'SecurePassword123',
                },
                fullName: {
                  type: 'string',
                  maxLength: 50,
                  description: '用户全名',
                  example: '张三',
                },
                gender: {
                  type: 'string',
                  enum: ['male', 'female', 'other', 'prefer_not_to_say'],
                  description: '性别',
                  example: 'male',
                },
                dateOfBirth: {
                  type: 'string',
                  format: 'date',
                  description: '出生日期',
                  example: '1990-01-01',
                },
                height: {
                  type: 'number',
                  minimum: 100,
                  maximum: 300,
                  description: '身高（厘米）',
                  example: 175,
                },
                weight: {
                  type: 'number',
                  minimum: 20,
                  maximum: 500,
                  description: '体重（公斤）',
                  example: 70,
                },
                activityLevel: {
                  type: 'string',
                  enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
                  description: '活动水平',
                  example: 'moderately_active',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: '注册成功',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/UserProfile' },
                          tokens: { $ref: '#/components/schemas/AuthTokens' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
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
        409: {
          description: '用户已存在',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'USER_ALREADY_EXISTS',
                message: '邮箱已被注册',
                field: 'email',
              },
            },
          },
        },
        429: {
          description: '请求过于频繁',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/login': {
    post: {
      summary: '用户登录',
      description: '使用邮箱或用户名登录',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['login', 'password'],
              properties: {
                login: {
                  type: 'string',
                  description: '邮箱或用户名',
                  example: 'user@example.com',
                },
                password: {
                  type: 'string',
                  description: '密码',
                  example: 'SecurePassword123',
                },
                rememberMe: {
                  type: 'boolean',
                  description: '记住登录状态',
                  example: false,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '登录成功',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/UserProfile' },
                          tokens: { $ref: '#/components/schemas/AuthTokens' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        401: {
          description: '认证失败',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: '邮箱/用户名或密码错误',
              },
            },
          },
        },
        429: {
          description: '请求过于频繁',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/refresh': {
    post: {
      summary: '刷新令牌',
      description: '使用刷新令牌获取新的访问令牌',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: {
                  type: 'string',
                  description: '刷新令牌',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '令牌刷新成功',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          tokens: { $ref: '#/components/schemas/AuthTokens' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        401: {
          description: '刷新令牌无效',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'INVALID_REFRESH_TOKEN',
                message: '刷新令牌无效或已过期',
              },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/logout': {
    post: {
      summary: '用户登出',
      description: '注销当前会话或所有设备的会话',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                logoutAllDevices: {
                  type: 'boolean',
                  description: '是否注销所有设备',
                  example: false,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '登出成功',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/me': {
    get: {
      summary: '获取当前用户信息',
      description: '获取当前登录用户的详细信息',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: '获取成功',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/UserProfile' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        404: {
          description: '用户不存在',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },
};

// 安全配置
export const authSecurity = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
};