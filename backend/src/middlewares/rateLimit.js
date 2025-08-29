import rateLimit from "express-rate-limit";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

// 创建速率限制中间件
const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,

  // 响应头
  standardHeaders: true,
  legacyHeaders: false,

  // 跳过成功请求的计数
  skipSuccessfulRequests: config.rateLimit.skipSuccessfulRequests,

  // 自定义键生成器（基于IP和用户ID）
  keyGenerator: (req) => {
    // 如果用户已登录，使用用户ID+IP组合
    if (req.user && req.user.id) {
      return `${req.ip}_${req.user.id}`;
    }
    // 否则只使用IP
    return req.ip;
  },

  // 跳过某些请求
  skip: (req) => {
    // 健康检查不计入限流
    if (req.path === "/health" || req.path === "/health/detailed") {
      return true;
    }

    // 开发环境可以考虑跳过限流
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_RATE_LIMIT === "true"
    ) {
      return true;
    }

    return false;
  },

  // 使用 handler 来处理限流逻辑
  handler: (req, res) => {
    logger.warn("速率限制触发", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      method: req.method,
      limit: config.rateLimit.max,
      windowMs: config.rateLimit.windowMs,
    });

    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "请求过于频繁，请稍后再试",
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});

// 创建严格的速率限制（用于敏感操作）
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => `strict_${req.ip}`,

  handler: (req, res) => {
    logger.error("严格速率限制触发", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      error: "STRICT_RATE_LIMIT_EXCEEDED",
      message: "操作过于频繁，请15分钟后再试",
      retryAfter: 15 * 60,
    });
  },
});

// 创建登录专用的速率限制
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 最多10次登录尝试

  skipSuccessfulRequests: true, // 成功登录不计入限制

  keyGenerator: (req) => {
    // 基于IP和用户名（如果提供）组合
    const identifier = req.body?.email || req.body?.username || "unknown";
    return `login_${req.ip}_${identifier}`;
  },
});

export { rateLimitMiddleware, strictRateLimit, loginRateLimit };

export default rateLimitMiddleware;
