import winston from 'winston';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import config from '../config/index.js';

// 确保日志目录存在
const logDir = dirname(config.log.file);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    
    // 添加请求ID（如果存在）
    if (meta.requestId) {
      log += ` [${meta.requestId}]`;
    }
    
    // 添加用户ID（如果存在）
    if (meta.userId) {
      log += ` [User:${meta.userId}]`;
    }
    
    log += `: ${message}`;
    
    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }
    
    // 添加额外的元数据
    const additionalMeta = { ...meta };
    delete additionalMeta.requestId;
    delete additionalMeta.userId;
    
    if (Object.keys(additionalMeta).length > 0) {
      log += `\n${JSON.stringify(additionalMeta, null, 2)}`;
    }
    
    return log;
  })
);

// 创建日志传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    level: config.server.env === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
  
  // 普通日志文件
  new winston.transports.File({
    filename: config.log.file,
    level: config.log.level,
    format: logFormat,
    maxsize: parseSize(config.log.maxSize),
    maxFiles: parseInt(config.log.maxFiles, 10),
    tailable: true,
  }),
  
  // 错误日志文件
  new winston.transports.File({
    filename: config.log.errorFile,
    level: 'error',
    format: logFormat,
    maxsize: parseSize(config.log.maxSize),
    maxFiles: parseInt(config.log.maxFiles, 10),
    tailable: true,
  }),
];

// 生产环境下可以添加更多传输器
if (config.server.env === 'production') {
  // 可以添加其他传输器，如发送到日志服务
  // transports.push(new winston.transports.Http({...}));
}

// 创建日志器
const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  defaultMeta: {
    service: 'hydration-tracker',
    environment: config.server.env,
  },
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: join(logDir, 'exceptions.log'),
      format: logFormat,
    }),
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: join(logDir, 'rejections.log'),
      format: logFormat,
    }),
  ],
  exitOnError: false,
});

// 解析文件大小字符串
function parseSize(sizeStr) {
  const units = { b: 1, k: 1024, m: 1048576, g: 1073741824 };
  const match = sizeStr.toLowerCase().match(/^(\d+)([bkmg]?)$/);
  if (!match) return 5242880; // 默认5MB
  return parseInt(match[1], 10) * (units[match[2]] || 1);
}

// 创建请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // 将请求ID添加到请求对象
  req.requestId = requestId;
  
  // 记录请求开始
  logger.info('请求开始', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id,
  });
  
  // 响应结束时记录
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    logger.info('请求完成', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength: data?.length,
      userId: req.user?.id,
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// 生成请求ID
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9);
}

// 创建数据库查询日志记录器
const dbLogger = {
  query: (sql, params, duration, error = null) => {
    const logData = {
      type: 'database_query',
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      duration,
    };
    
    if (error) {
      logger.error('数据库查询失败', { ...logData, error: error.message });
    } else if (duration > 1000) { // 慢查询记录
      logger.warn('慢查询检测', logData);
    } else {
      logger.debug('数据库查询', logData);
    }
  },
  
  transaction: (operation, duration, error = null) => {
    const logData = {
      type: 'database_transaction',
      operation,
      duration,
    };
    
    if (error) {
      logger.error('数据库事务失败', { ...logData, error: error.message });
    } else {
      logger.info('数据库事务完成', logData);
    }
  },
};

// 创建缓存操作日志记录器
const cacheLogger = {
  hit: (key, ttl) => {
    logger.debug('缓存命中', { type: 'cache_hit', key, ttl });
  },
  
  miss: (key) => {
    logger.debug('缓存未命中', { type: 'cache_miss', key });
  },
  
  set: (key, ttl, error = null) => {
    if (error) {
      logger.error('缓存设置失败', { type: 'cache_set_error', key, ttl, error: error.message });
    } else {
      logger.debug('缓存设置成功', { type: 'cache_set', key, ttl });
    }
  },
  
  del: (key, error = null) => {
    if (error) {
      logger.error('缓存删除失败', { type: 'cache_del_error', key, error: error.message });
    } else {
      logger.debug('缓存删除成功', { type: 'cache_del', key });
    }
  },
};

// 创建业务操作日志记录器
const businessLogger = {
  userAction: (userId, action, data = {}) => {
    logger.info('用户操作', {
      type: 'user_action',
      userId,
      action,
      ...data,
    });
  },
  
  systemEvent: (event, data = {}) => {
    logger.info('系统事件', {
      type: 'system_event',
      event,
      ...data,
    });
  },
  
  securityEvent: (event, userId, ip, data = {}) => {
    logger.warn('安全事件', {
      type: 'security_event',
      event,
      userId,
      ip,
      ...data,
    });
  },
};

// 错误日志记录器
const errorLogger = {
  api: (error, req) => {
    logger.error('API错误', {
      type: 'api_error',
      error: error.message,
      stack: error.stack,
      requestId: req?.requestId,
      method: req?.method,
      url: req?.originalUrl,
      userId: req?.user?.id,
      ip: req?.ip,
    });
  },
  
  database: (error, query, params) => {
    logger.error('数据库错误', {
      type: 'database_error',
      error: error.message,
      stack: error.stack,
      query,
      params,
    });
  },
  
  external: (service, error, requestData) => {
    logger.error('外部服务错误', {
      type: 'external_service_error',
      service,
      error: error.message,
      stack: error.stack,
      requestData,
    });
  },
};

// 性能监控日志记录器
const performanceLogger = {
  apiResponse: (req, res, duration) => {
    const logLevel = duration > 2000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    
    logger.log(logLevel, 'API响应时间', {
      type: 'api_performance',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      requestId: req.requestId,
    });
  },
  
  memory: () => {
    const usage = process.memoryUsage();
    logger.debug('内存使用情况', {
      type: 'memory_usage',
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    });
  },
};

export {
  logger,
  requestLogger,
  dbLogger,
  cacheLogger,
  businessLogger,
  errorLogger,
  performanceLogger,
};