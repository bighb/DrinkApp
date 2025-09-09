/**
 * 认证相关API文档定义 - JavaScript版本
 */

export const authDocs = {
  components: {
    schemas: {
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
            description: '全名',
            example: 'John Doe',
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: '头像URL',
            example: 'https://example.com/avatars/john_doe.jpg',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '注册时间',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
        required: ['id', 'email', 'username', 'createdAt'],
      },

      LoginRequest: {
        type: 'object',
        properties: {
          emailOrUsername: {
            type: 'string',
            description: '邮箱或用户名',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            description: '密码',
            example: 'SecurePassword123!',
          },
        },
        required: ['emailOrUsername', 'password'],
      },

      RegisterRequest: {
        type: 'object',
        properties: {
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
          password: {
            type: 'string',
            description: '密码',
            example: 'SecurePassword123!',
          },
          fullName: {
            type: 'string',
            description: '全名',
            example: 'John Doe',
          },
        },
        required: ['email', 'username', 'password', 'fullName'],
      },
    },
  },

  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: '用户注册',
        description: '创建新用户账户',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: '注册成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '注册成功' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserProfile' },
                        tokens: { $ref: '#/components/schemas/AuthTokens' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': {
            description: '用户已存在',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'USER_EXISTS' },
                    message: { type: 'string', example: '邮箱或用户名已被使用' },
                  },
                },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [],
      },
    },

    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: '用户登录',
        description: '用户账户登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '登录成功' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserProfile' },
                        tokens: { $ref: '#/components/schemas/AuthTokens' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': {
            description: '登录失败',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'INVALID_CREDENTIALS' },
                    message: { type: 'string', example: '邮箱/用户名或密码错误' },
                  },
                },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [],
      },
    },

    '/api/v1/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: '刷新访问令牌',
        description: '使用刷新令牌获取新的访问令牌',
        responses: {
          '200': {
            description: '令牌刷新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '令牌刷新成功' },
                    data: {
                      type: 'object',
                      properties: {
                        tokens: { $ref: '#/components/schemas/AuthTokens' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ refreshToken: [] }],
      },
    },

    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: '用户登出',
        description: '注销当前用户会话',
        responses: {
          '200': {
            description: '登出成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '登出成功' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: '获取当前用户信息',
        description: '获取当前登录用户的详细信息',
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserProfile' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
};

export default authDocs;