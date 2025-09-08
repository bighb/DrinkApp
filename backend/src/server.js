import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ES模块中获取__dirname的替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置和工具
import config from './config/index.js';
import db from './config/database.js';
import { logger, requestLogger, errorLogger } from './utils/logger.js';

// 中间件
import { authenticate } from './middlewares/auth.js';
import errorHandler from './middlewares/errorHandler.js';
import maintenanceMode from './middlewares/maintenance.js';
import { rateLimitMiddleware } from './middlewares/rateLimit.js';

// 路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import hydrationRoutes from './routes/hydration.js';
import reminderRoutes from './routes/reminders.js';

// 工具类
import HealthCheck from './utils/healthCheck.js';
import CronJobs from './utils/cronJobs.js';

class Server {
  constructor() {
    this.app = express();
    this.server = null;
  }

  // 初始化应用程序
  async initialize() {
    try {
      console.log('🚀 开始初始化应用程序...');

      // 连接数据库
      console.log('📦 准备连接数据库...');
      await db.connect();
      logger.info('数据库连接成功');

      // 配置中间件
      this.configureMiddleware();

      // 配置路由
      await this.configureRoutes();

      // 配置错误处理
      this.configureErrorHandling();

      // 启动定时任务
      this.startCronJobs();

      logger.info('应用程序初始化完成');
    } catch (error) {
      logger.error('应用程序初始化失败:', error);
      throw error;
    }
  }

