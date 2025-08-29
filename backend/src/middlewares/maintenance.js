import config from '../config/index.js';

// 维护模式中间件
const maintenanceMode = (req, res, next) => {
  // 如果维护模式未启用，直接通过
  if (!config.maintenance.enabled) {
    return next();
  }

  // 健康检查端点在维护模式下也应该可访问
  if (req.path === '/health' || req.path === '/health/detailed') {
    return next();
  }

  // 返回维护模式响应
  res.status(503).json({
    success: false,
    error: 'SERVICE_UNAVAILABLE',
    message: config.maintenance.message,
    maintenanceMode: true,
    timestamp: new Date().toISOString(),
  });
};

export default maintenanceMode;
