import { logger } from '../utils/logger.js';

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  logger.error('API错误:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  let message = error.message || '服务器内部错误';
  let statusCode = error.statusCode || 500;

  // Mongoose错误处理
  if (err.name === 'CastError') {
    message = '资源未找到';
    statusCode = 404;
  }

  // Mongoose重复键错误
  if (err.code === 11000) {
    message = '资源已存在';
    statusCode = 400;
  }

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    statusCode = 400;
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    message = '无效的token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'token已过期';
    statusCode = 401;
  }

  // MySQL错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    message = '数据已存在';
    statusCode = 400;
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    message = '数据表不存在';
    statusCode = 500;
  }

  // 请求验证错误
  if (err.isJoi) {
    message = err.details.map(detail => detail.message).join(', ');
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export default errorHandler;
