/**
 * 提醒管理相关API文档定义
 */

// 提醒相关数据模型定义
export const reminderSchemas = {
  ReminderSettings: {
    type: 'object',
    properties: {
      is_enabled: {
        type: 'boolean',
        description: '是否启用提醒',
        example: true,
      },
      start_time: {
        type: 'string',
        format: 'time',
        description: '提醒开始时间',
        example: '08:00:00',
      },
      end_time: {
        type: 'string',
        format: 'time',
        description: '提醒结束时间',
        example: '22:00:00',
      },
      interval_minutes: {
        type: 'integer',
        minimum: 30,
        maximum: 480,
        description: '提醒间隔（分钟）',
        example: 120,
      },
      smart_reminders: {
        type: 'boolean',
        description: '是否启用智能提醒',
        example: true,
      },
      weekend_enabled: {
        type: 'boolean',
        description: '周末是否提醒',
        example: true,
      },
      reminder_types: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['push', 'sound', 'vibration', 'email'],
        },
        description: '提醒类型',
        example: ['push', 'sound'],
      },
      quiet_hours_start: {
        type: 'string',
        format: 'time',
        description: '免打扰开始时间',
        example: '22:00:00',
      },
      quiet_hours_end: {
        type: 'string',
        format: 'time',
        description: '免打扰结束时间',
        example: '08:00:00',
      },
      intensity_level: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '提醒强度',
        example: 'medium',
      },
      timezone: {
        type: 'string',
        description: '时区',
        example: 'Asia/Shanghai',
      },
    },
    required: ['is_enabled', 'start_time', 'end_time', 'interval_minutes', 'smart_reminders', 'weekend_enabled', 'reminder_types'],
  },

  ReminderLog: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: '提醒日志ID',
        example: 12345,
      },
      scheduled_time: {
        type: 'string',
        format: 'date-time',
        description: '计划发送时间',
        example: '2024-01-15T14:00:00.000Z',
      },
      sent_time: {
        type: 'string',
        format: 'date-time',
        description: '实际发送时间',
        example: '2024-01-15T14:00:05.000Z',
      },
      response_time: {
        type: 'string',
        format: 'date-time',
        description: '用户响应时间',
        example: '2024-01-15T14:02:30.000Z',
      },
      status: {
        type: 'string',
        enum: ['scheduled', 'sent', 'failed', 'responded'],
        description: '提醒状态',
        example: 'responded',
      },
      reminder_type: {
        type: 'string',
        enum: ['push', 'sound', 'vibration', 'email'],
        description: '提醒类型',
        example: 'push',
      },
      message_content: {
        type: 'string',
        description: '提醒消息内容',
        example: '💧 该喝水啦！今天还没开始补充水分呢～',
      },
      response_action: {
        type: 'string',
        enum: ['drink_logged', 'snooze', 'dismiss', 'disabled'],
        description: '用户响应动作',
        example: 'drink_logged',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: '创建时间',
        example: '2024-01-15T13:58:00.000Z',
      },
    },
    required: ['id', 'scheduled_time', 'status', 'reminder_type', 'message_content', 'created_at'],
  },

  ReminderStatistics: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        description: '统计周期',
        example: '30d',
      },
      total_reminders: {
        type: 'integer',
        description: '总提醒数',
        example: 120,
      },
      sent_reminders: {
        type: 'integer',
        description: '成功发送的提醒数',
        example: 115,
      },
      responded_reminders: {
        type: 'integer',
        description: '用户响应的提醒数',
        example: 85,
      },
      failed_reminders: {
        type: 'integer',
        description: '发送失败的提醒数',
        example: 5,
      },
      avg_response_delay: {
        type: 'number',
        description: '平均响应延迟（分钟）',
        example: 3.5,
      },
      total_amount_from_reminders: {
        type: 'number',
        description: '通过提醒记录的总饮水量（ml）',
        example: 12500,
      },
      response_rate: {
        type: 'number',
        description: '响应率（%）',
        example: 73.9,
      },
      success_rate: {
        type: 'number',
        description: '发送成功率（%）',
        example: 95.8,
      },
    },
    required: ['period', 'total_reminders', 'sent_reminders', 'responded_reminders', 'failed_reminders', 'response_rate', 'success_rate'],
  },

  SmartReminderSuggestion: {
    type: 'object',
    properties: {
      time: {
        type: 'string',
        format: 'time',
        description: '建议时间',
        example: '14:00:00',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: '信心度（0-1）',
        example: 0.85,
      },
      reason: {
        type: 'string',
        enum: ['historical_pattern', 'default_interval', 'activity_based'],
        description: '建议原因',
        example: 'historical_pattern',
      },
    },
    required: ['time', 'confidence', 'reason'],
  },

  PaginatedReminderLogs: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/ReminderLog' },
      },
      pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: '当前页码',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: '每页数量',
            example: 20,
          },
          total: {
            type: 'integer',
            description: '总记录数',
            example: 156,
          },
          pages: {
            type: 'integer',
            description: '总页数',
            example: 8,
          },
        },
        required: ['page', 'limit', 'total', 'pages'],
      },
    },
    required: ['data', 'pagination'],
  },
};

