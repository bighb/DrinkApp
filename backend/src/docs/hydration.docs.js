/**
 * 饮水记录相关API文档定义 - JavaScript版本
 */

export const hydrationDocs = {
  components: {
    schemas: {
      HydrationRecord: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: '记录ID',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          },
          userId: {
            type: 'integer',
            description: '用户ID',
            example: 12345,
          },
          volume: {
            type: 'integer',
            description: '饮水量(毫升)',
            example: 250,
            minimum: 1,
            maximum: 2000,
          },
          drinkType: {
            type: 'string',
            description: '饮品类型',
            example: 'water',
            enum: ['water', 'tea', 'coffee', 'juice', 'other'],
          },
          temperature: {
            type: 'string',
            description: '温度',
            example: 'room',
            enum: ['hot', 'warm', 'room', 'cold', 'ice'],
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: '记录时间',
            example: '2024-01-15T08:30:00.000Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '创建时间',
            example: '2024-01-15T08:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '更新时间',
            example: '2024-01-15T08:30:00.000Z',
          },
        },
        required: ['id', 'userId', 'volume', 'drinkType', 'recordedAt', 'createdAt'],
      },

      AddRecordRequest: {
        type: 'object',
        properties: {
          volume: {
            type: 'integer',
            description: '饮水量(毫升)',
            example: 250,
            minimum: 1,
            maximum: 2000,
          },
          drinkType: {
            type: 'string',
            description: '饮品类型',
            example: 'water',
            enum: ['water', 'tea', 'coffee', 'juice', 'other'],
            default: 'water',
          },
          temperature: {
            type: 'string',
            description: '温度',
            example: 'room',
            enum: ['hot', 'warm', 'room', 'cold', 'ice'],
            default: 'room',
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: '记录时间(可选，默认为当前时间)',
            example: '2024-01-15T08:30:00.000Z',
          },
        },
        required: ['volume'],
      },

      UpdateRecordRequest: {
        type: 'object',
        properties: {
          volume: {
            type: 'integer',
            description: '饮水量(毫升)',
            example: 300,
            minimum: 1,
            maximum: 2000,
          },
          drinkType: {
            type: 'string',
            description: '饮品类型',
            example: 'tea',
            enum: ['water', 'tea', 'coffee', 'juice', 'other'],
          },
          temperature: {
            type: 'string',
            description: '温度',
            example: 'warm',
            enum: ['hot', 'warm', 'room', 'cold', 'ice'],
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: '记录时间',
            example: '2024-01-15T08:30:00.000Z',
          },
        },
      },

      TodayProgress: {
        type: 'object',
        properties: {
          totalVolume: {
            type: 'integer',
            description: '今日总饮水量(毫升)',
            example: 1500,
          },
          dailyGoal: {
            type: 'integer',
            description: '每日目标(毫升)',
            example: 2000,
          },
          progress: {
            type: 'number',
            description: '完成进度(百分比)',
            example: 75.0,
            minimum: 0,
            maximum: 100,
          },
          recordsCount: {
            type: 'integer',
            description: '今日记录数',
            example: 6,
          },
          lastRecordAt: {
            type: 'string',
            format: 'date-time',
            description: '最后记录时间',
            example: '2024-01-15T14:30:00.000Z',
          },
        },
      },

      HydrationStatistics: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: '统计周期',
            example: '7days',
            enum: ['7days', '30days', '90days', '1year'],
          },
          averageDaily: {
            type: 'number',
            description: '平均每日饮水量(毫升)',
            example: 1850.5,
          },
          totalVolume: {
            type: 'integer',
            description: '总饮水量(毫升)',
            example: 51800,
          },
          goalAchievementRate: {
            type: 'number',
            description: '目标达成率(%)',
            example: 85.7,
          },
          streakDays: {
            type: 'integer',
            description: '连续达标天数',
            example: 5,
          },
        },
      },
    },
  },

  paths: {
    '/api/v1/hydration': {
      get: {
        tags: ['Hydration Records'],
        summary: '获取饮水记录列表',
        description: '获取用户的饮水记录，支持分页和筛选',
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
                        records: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/HydrationRecord' },
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
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },

      post: {
        tags: ['Hydration Records'],
        summary: '添加饮水记录',
        description: '创建新的饮水记录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddRecordRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: '记录创建成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '饮水记录添加成功' },
                    data: {
                      type: 'object',
                      properties: {
                        record: { $ref: '#/components/schemas/HydrationRecord' },
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

    '/api/v1/hydration/today-progress': {
      get: {
        tags: ['Hydration Records'],
        summary: '获取今日饮水进度',
        description: '获取当前用户今日的饮水进度信息',
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
                        progress: { $ref: '#/components/schemas/TodayProgress' },
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

    '/api/v1/hydration/statistics': {
      get: {
        tags: ['Hydration Records'],
        summary: '获取饮水统计信息',
        description: '获取用户的饮水统计数据',
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: '统计周期',
            required: false,
            schema: {
              type: 'string',
              enum: ['7days', '30days', '90days', '1year'],
              default: '7days',
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
                        statistics: { $ref: '#/components/schemas/HydrationStatistics' },
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

    '/api/v1/hydration/{recordId}': {
      get: {
        tags: ['Hydration Records'],
        summary: '获取单条饮水记录',
        description: '根据ID获取特定的饮水记录',
        parameters: [{ $ref: '#/components/parameters/RecordIdParam' }],
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
                        record: { $ref: '#/components/schemas/HydrationRecord' },
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

      put: {
        tags: ['Hydration Records'],
        summary: '更新饮水记录',
        description: '更新指定的饮水记录',
        parameters: [{ $ref: '#/components/parameters/RecordIdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRecordRequest' },
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
                    message: { type: 'string', example: '饮水记录更新成功' },
                    data: {
                      type: 'object',
                      properties: {
                        record: { $ref: '#/components/schemas/HydrationRecord' },
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
          '429': { $ref: '#/components/responses/RateLimit' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },

      delete: {
        tags: ['Hydration Records'],
        summary: '删除饮水记录',
        description: '删除指定的饮水记录',
        parameters: [{ $ref: '#/components/parameters/RecordIdParam' }],
        responses: {
          '200': {
            description: '删除成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '饮水记录删除成功' },
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
  },
};

export default hydrationDocs;