  // 配置中间件
  configureMiddleware() {
    // 信任代理（如果在负载均衡器后面）
    if (config.server.trustProxy) {
      this.app.set('trust proxy', 1);
    }

    // 安全中间件
    if (config.security.helmetEnabled) {
      this.app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          },
          crossOriginEmbedderPolicy: false,
        })
      );
    }

    // CORS配置
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      })
    );

    // 请求压缩
    this.app.use(compression());

    // 请求解析
    this.app.use(
      express.json({
        limit: '10mb',
        type: ['application/json', 'text/plain'],
      })
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '10mb',
      })
    );

    // 静态文件服务
    this.app.use(
      '/uploads',
      express.static(join(__dirname, '../uploads'), {
        maxAge: '1d',
        etag: true,
        lastModified: true,
      })
    );

    // 请求日志
    if (config.server.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(
        morgan('combined', {
          stream: { write: message => logger.info(message.trim()) },
        })
      );
    }

    // 自定义请求日志中间件
    this.app.use(requestLogger);

    // 维护模式检查
    this.app.use(maintenanceMode);

    // 全局限流
    this.app.use(rateLimitMiddleware);
  }

  // 配置路由
  async configureRoutes() {
    const apiVersion = config.server.apiVersion;
    const apiPrefix = `/api/${apiVersion}`;

    // 健康检查端点（不需要认证）
    this.app.get('/health', HealthCheck.basic);
    this.app.get('/health/detailed', HealthCheck.detailed);

    // API文档（开发环境）
    if (config.server.env === 'development') {
      await this.setupSwaggerDocs();
    }

    // API路由
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/hydration`, hydrationRoutes);
    this.app.use(`${apiPrefix}/reminders`, reminderRoutes);

    // 根路径信息
    this.app.get('/', (req, res) => {
      res.json({
        name: 'HydrationTracker API',
        version: '1.0.0',
        environment: config.server.env,
        apiVersion: apiVersion,
        endpoints: {
          health: '/health',
          docs: config.server.env === 'development' ? '/api-docs' : null,
          api: `${apiPrefix}`,
        },
        timestamp: new Date().toISOString(),
      });
    });

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'ENDPOINT_NOT_FOUND',
        message: '请求的端点不存在',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  // 配置Swagger API文档
  async setupSwaggerDocs() {
    try {
      // 动态导入 ES 模块
      const swaggerJsdoc = (await import('swagger-jsdoc')).default;
      const swaggerUi = (await import('swagger-ui-express')).default;

      const options = {
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'HydrationTracker API',
            version: '1.0.0',
            description: '智能饮水管理应用API文档',
            contact: {
              name: 'HydrationTracker Team',
              email: 'support@hydrationtracker.com',
            },
          },
          servers: [
            {
              url: `http://localhost:${config.server.port}`,
              description: '开发环境',
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
          security: [],
        },
        apis: [
          join(__dirname, './routes/*.js'),
          join(__dirname, './controllers/*.js'),
        ],
      };

      const specs = swaggerJsdoc(options);
      this.app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(specs, {
          explorer: true,
          customCss: '.swagger-ui .topbar { display: none }',
          customSiteTitle: 'HydrationTracker API Docs',
        })
      );

      logger.info('Swagger文档已启用: /api-docs');
    } catch (error) {
      logger.warn('Swagger文档启用失败:', error.message);
      console.error('Swagger详细错误信息:', error);
    }
  }

  // 配置错误处理
  configureErrorHandling() {
    // 全局错误处理中间件
    this.app.use(errorHandler);

    // 处理未捕获的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString(),
      });

      // 在生产环境中，可能需要优雅地关闭服务器
      if (config.server.env === 'production') {
        this.gracefulShutdown('unhandledRejection');
      }
    });

    // 处理未捕获的异常
    process.on('uncaughtException', error => {
      logger.error('未捕获的异常:', {
        error: error.message,
        stack: error.stack,
      });

      // 未捕获异常通常表示程序状态不可恢复，应该退出
      this.gracefulShutdown('uncaughtException');
    });

    // 处理系统信号
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，开始优雅关闭');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，开始优雅关闭');
      this.gracefulShutdown('SIGINT');
    });
  }

  // 启动定时任务
  startCronJobs() {
    try {
      CronJobs.start();
      logger.info('定时任务启动成功');
    } catch (error) {
      logger.error('定时任务启动失败:', error);
    }
  }

  // 启动服务器
  start() {
    return new Promise((resolve, reject) => {
      const port = config.server.port;

      this.server = this.app.listen(port, err => {
        if (err) {
          logger.error('服务器启动失败:', err);
          reject(err);
          return;
        }

        logger.info(`🚀 服务器启动成功`, {
          port,
          env: config.server.env,
          apiVersion: config.server.apiVersion,
          pid: process.pid,
        });

        // 在开发环境中显示可用的端点
        if (config.server.env === 'development') {
          logger.info('📋 可用端点:', {
            health: `http://localhost:${port}/health`,
            api: `http://localhost:${port}/api/${config.server.apiVersion}`,
            docs: `http://localhost:${port}/api-docs`,
          });
        }

        resolve();
      });

      // 设置服务器超时
      this.server.timeout = 30000; // 30秒

      // 处理服务器错误
      this.server.on('error', error => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`端口${port}已被占用`);
        } else {
          logger.error('服务器错误:', error);
        }
        reject(error);
      });
    });
  }

  // 优雅关闭
  async gracefulShutdown(signal) {
    logger.info(`开始优雅关闭 (${signal})`);

    const shutdownTimeout = 10000; // 10秒超时

    const shutdown = async () => {
      try {
        // 停止接收新请求
        if (this.server) {
          await new Promise((resolve, reject) => {
            this.server.close(err => {
              if (err) reject(err);
              else resolve();
            });
          });
          logger.info('HTTP服务器已关闭');
        }

        // 停止定时任务
        CronJobs.stop();
        logger.info('定时任务已停止');

        // 关闭数据库连接
        await db.disconnect();
        logger.info('数据库连接已关闭');

        logger.info('优雅关闭完成');
        process.exit(0);
      } catch (error) {
        logger.error('优雅关闭过程中出错:', error);
        process.exit(1);
      }
    };

    // 设置超时强制退出
    setTimeout(() => {
      logger.error('优雅关闭超时，强制退出');
      process.exit(1);
    }, shutdownTimeout);

    await shutdown();
  }

  // 获取服务器状态
  getStatus() {
    return {
      server: {
        running: !!this.server,
        port: config.server.port,
        env: config.server.env,
        uptime: process.uptime(),
        pid: process.pid,
      },
      database: db.getConnectionStatus(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

// 创建服务器实例
const server = new Server();

// 启动应用程序
async function startApplication() {
  try {
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.error('应用程序启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startApplication();
}

export { Server, server };
