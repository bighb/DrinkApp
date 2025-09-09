/**
 * 提醒管理相关API文档定义 - JavaScript版本
 */

export const reminderDocs = {
  components: {
    schemas: {
      ReminderSettings: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: '是否启用提醒',
            example: true,
          },
          interval: {
            type: 'integer',
            description: '提醒间隔(分钟)',
            example: 60,
            minimum: 15,
            maximum: 480,
          },
          startTime: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: '开始时间(HH:mm格式)',
            example: '08:00',
          },
          endTime: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: '结束时间(HH:mm格式)',
            example: '22:00',
          },
          daysOfWeek: {
            type: 'array',
            items: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
            },
            description: '提醒日期(0=周日, 1=周一, ..., 6=周六)',
            example: [1, 2, 3, 4, 5],
          },
          smartReminder: {
            type: 'boolean',
            description: '是否启用智能提醒',
            example: true,
          },
          pushNotification: {
            type: 'boolean',
            description: '是否推送通知',
            example: true,
          },
        },
        required: ['enabled', 'interval', 'startTime', 'endTime'],
      },

      ReminderSettingsUpdate: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: '是否启用提醒',
            example: true,
          },
          interval: {
            type: 'integer',
            description: '提醒间隔(分钟)',
            example: 90,
            minimum: 15,
            maximum: 480,
          },
          startTime: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: '开始时间(HH:mm格式)',
            example: '09:00',
          },
          endTime: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: '结束时间(HH:mm格式)',
            example: '21:00',
          },
          daysOfWeek: {
            type: 'array',
            items: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
            },
            description: '提醒日期(0=周日, 1=周一, ..., 6=周六)',
            example: [1, 2, 3, 4, 5, 6],
          },
          smartReminder: {
            type: 'boolean',
            description: '是否启用智能提醒',
            example: false,
          },
          pushNotification: {
            type: 'boolean',
            description: '是否推送通知',
            example: true,
          },
        },
      },

      ReminderHistory: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: '提醒记录ID',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          },
          userId: {
            type: 'integer',
            description: '用户ID',
            example: 12345,
          },
          type: {
            type: 'string',
            enum: ['scheduled', 'smart', 'manual'],
            description: '提醒类型',
            example: 'scheduled',
          },
          sentAt: {
            type: 'string',
            format: 'date-time',
            description: '发送时间',
            example: '2024-01-15T10:00:00.000Z',
          },
          respondedAt: {
            type: 'string',
            format: 'date-time',
            description: '响应时间',
            example: '2024-01-15T10:05:00.000Z',
            nullable: true,
          },
          response: {
            type: 'string',
            enum: ['drank', 'dismissed', 'snoozed'],
            description: '用户响应',
            example: 'drank',
            nullable: true,
          },
          message: {
            type: 'string',
            description: '提醒消息内容',
            example: '该喝水了！保持健康的饮水习惯',
          },
        },
        required: ['id', 'userId', 'type', 'sentAt', 'message'],
      },

      TriggerReminderRequest: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['manual', 'test'],
            description: '触发类型',
            example: 'manual',
            default: 'manual',
          },
          customMessage: {
            type: 'string',
            description: '自定义消息(可选)',
            example: '记得喝水哦！',
            maxLength: 200,
          },
        },
      },

      ReminderResponse: {
        type: 'object',
        properties: {
          response: {
            type: 'string',
            enum: ['drank', 'dismissed', 'snoozed'],
            description: '用户响应类型',
            example: 'drank',
          },
          volume: {
            type: 'integer',
            description: '饮水量(毫升) - 仅当response为drank时需要',
            example: 250,
            minimum: 1,
            maximum: 2000,
          },
          snoozeMinutes: {
            type: 'integer',
            description: '稍后提醒时间(分钟) - 仅当response为snoozed时需要',
            example: 15,
            minimum: 5,
            maximum: 60,
          },
        },
        required: ['response'],
      },

      DeviceToken: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: '设备推送令牌',
            example: 'cXKz9wR5SomeFCMTokenExample123',
          },
          platform: {
            type: 'string',
            enum: ['ios', 'android', 'web'],
            description: '设备平台',
            example: 'ios',
          },
        },
        required: ['token', 'platform'],
      },

      ReminderStatistics: {
        type: 'object',
        properties: {
          totalSent: {
            type: 'integer',
            description: '总发送数',
            example: 150,
          },
          totalResponded: {
            type: 'integer',
            description: '总响应数',
            example: 120,
          },
          responseRate: {
            type: 'number',
            description: '响应率(%)',
            example: 80.0,
          },
          drankResponses: {
            type: 'integer',
            description: '"已喝水"响应数',
            example: 90,
          },
          dismissedResponses: {
            type: 'integer',
            description: '"忽略"响应数',
            example: 20,
          },
          snoozedResponses: {
            type: 'integer',
            description: '"稍后提醒"响应数',
            example: 10,
          },
          averageResponseTime: {
            type: 'number',
            description: '平均响应时间(分钟)',
            example: 3.5,
          },
        },
      },
    },
  },

  paths: {
    '/api/v1/reminders/settings': {
      get: {
        tags: ['Reminders'],
        summary: '获取提醒设置',
        description: '获取用户的提醒配置',
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
                        settings: { $ref: '#/components/schemas/ReminderSettings' },
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
        tags: ['Reminders'],
        summary: '更新提醒设置',
        description: '更新用户的提醒配置',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReminderSettingsUpdate' },
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
                    message: { type: 'string', example: '提醒设置更新成功' },
                    data: {
                      type: 'object',
                      properties: {
                        settings: { $ref: '#/components/schemas/ReminderSettings' },
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

    '/api/v1/reminders/history': {
      get: {
        tags: ['Reminders'],
        summary: '获取提醒历史',
        description: '获取用户的提醒历史记录',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          {
            name: 'startDate',
            in: 'query',
            description: '开始日期',
            required: false,
            schema: {
              type: 'string',
              format: 'date',
              example: '2024-01-01',
            },
          },
          {
            name: 'endDate',
            in: 'query',
            description: '结束日期',
            required: false,
            schema: {
              type: 'string',
              format: 'date',
              example: '2024-01-31',
            },
          },
        ],
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
                        reminders: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ReminderHistory' },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            page: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 20 },
                            total: { type: 'integer', example: 150 },
                            totalPages: { type: 'integer', example: 8 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/api/v1/reminders/trigger': {
      post: {
        tags: ['Reminders'],
        summary: '手动触发提醒',
        description: '手动发送提醒通知',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TriggerReminderRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: '提醒发送成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '提醒发送成功' },
                    data: {
                      type: 'object',
                      properties: {
                        reminderId: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
                        sentAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00.000Z' },
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

    '/api/v1/reminders/{reminderId}/respond': {
      post: {
        tags: ['Reminders'],
        summary: '响应提醒',
        description: '用户对提醒的响应',
        parameters: [{ $ref: '#/components/parameters/ReminderIdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReminderResponse' },
            },
          },
        },
        responses: {
          '200': {
            description: '响应成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '提醒响应记录成功' },
                    data: {
                      type: 'object',
                      properties: {
                        recordId: {
                          type: 'string',
                          description: '如果response为drank，返回创建的饮水记录ID',
                          example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
                          nullable: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/api/v1/reminders/device-token': {
      post: {
        tags: ['Reminders'],
        summary: '更新设备令牌',
        description: '更新用于推送通知的设备令牌',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeviceToken' },
            },
          },
        },
        responses: {
          '200': {
            description: '设备令牌更新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '设备令牌更新成功' },
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

    '/api/v1/reminders/statistics': {
      get: {
        tags: ['Reminders'],
        summary: '获取提醒统计',
        description: '获取提醒使用统计信息',
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: '统计周期',
            required: false,
            schema: {
              type: 'string',
              enum: ['7days', '30days', '90days'],
              default: '30days',
            },
          },
        ],
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
                        statistics: { $ref: '#/components/schemas/ReminderStatistics' },
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

export default reminderDocs;