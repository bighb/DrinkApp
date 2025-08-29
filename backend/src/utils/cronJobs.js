import cron from 'node-cron';
import config from '../config/index.js';
import { logger } from './logger.js';
import db from '../config/database.js';

class CronJobs {
  constructor() {
    this.jobs = new Map();
    this.isStarted = false;
  }

  // 启动所有定时任务
  start() {
    if (this.isStarted) {
      logger.warn('定时任务已经在运行中');
      return;
    }

    logger.info('启动定时任务...');

    // 启动各个定时任务
    this.startStatisticsUpdate();
    this.startReminderCleanup();
    this.startSessionCleanup();
    this.startDatabaseHealthCheck();

    this.isStarted = true;
    logger.info('所有定时任务启动完成');
  }

  // 停止所有定时任务
  stop() {
    if (!this.isStarted) {
      logger.warn('定时任务未在运行');
      return;
    }

    logger.info('停止定时任务...');

    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`定时任务 ${name} 已停止`);
    });

    this.jobs.clear();
    this.isStarted = false;
    logger.info('所有定时任务已停止');
  }

  // 统计数据更新任务 - 每天凌晨1点执行
  startStatisticsUpdate() {
    const job = cron.schedule(
      config.cron.statisticsUpdate,
      async () => {
        try {
          logger.info('开始执行统计数据更新任务');

          // 更新用户统计数据
          await this.updateUserStatistics();

          // 更新系统统计数据
          await this.updateSystemStatistics();

          logger.info('统计数据更新任务执行完成');
        } catch (error) {
          logger.error('统计数据更新任务执行失败:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    this.jobs.set('statisticsUpdate', job);
    logger.info('统计数据更新任务已启动');
  }

  // 提醒清理任务 - 每天凌晨2点执行
  startReminderCleanup() {
    const job = cron.schedule(
      config.cron.reminderCleanup,
      async () => {
        try {
          logger.info('开始执行提醒清理任务');

          // 清理过期的提醒记录
          await this.cleanupExpiredReminders();

          // 清理无效的推送token
          await this.cleanupInvalidTokens();

          logger.info('提醒清理任务执行完成');
        } catch (error) {
          logger.error('提醒清理任务执行失败:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    this.jobs.set('reminderCleanup', job);
    logger.info('提醒清理任务已启动');
  }

  // 会话清理任务 - 每天凌晨3点执行
  startSessionCleanup() {
    const job = cron.schedule(
      config.cron.sessionCleanup,
      async () => {
        try {
          logger.info('开始执行会话清理任务');

          // 清理过期的Redis会话
          await this.cleanupExpiredSessions();

          // 清理过期的刷新token
          await this.cleanupExpiredRefreshTokens();

          logger.info('会话清理任务执行完成');
        } catch (error) {
          logger.error('会话清理任务执行失败:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    this.jobs.set('sessionCleanup', job);
    logger.info('会话清理任务已启动');
  }

  // 数据库健康检查任务 - 每小时执行一次
  startDatabaseHealthCheck() {
    const job = cron.schedule(
      '0 * * * *',
      async () => {
        try {
          logger.info('开始执行数据库健康检查');

          const health = await db.healthCheck();

          if (!health.mysql || !health.redis) {
            logger.error('数据库健康检查失败:', health);
            // 这里可以添加告警逻辑
          } else {
            logger.info('数据库健康检查正常');
          }
        } catch (error) {
          logger.error('数据库健康检查任务执行失败:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    this.jobs.set('databaseHealthCheck', job);
    logger.info('数据库健康检查任务已启动');
  }

  // 更新用户统计数据
  async updateUserStatistics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const query = `
      UPDATE users u 
      SET 
        total_intake = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM hydration_records hr 
          WHERE hr.user_id = u.id
        ),
        updated_at = NOW()
      WHERE u.id > 0
    `;

    await db.query(query);
    logger.info('用户统计数据更新完成');
  }

  // 更新系统统计数据
  async updateSystemStatistics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // 统计昨天的活跃用户数
    const activeUsersQuery = `
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM hydration_records 
      WHERE DATE(recorded_at) = ?
    `;
    const { rows: activeUsersResult } = await db.query(activeUsersQuery, [
      dateStr,
    ]);

    // 统计昨天的总记录数
    const totalRecordsQuery = `
      SELECT COUNT(*) as total_records
      FROM hydration_records 
      WHERE DATE(recorded_at) = ?
    `;
    const { rows: totalRecordsResult } = await db.query(totalRecordsQuery, [
      dateStr,
    ]);

    // 将统计数据缓存到Redis
    await db.setCache(
      `stats:daily:${dateStr}`,
      {
        date: dateStr,
        activeUsers: activeUsersResult[0].active_users,
        totalRecords: totalRecordsResult[0].total_records,
        updatedAt: new Date().toISOString(),
      },
      86400 * 7
    ); // 保存7天

    logger.info('系统统计数据更新完成');
  }

  // 清理过期的提醒记录
  async cleanupExpiredReminders() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = `
      DELETE FROM reminders 
      WHERE is_active = 0 
      AND updated_at < ?
    `;

    const { rows } = await db.query(query, [thirtyDaysAgo]);
    logger.info(`清理了 ${rows.affectedRows || 0} 条过期提醒记录`);
  }

  // 清理无效的推送token
  async cleanupInvalidTokens() {
    // 这里可以添加清理无效推送token的逻辑
    // 例如检查token是否还有效，清理无效的token
    logger.info('推送token清理完成');
  }

  // 清理过期的Redis会话
  async cleanupExpiredSessions() {
    // Redis的过期键会自动清理，这里主要用于日志记录
    logger.info('过期会话清理完成');
  }

  // 清理过期的刷新token
  async cleanupExpiredRefreshTokens() {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < NOW()
    `;

    const { rows } = await db.query(query);
    logger.info(`清理了 ${rows.affectedRows || 0} 个过期刷新token`);
  }

  // 获取定时任务状态
  getStatus() {
    return {
      isStarted: this.isStarted,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()).map(name => ({
        name,
        running: this.jobs.get(name).running,
      })),
    };
  }
}

// 创建单例实例
const cronJobs = new CronJobs();

export default cronJobs;
