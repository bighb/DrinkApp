/**
 * 饮水记录相关API文档定义
 */

// 饮水记录相关数据模型定义
export const hydrationSchemas = {
  HydrationRecord: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: '记录ID',
        example: 12345,
      },
      amount: {
        type: 'number',
        minimum: 10,
        maximum: 5000,
        description: '饮水量（ml）',
        example: 250,
      },
      drink_type: {
        type: 'string',
        enum: ['water', 'tea', 'coffee', 'juice', 'milk', 'sports_drink', 'soda', 'other'],
        description: '饮品类型',
        example: 'water',
      },
      drink_name: {
        type: 'string',
        maxLength: 50,
        description: '饮品名称',
        example: '矿泉水',
      },
      recorded_at: {
        type: 'string',
        format: 'date-time',
        description: '记录时间',
        example: '2024-01-15T14:30:00.000Z',
      },
      location: {
        type: 'string',
        maxLength: 100,
        description: '地点',
        example: '办公室',
      },
      activity_context: {
        type: 'string',
        maxLength: 100,
        description: '活动场景',
        example: '工作中',
      },
      temperature: {
        type: 'string',
        enum: ['cold', 'room', 'warm', 'hot'],
        description: '温度',
        example: 'room',
      },
      source: {
        type: 'string',
        enum: ['manual', 'auto', 'reminder', 'batch_import'],
        description: '记录来源',
        example: 'manual',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: '创建时间',
        example: '2024-01-15T14:30:05.000Z',
      },
    },
    required: ['id', 'amount', 'drink_type', 'recorded_at', 'source', 'created_at'],
  },

  HydrationProgress: {
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
        example: 6,
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
      goal_achieved: {
        type: 'boolean',
        description: '是否达成目标',
        example: false,
      },
      today_records_detail: {
        type: 'array',
        description: '今日记录详情',
        items: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            drink_type: { type: 'string' },
            recorded_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    required: ['today_intake', 'today_records', 'daily_goal', 'progress_percentage', 'goal_achieved'],
  },

  HydrationStatistics: {
    type: 'object',
    properties: {
      period_statistics: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: '统计周期',
            example: '7d',
          },
          summary: {
            type: 'object',
            properties: {
              total_intake: {
                type: 'number',
                description: '总饮水量（ml）',
                example: 12500,
              },
              total_records: {
                type: 'number',
                description: '总记录数',
                example: 42,
              },
              achieved_days: {
                type: 'number',
                description: '达标天数',
                example: 5,
              },
              total_days: {
                type: 'number',
                description: '总天数',
                example: 7,
              },
              avg_daily_intake: {
                type: 'number',
                description: '平均每日饮水量（ml）',
                example: 1786,
              },
              achievement_rate: {
                type: 'number',
                description: '目标达成率（%）',
                example: 71.4,
              },
            },
          },
          daily_stats: {
            type: 'array',
            description: '每日统计',
            items: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                total_intake: { type: 'number' },
                record_count: { type: 'number' },
                avg_per_record: { type: 'number' },
                daily_goal: { type: 'number' },
                goal_achieved: { type: 'number' },
              },
            },
          },
        },
      },
      drink_type_statistics: {
        type: 'array',
        description: '饮品类型统计',
        items: {
          type: 'object',
          properties: {
            drink_type: {
              type: 'string',
              description: '饮品类型',
              example: 'water',
            },
            record_count: {
              type: 'number',
              description: '记录次数',
              example: 35,
            },
            total_amount: {
              type: 'number',
              description: '总饮用量（ml）',
              example: 8750,
            },
            avg_amount: {
              type: 'number',
              description: '平均饮用量（ml）',
              example: 250,
            },
            percentage: {
              type: 'number',
              description: '占比（%）',
              example: 83.3,
            },
          },
        },
      },
      hourly_pattern: {
        type: 'array',
        description: '每小时饮水模式',
        items: {
          type: 'object',
          properties: {
            hour: {
              type: 'number',
              minimum: 0,
              maximum: 23,
              description: '小时（0-23）',
              example: 14,
            },
            record_count: {
              type: 'number',
              description: '该时段记录次数',
              example: 5,
            },
            avg_amount: {
              type: 'number',
              description: '该时段平均饮水量（ml）',
              example: 220,
            },
            total_amount: {
              type: 'number',
              description: '该时段总饮水量（ml）',
              example: 1100,
            },
          },
        },
      },
    },
  },

  PaginatedRecords: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/HydrationRecord' },
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
export const hydrationPaths = {
  '/api/v1/hydration': {
    post: {
      summary: '添加饮水记录',
      description: '创建一条新的饮水记录',
      tags: ['Hydration Records'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount'],
              properties: {
                amount: {
                  type: 'number',
                  minimum: 10,
                  maximum: 5000,
                  description: '饮水量（ml）',
                  example: 250,
                },
                drinkType: {
                  type: 'string',
                  enum: ['water', 'tea', 'coffee', 'juice', 'milk', 'sports_drink', 'soda', 'other'],
                  description: '饮品类型',
                  default: 'water',
                  example: 'water',
                },
                drinkName: {
                  type: 'string',
                  maxLength: 50,
                  description: '饮品名称',
                  example: '矿泉水',
                },
                recordedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: '记录时间（默认为当前时间）',
                  example: '2024-01-15T14:30:00.000Z',
                },
                location: {
                  type: 'string',
                  maxLength: 100,
                  description: '地点',
                  example: '办公室',
                },
                activityContext: {
                  type: 'string',
                  maxLength: 100,
                  description: '活动场景',
                  example: '工作中',
                },
                temperature: {
                  type: 'string',
                  enum: ['cold', 'room', 'warm', 'hot'],
                  description: '温度',
                  default: 'room',
                  example: 'room',
                },
                source: {
                  type: 'string',
                  enum: ['manual', 'auto', 'reminder'],
                  description: '记录来源',
                  default: 'manual',
                  example: 'manual',
                },
                deviceId: {
                  type: 'string',
                  description: '设备ID',
                  example: 'mobile_app_v1.2.0',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: '添加成功',
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
                          record: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer' },
                              amount: { type: 'number' },
                              drink_type: { type: 'string' },
                              drink_name: { type: 'string' },
                              recorded_at: { type: 'string', format: 'date-time' },
                            },
                          },
                          today_progress: { $ref: '#/components/schemas/HydrationProgress' },
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
                dailyLimitExceeded: {
                  summary: '每日记录限制',
                  value: {
                    success: false,
                    error: 'DAILY_LIMIT_EXCEEDED',
                    message: '每日最多只能记录50次',
                    current_count: 50,
                    limit: 50,
                  },
                },
                invalidAmount: {
                  summary: '饮水量无效',
                  value: {
                    success: false,
                    error: 'INVALID_AMOUNT',
                    message: '饮水量应在 10ml - 5000ml 之间',
                  },
                },
                invalidTime: {
                  summary: '时间无效',
                  value: {
                    success: false,
                    error: 'INVALID_TIME',
                    message: '记录时间不能是未来时间',
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
    get: {
      summary: '获取饮水记录列表',
      description: '分页获取用户的饮水记录列表，支持多种过滤条件',
      tags: ['Hydration Records'],
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
          name: 'drinkType',
          in: 'query',
          description: '饮品类型',
          schema: {
            type: 'string',
            enum: ['water', 'tea', 'coffee', 'juice', 'milk', 'sports_drink', 'soda', 'other'],
          },
        },
        {
          name: 'source',
          in: 'query',
          description: '记录来源',
          schema: {
            type: 'string',
            enum: ['manual', 'auto', 'reminder', 'batch_import'],
          },
        },
        {
          name: 'minAmount',
          in: 'query',
          description: '最小饮水量',
          schema: {
            type: 'number',
            minimum: 0,
          },
        },
        {
          name: 'maxAmount',
          in: 'query',
          description: '最大饮水量',
          schema: {
            type: 'number',
            minimum: 0,
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
                      data: { $ref: '#/components/schemas/PaginatedRecords' },
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

  '/api/v1/hydration/batch': {
    post: {
      summary: '批量添加饮水记录',
      description: '一次性添加多条饮水记录',
      tags: ['Hydration Records'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['records'],
              properties: {
                records: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 20,
                  description: '饮水记录数组',
                  items: {
                    type: 'object',
                    required: ['amount'],
                    properties: {
                      amount: {
                        type: 'number',
                        minimum: 10,
                        maximum: 5000,
                        description: '饮水量（ml）',
                        example: 250,
                      },
                      drink_type: {
                        type: 'string',
                        enum: ['water', 'tea', 'coffee', 'juice', 'milk', 'sports_drink', 'soda', 'other'],
                        default: 'water',
                      },
                      drink_name: {
                        type: 'string',
                        maxLength: 50,
                      },
                      recorded_at: {
                        type: 'string',
                        format: 'date-time',
                      },
                      location: {
                        type: 'string',
                        maxLength: 100,
                      },
                      activity_context: {
                        type: 'string',
                        maxLength: 100,
                      },
                      temperature: {
                        type: 'string',
                        enum: ['cold', 'room', 'warm', 'hot'],
                        default: 'room',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: '批量添加成功',
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
                          added_count: {
                            type: 'number',
                            description: '成功添加的记录数',
                            example: 5,
                          },
                          affected_rows: {
                            type: 'number',
                            description: '影响的数据库行数',
                            example: 5,
                          },
                          today_progress: { $ref: '#/components/schemas/HydrationProgress' },
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
                tooManyRecords: {
                  summary: '记录数量超限',
                  value: {
                    success: false,
                    error: 'TOO_MANY_RECORDS',
                    message: '批量添加最多支持20条记录',
                  },
                },
                dailyLimitExceeded: {
                  summary: '每日记录总数超限',
                  value: {
                    success: false,
                    error: 'DAILY_LIMIT_EXCEEDED',
                    message: '今日记录数量将超过限制（50条）',
                    current_count: 46,
                    new_records: 5,
                    limit: 50,
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

  '/api/v1/hydration/today-progress': {
    get: {
      summary: '获取今日饮水进度',
      description: '获取用户今日的饮水进度和目标完成情况',
      tags: ['Hydration Records'],
      security: [{ bearerAuth: [] }],
      parameters: [
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
                      data: {
                        type: 'object',
                        properties: {
                          progress: { $ref: '#/components/schemas/HydrationProgress' },
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

  '/api/v1/hydration/statistics': {
    get: {
      summary: '获取饮水统计信息',
      description: '获取用户的饮水统计数据、饮品偏好和时间模式分析',
      tags: ['Hydration Records'],
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
                      data: { $ref: '#/components/schemas/HydrationStatistics' },
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

  '/api/v1/hydration/{recordId}': {
    get: {
      summary: '获取单条饮水记录',
      description: '根据ID获取特定的饮水记录详情',
      tags: ['Hydration Records'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'recordId',
          in: 'path',
          required: true,
          description: '记录ID',
          schema: {
            type: 'integer',
            minimum: 1,
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
                          record: { $ref: '#/components/schemas/HydrationRecord' },
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
        404: {
          description: '记录不存在',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
              example: {
                success: false,
                error: 'RECORD_NOT_FOUND',
                message: '饮水记录不存在',
              },
            },
          },
        },
      },
    },
    put: {
      summary: '更新饮水记录',
      description: '更新指定ID的饮水记录（只能修改7天内的记录）',
      tags: ['Hydration Records'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'recordId',
          in: 'path',
          required: true,
          description: '记录ID',
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
              properties: {
                amount: {
                  type: 'number',
                  minimum: 10,
                  maximum: 5000,
                  description: '饮水量（ml）',
                  example: 300,
                },
                drink_type: {
                  type: 'string',
                  enum: ['water', 'tea', 'coffee', 'juice', 'milk', 'sports_drink', 'soda', 'other'],
                  description: '饮品类型',
                  example: 'tea',
                },
                drink_name: {
                  type: 'string',
                  maxLength: 50,
                  description: '饮品名称',
                  example: '绿茶',
                },
                recorded_at: {
                  type: 'string',
                  format: 'date-time',
                  description: '记录时间',
                  example: '2024-01-15T15:00:00.000Z',
                },
                location: {
                  type: 'string',
                  maxLength: 100,
                  description: '地点',
                  example: '会议室',
                },
                activity_context: {
                  type: 'string',
                  maxLength: 100,
                  description: '活动场景',
                  example: '开会',
                },
                temperature: {
                  type: 'string',
                  enum: ['cold', 'room', 'warm', 'hot'],
                  description: '温度',
                  example: 'hot',
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
                          record: { $ref: '#/components/schemas/HydrationRecord' },
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
                recordTooOld: {
                  summary: '记录太旧',
                  value: {
                    success: false,
                    error: 'RECORD_TOO_OLD',
                    message: '只能修改7天内的记录',
                  },
                },
                noChanges: {
                  summary: '无更新内容',
                  value: {
                    success: false,
                    error: 'NO_CHANGES',
                    message: '没有可更新的数据',
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
          description: '记录不存在',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: '删除饮水记录',
      description: '删除指定ID的饮水记录（软删除）',
      tags: ['Hydration Records'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'recordId',
          in: 'path',
          required: true,
          description: '记录ID',
          schema: {
            type: 'integer',
            minimum: 1,
          },
        },
      ],
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
          description: '记录不存在',
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