// API路径定义
export const reminderPaths = {
  '/api/v1/reminders/settings': {
    get: {
      summary: '获取提醒设置',
      description: '获取当前用户的提醒配置',
      tags: ['Reminder Management'],
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
                          settings: { $ref: '#/components/schemas/ReminderSettings' },
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
    put: {
      summary: '更新提醒设置',
      description: '修改用户的提醒配置',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                is_enabled: {
                  type: 'boolean',
                  description: '是否启用提醒',
                  example: true,
                },
                start_time: {
                  type: 'string',
                  format: 'time',
                  pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
                  description: '提醒开始时间（HH:mm 或 HH:mm:ss）',
                  example: '08:00:00',
                },
                end_time: {
                  type: 'string',
                  format: 'time',
                  pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
                  description: '提醒结束时间（HH:mm 或 HH:mm:ss）',
                  example: '22:00:00',
                },
                interval_minutes: {
                  type: 'integer',
                  minimum: 30,
                  maximum: 480,
                  description: '提醒间隔（30分钟到8小时）',
                  example: 120,
                },
                smart_reminders: {
                  type: 'boolean',
                  description: '是否启用智能提醒',
                  example: true,
                },
                weekend_enabled: {
                  type: 'boolean',
                  description: '周末是否提醒',
                  example: true,
                },
                reminder_types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['push', 'sound', 'vibration', 'email'],
                  },
                  minItems: 1,
                  description: '提醒类型',
                  example: ['push', 'sound'],
                },
                quiet_hours_start: {
                  type: 'string',
                  format: 'time',
                  description: '免打扰开始时间',
                  example: '22:00:00',
                },
                quiet_hours_end: {
                  type: 'string',
                  format: 'time',
                  description: '免打扰结束时间',
                  example: '08:00:00',
                },
                intensity_level: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: '提醒强度',
                  example: 'medium',
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
                          settings: { $ref: '#/components/schemas/ReminderSettings' },
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
              examples: {
                invalidTimeFormat: {
                  summary: '时间格式错误',
                  value: {
                    success: false,
                    error: 'INVALID_TIME_FORMAT',
                    message: 'start_time 时间格式无效，请使用 HH:mm 或 HH:mm:ss 格式',
                  },
                },
                invalidInterval: {
                  summary: '间隔时间无效',
                  value: {
                    success: false,
                    error: 'INVALID_INTERVAL',
                    message: '提醒间隔应在30分钟到8小时之间',
                  },
                },
                invalidReminderTypes: {
                  summary: '提醒类型无效',
                  value: {
                    success: false,
                    error: 'INVALID_REMINDER_TYPES',
                    message: '无效的提醒类型: invalid_type',
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

  '/api/v1/reminders/history': {
    get: {
      summary: '获取提醒历史记录',
      description: '分页获取用户的提醒历史记录',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: '页码',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        {
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
        {
          name: 'startDate',
          in: 'query',
          description: '开始日期',
          schema: {
            type: 'string',
            format: 'date',
          },
        },
        {
          name: 'endDate',
          in: 'query',
          description: '结束日期',
          schema: {
            type: 'string',
            format: 'date',
          },
        },
        {
          name: 'status',
          in: 'query',
          description: '提醒状态',
          schema: {
            type: 'string',
            enum: ['scheduled', 'sent', 'failed', 'responded'],
          },
        },
        {
          name: 'reminderType',
          in: 'query',
          description: '提醒类型',
          schema: {
            type: 'string',
            enum: ['push', 'sound', 'vibration', 'email'],
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
                      data: { $ref: '#/components/schemas/PaginatedReminderLogs' },
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

  '/api/v1/reminders/trigger': {
    post: {
      summary: '手动触发提醒',
      description: '立即发送一条饮水提醒',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: '提醒发送成功',
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
                          reminder_id: {
                            type: 'integer',
                            description: '提醒ID',
                            example: 12345,
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
          description: '请求失败',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'REMINDERS_DISABLED',
                message: '提醒功能已关闭',
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
        429: {
          description: '请求过于频繁',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/reminders/{reminderId}/respond': {
    post: {
      summary: '响应提醒',
      description: '记录用户对提醒的响应动作',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'reminderId',
          in: 'path',
          required: true,
          description: '提醒ID',
          schema: {
            type: 'integer',
            minimum: 1,
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['responseAction'],
              properties: {
                responseAction: {
                  type: 'string',
                  enum: ['drink_logged', 'snooze', 'dismiss', 'disabled'],
                  description: '响应动作',
                  example: 'drink_logged',
                },
                amountLogged: {
                  type: 'number',
                  minimum: 0,
                  description: '记录的饮水量（仅当responseAction为drink_logged时有效）',
                  example: 250,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '响应记录成功',
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
                          response_action: {
                            type: 'string',
                            description: '响应动作',
                            example: 'drink_logged',
                          },
                          response_delay_minutes: {
                            type: 'number',
                            description: '响应延迟时间（分钟）',
                            example: 2.5,
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
              examples: {
                invalidReminderId: {
                  summary: '提醒ID无效',
                  value: {
                    success: false,
                    error: 'INVALID_REMINDER_ID',
                    message: '无效的提醒ID',
                  },
                },
                invalidResponseAction: {
                  summary: '响应动作无效',
                  value: {
                    success: false,
                    error: 'INVALID_RESPONSE_ACTION',
                    message: '无效的响应动作',
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
        404: {
          description: '提醒记录不存在',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'REMINDER_NOT_FOUND',
                message: '提醒记录不存在',
              },
            },
          },
        },
      },
    },
  },

  '/api/v1/reminders/smart-suggestions': {
    get: {
      summary: '获取智能提醒建议',
      description: '基于用户历史数据生成智能提醒时间建议',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'date',
          in: 'query',
          description: '目标日期',
          schema: {
            type: 'string',
            format: 'date',
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
                      data: {
                        type: 'object',
                        properties: {
                          suggestions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/SmartReminderSuggestion' },
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

  '/api/v1/reminders/statistics': {
    get: {
      summary: '获取提醒统计信息',
      description: '获取用户的提醒效果统计和分析',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'period',
          in: 'query',
          description: '统计周期',
          schema: {
            type: 'string',
            enum: ['7d', '30d', '3m'],
            default: '30d',
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
                      data: {
                        type: 'object',
                        properties: {
                          statistics: { $ref: '#/components/schemas/ReminderStatistics' },
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

  '/api/v1/reminders/device-token': {
    post: {
      summary: '更新设备令牌',
      description: '更新用于推送通知的设备令牌',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['deviceToken'],
              properties: {
                deviceToken: {
                  type: 'string',
                  minLength: 10,
                  description: '设备推送令牌',
                  example: 'fGzKjH8eQX2...',
                },
                deviceType: {
                  type: 'string',
                  enum: ['mobile', 'web', 'tablet'],
                  description: '设备类型',
                  default: 'mobile',
                  example: 'mobile',
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
              schema: { $ref: '#/components/schemas/ApiResponse' },
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
                error: 'INVALID_DEVICE_TYPE',
                message: '无效的设备类型',
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
        429: {
          description: '请求过于频繁',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/reminders/test': {
    post: {
      summary: '测试提醒推送',
      description: '发送测试提醒以验证推送功能是否正常',
      tags: ['Reminder Management'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: '测试提醒发送成功',
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
                          reminder_id: {
                            type: 'integer',
                            description: '测试提醒ID',
                            example: 12345,
                          },
                          device_count: {
                            type: 'integer',
                            description: '发送到的设备数量',
                            example: 2,
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
          description: '测试失败',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'NO_DEVICES_FOUND',
                message: '未找到可用设备，请先注册设备令牌',
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
        429: {
          description: '请求过于频繁',
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