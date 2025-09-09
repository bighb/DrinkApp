/**
 * 用户管理相关API文档定义
 */

// 用户相关数据模型定义
export const userSchemas = {
  UserStatistics: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        description: '统计周期',
        example: '7d',
      },
      today: {
        type: 'object',
        properties: {
          today_intake: {
            type: 'number',
            description: '今日饮水量（ml）',
            example: 1500,
          },
          today_records: {
            type: 'number',
            description: '今日记录次数',
            example: 8,
          },
          daily_goal: {
            type: 'number',
            description: '每日目标（ml）',
            example: 2000,
          },
          progress_percentage: {
            type: 'number',
            description: '完成百分比',
            example: 75.0,
          },
        },
      },
      statistics: {
        type: 'array',
        description: '历史统计数据',
        items: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date',
              description: '日期',
              example: '2024-01-15',
            },
            total_intake: {
              type: 'number',
              description: '总饮水量（ml）',
              example: 1800,
            },
            record_count: {
              type: 'number',
              description: '记录次数',
              example: 6,
            },
            goal_achieved: {
              type: 'boolean',
              description: '是否达成目标',
              example: false,
            },
          },
        },
      },
      achievement: {
        type: 'object',
        properties: {
          total_days: {
            type: 'number',
            description: '统计总天数',
            example: 30,
          },
          achieved_days: {
            type: 'number',
            description: '达标天数',
            example: 18,
          },
          achievement_rate: {
            type: 'number',
            description: '达标率（%）',
            example: 60.0,
          },
        },
      },
      activity: {
        type: 'object',
        properties: {
          total_days_with_records: {
            type: 'number',
            description: '有记录的天数',
            example: 25,
          },
          avg_records_per_day: {
            type: 'number',
            description: '平均每日记录次数',
            example: 6.2,
          },
        },
      },
    },
    required: ['period', 'today', 'statistics', 'achievement', 'activity'],
  },

  UserPreferences: {
    type: 'object',
    properties: {
      drink_types: {
        type: 'array',
        description: '饮品类型偏好统计',
        items: {
          type: 'object',
          properties: {
            drink_type: {
              type: 'string',
              description: '饮品类型',
              example: 'water',
            },
            count: {
              type: 'number',
              description: '记录次数',
              example: 45,
            },
            total_amount: {
              type: 'number',
              description: '总饮用量（ml）',
              example: 9000,
            },
            avg_amount: {
              type: 'number',
              description: '平均饮用量（ml）',
              example: 200,
            },
          },
        },
      },
      time_pattern: {
        type: 'array',
        description: '时间段偏好统计',
        items: {
          type: 'object',
          properties: {
            hour: {
              type: 'number',
              description: '小时（0-23）',
              example: 8,
            },
            count: {
              type: 'number',
              description: '该时段记录次数',
              example: 12,
            },
            avg_amount: {
              type: 'number',
              description: '该时段平均饮水量（ml）',
              example: 250,
            },
          },
        },
      },
    },
    required: ['drink_types', 'time_pattern'],
  },
};

