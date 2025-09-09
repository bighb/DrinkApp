/**
 * 用户管理相关API文档定义 - JavaScript版本
 */

export const userDocs = {
  components: {
    schemas: {
      UserProfileUpdate: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            description: '全名',
            example: 'John Doe',
          },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            description: '出生日期',
            example: '1990-01-01',
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other'],
            description: '性别',
            example: 'male',
          },
          weight: {
            type: 'number',
            description: '体重(kg)',
            example: 70.5,
            minimum: 20,
            maximum: 300,
          },
          height: {
            type: 'number',
            description: '身高(cm)',
            example: 175,
            minimum: 100,
            maximum: 250,
          },
        },
      },

      WaterGoalUpdate: {
        type: 'object',
        properties: {
          dailyGoal: {
            type: 'integer',
            description: '每日饮水目标(毫升)',
            example: 2000,
            minimum: 500,
            maximum: 5000,
          },
        },
        required: ['dailyGoal'],
      },

      PasswordChange: {
        type: 'object',
        properties: {
          currentPassword: {
            type: 'string',
            description: '当前密码',
            example: 'OldPassword123!',
          },
          newPassword: {
            type: 'string',
            description: '新密码',
            example: 'NewPassword123!',
          },
        },
        required: ['currentPassword', 'newPassword'],
      },

      UserStatistics: {
        type: 'object',
        properties: {
          totalRecords: {
            type: 'integer',
            description: '总记录数',
            example: 150,
          },
          totalVolume: {
            type: 'integer',
            description: '总饮水量(毫升)',
            example: 45000,
          },
          averageDaily: {
            type: 'number',
            description: '日均饮水量(毫升)',
            example: 1800.5,
          },
          streakDays: {
            type: 'integer',
            description: '连续达标天数',
            example: 7,
          },
        },
      },
    },
  },

  paths: {
    '/api/v1/users/profile': {
      get: {
        tags: ['User Management'],
        summary: '获取用户资料',
        description: '获取当前用户的详细资料信息',
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

      put: {
        tags: ['User Management'],
        summary: '更新用户资料',
        description: '更新当前用户的资料信息',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserProfileUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: '更新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '用户资料更新成功' },
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
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/api/v1/users/goal': {
      put: {
        tags: ['User Management'],
        summary: '更新饮水目标',
        description: '更新用户的每日饮水目标',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WaterGoalUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: '目标更新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '饮水目标更新成功' },
                    data: {
                      type: 'object',
                      properties: {
                        dailyGoal: { type: 'integer', example: 2000 },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/api/v1/users/password': {
      put: {
        tags: ['User Management'],
        summary: '修改密码',
        description: '修改用户登录密码',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PasswordChange' },
            },
          },
        },
        responses: {
          '200': {
            description: '密码修改成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '密码修改成功' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/api/v1/users/statistics': {
      get: {
        tags: ['User Management'],
        summary: '获取用户统计信息',
        description: '获取用户的饮水统计数据',
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
                        statistics: { $ref: '#/components/schemas/UserStatistics' },
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

export default userDocs;