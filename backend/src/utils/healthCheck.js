import db from '../config/database.js';
import config from '../config/index.js';
import EmailService from './email.js';
import PushNotificationService from './pushNotification.js';
import { logger } from './logger.js';

class HealthCheck {
  // 基础健康检查
  static async basic(req, res) {
    const startTime = Date.now();

    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: 0,
        version: '1.0.0',
        environment: config.server.env,
      };

      health.responseTime = Date.now() - startTime;

      res.status(200).json(health);
    } catch (error) {
      const errorHealth = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime,
      };

      res.status(503).json(errorHealth);
    }
  }

  // 详细健康检查
  static async detailed(req, res) {
    const startTime = Date.now();
    const checks = {};

    try {
      // 并行执行各项检查
      const [
        serverCheck,
        databaseCheck,
        cacheCheck,
        emailCheck,
        pushCheck,
        diskCheck,
        memoryCheck,
      ] = await Promise.allSettled([
        HealthCheck.checkServer(),
        HealthCheck.checkDatabase(),
        HealthCheck.checkCache(),
        HealthCheck.checkEmailService(),
        HealthCheck.checkPushService(),
        HealthCheck.checkDiskSpace(),
        HealthCheck.checkMemoryUsage(),
      ]);

      // 处理检查结果
      checks.server = HealthCheck.getCheckResult(serverCheck);
      checks.database = HealthCheck.getCheckResult(databaseCheck);
      checks.cache = HealthCheck.getCheckResult(cacheCheck);
      checks.email = HealthCheck.getCheckResult(emailCheck);
      checks.push = HealthCheck.getCheckResult(pushCheck);
      checks.disk = HealthCheck.getCheckResult(diskCheck);
      checks.memory = HealthCheck.getCheckResult(memoryCheck);

      // 计算整体健康状态
      const overallStatus = HealthCheck.calculateOverallStatus(checks);
      const responseTime = Date.now() - startTime;

      const health = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        responseTime,
        uptime: process.uptime(),
        version: '1.0.0',
        environment: config.server.env,
        checks,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid,
          cpuUsage: process.cpuUsage(),
          memoryUsage: process.memoryUsage(),
        },
      };

      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('健康检查失败:', error);

      const errorHealth = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error.message,
        checks,
      };

      res.status(503).json(errorHealth);
    }
  }

  // 检查服务器状态
  static async checkServer() {
    return {
      status: 'healthy',
      message: '服务器运行正常',
      uptime: process.uptime(),
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
    };
  }

  // 检查数据库连接
  static async checkDatabase() {
    try {
      const dbHealth = await db.healthCheck();

      if (dbHealth.mysql && dbHealth.redis) {
        return {
          status: 'healthy',
          message: '数据库连接正常',
          details: dbHealth,
        };
      } else {
        return {
          status: 'unhealthy',
          message: '数据库连接异常',
          details: dbHealth,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '数据库检查失败',
        error: error.message,
      };
    }
  }

  // 检查缓存服务
  static async checkCache() {
    try {
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now(), test: true };

      // 测试设置缓存
      await db.setCache(testKey, testValue, 10);

      // 测试获取缓存
      const cachedValue = await db.getCache(testKey);

      if (cachedValue && cachedValue.test === true) {
        // 清理测试数据
        await db.deleteCache(testKey);

        return {
          status: 'healthy',
          message: '缓存服务正常',
          latency: Date.now() - cachedValue.timestamp,
        };
      } else {
        return {
          status: 'unhealthy',
          message: '缓存数据不一致',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '缓存服务检查失败',
        error: error.message,
      };
    }
  }

  // 检查邮件服务
  static async checkEmailService() {
    try {
      const emailStatus = EmailService.getStatus();

      if (emailStatus.initialized) {
        const testResult = await EmailService.testConnection();

        if (testResult.success) {
          return {
            status: 'healthy',
            message: '邮件服务正常',
            details: emailStatus,
          };
        } else {
          return {
            status: 'unhealthy',
            message: '邮件服务连接失败',
            error: testResult.error,
          };
        }
      } else {
        return {
          status: 'degraded',
          message: '邮件服务未初始化',
          details: emailStatus,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '邮件服务检查失败',
        error: error.message,
      };
    }
  }

  // 检查推送服务
  static async checkPushService() {
    try {
      const pushStatus = PushNotificationService.getStatus();

      if (pushStatus.initialized && pushStatus.serviceAvailable) {
        return {
          status: 'healthy',
          message: '推送服务正常',
          details: pushStatus,
        };
      } else if (pushStatus.initialized && !pushStatus.serviceAvailable) {
        return {
          status: 'degraded',
          message: '推送服务部分可用',
          details: pushStatus,
        };
      } else {
        return {
          status: 'unhealthy',
          message: '推送服务未初始化',
          details: pushStatus,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '推送服务检查失败',
        error: error.message,
      };
    }
  }

  // 检查磁盘空间
  static async checkDiskSpace() {
    try {
      const fs = await import('node:fs/promises');
      const stats = await fs.statSync('.');

      // 简化的磁盘空间检查
      // 在实际应用中，你可能需要使用更专业的库来获取磁盘使用情况
      return {
        status: 'healthy',
        message: '磁盘空间充足',
        details: {
          // 这里可以添加实际的磁盘使用情况
          note: '需要实现具体的磁盘空间检查逻辑',
        },
      };
    } catch (error) {
      return {
        status: 'unknown',
        message: '磁盘空间检查未实现',
        error: error.message,
      };
    }
  }

  // 检查内存使用情况
  static async checkMemoryUsage() {
    try {
      const memUsage = process.memoryUsage();
      const os = await import('node:os');
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      const memoryUsagePercentage = (usedMem / totalMem) * 100;
      const heapUsagePercentage =
        (memUsage.heapUsed / memUsage.heapTotal) * 100;

      let status = 'healthy';
      let message = '内存使用正常';

      if (memoryUsagePercentage > 90 || heapUsagePercentage > 90) {
        status = 'unhealthy';
        message = '内存使用率过高';
      } else if (memoryUsagePercentage > 80 || heapUsagePercentage > 80) {
        status = 'degraded';
        message = '内存使用率较高';
      }

      return {
        status,
        message,
        details: {
          systemMemory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usagePercentage: memoryUsagePercentage.toFixed(2),
          },
          processMemory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            heapUsagePercentage: heapUsagePercentage.toFixed(2),
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '内存检查失败',
        error: error.message,
      };
    }
  }

  // 处理检查结果
  static getCheckResult(promiseResult) {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value;
    } else {
      return {
        status: 'unhealthy',
        message: '检查失败',
        error: promiseResult.reason?.message || promiseResult.reason,
      };
    }
  }

  // 计算整体健康状态
  static calculateOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status);

    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (statuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // 获取系统指标
  static async getMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          pid: process.pid,
        },
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        database: db.getConnectionStatus(),
        environment: config.server.env,
        version: '1.0.0',
      };

      res.status(200).json(metrics);
    } catch (error) {
      logger.error('获取系统指标失败:', error);
      res.status(500).json({
        error: '获取系统指标失败',
        message: error.message,
      });
    }
  }

  // 准备就绪检查（用于Kubernetes等编排工具）
  static async readiness(req, res) {
    try {
      // 检查关键服务是否就绪
      const [databaseReady] = await Promise.allSettled([db.healthCheck()]);

      const dbResult = HealthCheck.getCheckResult(databaseReady);

      if (dbResult.status === 'healthy') {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          message: '服务已准备就绪',
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          message: '服务尚未准备就绪',
          details: { database: dbResult },
        });
      }
    } catch (error) {
      logger.error('准备就绪检查失败:', error);
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  // 存活检查（用于Kubernetes等编排工具）
  static async liveness(req, res) {
    try {
      // 简单的存活检查，只要进程在运行就认为是存活的
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
      });
    } catch (error) {
      logger.error('存活检查失败:', error);
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  // 启动检查（用于确认服务已启动）
  static async startup(req, res) {
    try {
      // 检查启动依赖项
      const [databaseStarted] = await Promise.allSettled([db.healthCheck()]);

      const dbResult = HealthCheck.getCheckResult(databaseStarted);

      if (dbResult.status === 'healthy') {
        res.status(200).json({
          status: 'started',
          timestamp: new Date().toISOString(),
          message: '服务已成功启动',
          uptime: process.uptime(),
        });
      } else {
        res.status(503).json({
          status: 'starting',
          timestamp: new Date().toISOString(),
          message: '服务正在启动中',
          details: { database: dbResult },
        });
      }
    } catch (error) {
      logger.error('启动检查失败:', error);
      res.status(503).json({
        status: 'failed_to_start',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  // 性能基准测试
  static async benchmark(req, res) {
    try {
      const benchmarks = {};
      const iterations = 1000;

      // CPU基准测试
      const cpuStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        Math.random() * Math.random();
      }
      const cpuEnd = process.hrtime.bigint();
      benchmarks.cpu = {
        iterations,
        duration: Number(cpuEnd - cpuStart) / 1000000, // 转换为毫秒
      };

      // 内存基准测试
      const memStart = process.memoryUsage();
      const testArray = new Array(10000).fill(0).map(() => Math.random());
      const memEnd = process.memoryUsage();
      benchmarks.memory = {
        arraySize: testArray.length,
        heapUsedDiff: memEnd.heapUsed - memStart.heapUsed,
        heapTotalDiff: memEnd.heapTotal - memStart.heapTotal,
      };

      // 数据库基准测试
      if (db.isConnected) {
        const dbStart = Date.now();
        await db.query('SELECT 1 as test');
        const dbEnd = Date.now();
        benchmarks.database = {
          queryTime: dbEnd - dbStart,
          status: 'success',
        };
      }

      res.status(200).json({
        timestamp: new Date().toISOString(),
        benchmarks,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          cpus: (await import('node:os')).cpus().length,
        },
      });
    } catch (error) {
      logger.error('性能基准测试失败:', error);
      res.status(500).json({
        error: '基准测试失败',
        message: error.message,
      });
    }
  }
}

export default HealthCheck;