// API路径定义
export const userPaths = {
  '/api/v1/users/profile': {
    get: {
      summary: '获取用户资料',
      description: '获取当前用户的详细资料信息',
      tags: ['User Management'],
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
      },
    },
    put: {
      summary: '更新用户资料',
      description: '更新当前用户的基本信息',
      tags: ['User Management'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                  maxLength: 50,
                  description: '用户全名',
                  example: '李四',
                },
                gender: {
                  type: 'string',
                  enum: ['male', 'female', 'other', 'prefer_not_to_say'],
                  description: '性别',
                  example: 'female',
                },
                dateOfBirth: {
                  type: 'string',
                  format: 'date',
                  description: '出生日期',
                  example: '1995-06-15',
                },
                height: {
                  type: 'number',
                  minimum: 100,
                  maximum: 300,
                  description: '身高（厘米）',
                  example: 165,
                },
                weight: {
                  type: 'number',
                  minimum: 20,
                  maximum: 500,
                  description: '体重（公斤）',
                  example: 55,
                },
                activityLevel: {
                  type: 'string',
                  enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
                  description: '活动水平',
                  example: 'lightly_active',
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
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '更新成功',
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
                          suggested_daily_goal: {
                            type: 'number',
                            description: '建议的每日饮水目标（ml）',
                            example: 2200,
                          },
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
          description: '未授权',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/users/statistics': {
    get: {
      summary: '获取用户统计信息',
      description: '获取用户的饮水统计数据和活动分析',
      tags: ['User Management'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'period',
          in: 'query',
          description: '统计周期',
          schema: {
            type: 'string',
            enum: ['7d', '30d', '3m'],
            default: '7d',
          },
        },
        {
          name: 'timezone',
          in: 'query',
          description: '时区',
          schema: {
            type: 'string',
            default: 'UTC',
          },
        },
      ],
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
                      data: { $ref: '#/components/schemas/UserStatistics' },
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
          description: '未授权',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/users/goal': {
    put: {
      summary: '更新饮水目标',
      description: '设置或更新用户的每日饮水目标',
      tags: ['User Management'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['goalValue'],
              properties: {
                goalValue: {
                  type: 'number',
                  minimum: 500,
                  maximum: 8000,
                  description: '每日饮水目标（ml）',
                  example: 2500,
                },
                goalType: {
                  type: 'string',
                  enum: ['daily', 'weekly', 'custom'],
                  description: '目标类型',
                  default: 'daily',
                  example: 'daily',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '更新成功',
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
                          daily_goal: {
                            type: 'number',
                            description: '每日目标（ml）',
                            example: 2500,
                          },
                          goal_type: {
                            type: 'string',
                            description: '目标类型',
                            example: 'daily',
                          },
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
          description: '未授权',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/users/password': {
    put: {
      summary: '修改密码',
      description: '修改用户登录密码',
      tags: ['User Management'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  description: '当前密码',
                  example: 'OldPassword123',
                },
                newPassword: {
                  type: 'string',
                  minLength: 8,
                  description: '新密码（至少8位）',
                  example: 'NewPassword456',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '修改成功',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        400: {
          description: '请求参数错误或当前密码错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              examples: {
                invalidCurrentPassword: {
                  summary: '当前密码错误',
                  value: {
                    success: false,
                    error: 'INVALID_CURRENT_PASSWORD',
                    message: '当前密码错误',
                  },
                },
                samePassword: {
                  summary: '新密码与当前密码相同',
                  value: {
                    success: false,
                    error: 'SAME_PASSWORD',
                    message: '新密码不能与当前密码相同',
                  },
                },
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
      },
    },
  },

  '/api/v1/users/preferences': {
    get: {
      summary: '获取用户偏好分析',
      description: '获取用户的饮水偏好和时间模式分析',
      tags: ['User Management'],
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
                          preferences: { $ref: '#/components/schemas/UserPreferences' },
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
      },
    },
  },

  '/api/v1/users/export': {
    get: {
      summary: '导出用户数据',
      description: '导出用户的所有数据（包括资料、记录、统计等）',
      tags: ['User Management'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: '导出成功',
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
                          profile: { $ref: '#/components/schemas/UserProfile' },
                          statistics: { $ref: '#/components/schemas/UserStatistics' },
                          preferences: { $ref: '#/components/schemas/UserPreferences' },
                          recent_records: {
                            type: 'array',
                            description: '最近90天的饮水记录',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer' },
                                amount: { type: 'number' },
                                drink_type: { type: 'string' },
                                recorded_at: { type: 'string', format: 'date-time' },
                                location: { type: 'string' },
                              },
                            },
                          },
                          export_date: {
                            type: 'string',
                            format: 'date-time',
                            description: '导出时间',
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          headers: {
            'Content-Disposition': {
              description: '文件下载头',
              schema: {
                type: 'string',
                example: 'attachment; filename="user_data_export_12345_1640995200000.json"',
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
      },
    },
  },

  '/api/v1/users/account': {
    delete: {
      summary: '删除用户账户',
      description: '永久删除用户账户及所有相关数据（软删除）',
      tags: ['User Management'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password', 'confirmText'],
              properties: {
                password: {
                  type: 'string',
                  description: '当前密码',
                  example: 'MyPassword123',
                },
                confirmText: {
                  type: 'string',
                  description: '确认文本（必须输入："删除我的账户"）',
                  example: '删除我的账户',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '删除成功',
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
              examples: {
                invalidConfirmation: {
                  summary: '确认文本错误',
                  value: {
                    success: false,
                    error: 'INVALID_CONFIRMATION',
                    message: '请输入正确的确认文本："删除我的账户"',
                  },
                },
                invalidPassword: {
                  summary: '密码错误',
                  value: {
                    success: false,
                    error: 'INVALID_PASSWORD',
                    message: '密码错误',
                  },
                },
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
        403: {
          description: '权限不足',
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