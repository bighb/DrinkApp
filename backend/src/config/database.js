import mysql from 'mysql2/promise';
import redis from 'redis';
import config from './index.js';
import { logger } from '../utils/logger.js';

class DatabaseConnection {
  constructor() {
    this.mysql = null;
    this.redis = null;
    this.isConnected = false;
  }

  // MySQL连接配置
  async connectMySQL() {
    try {
      // 创建连接池
      this.mysql = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: config.db.connectionLimit,
        queueLimit: 0,
        acquireTimeout: config.db.timeout,
        timeout: config.db.timeout,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        charset: 'utf8mb4',
        timezone: '+08:00',
        // 处理断线重连
        reconnect: true,
        // 启用查询缓存
        cache: true,
      });

      // 测试连接
      const connection = await this.mysql.getConnection();
      await connection.ping();
      connection.release();

      logger.info('MySQL数据库连接成功');
      return this.mysql;
    } catch (error) {
      logger.error('MySQL数据库连接失败:', error);
      throw error;
    }
  }

  // Redis连接配置
  async connectRedis() {
    try {
      // 在开发环境中设置较短的连接超时和重试次数
      const connectTimeout = config.server.env === 'development' ? 1000 : 10000;
      const maxRetries = config.server.env === 'development' ? 1 : 10;

      // 创建Redis客户端
      this.redis = redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          connectTimeout: connectTimeout,
          maxRetries: maxRetries,
          retryMaxDelay: 1000,
        },
        password: config.redis.password,
        database: config.redis.db,
      });

      // 错误处理
      this.redis.on('error', err => {
        logger.error('Redis连接错误:', err);
      });

      // 重连处理
      this.redis.on('reconnecting', () => {
        logger.info('Redis重新连接中...');
      });

      // 连接成功
      this.redis.on('connect', () => {
        logger.info('Redis连接成功');
      });

      // 准备就绪
      this.redis.on('ready', () => {
        logger.info('Redis准备就绪');
      });

      // 连接Redis
      await this.redis.connect();

      return this.redis;
    } catch (error) {
      logger.error('Redis连接失败:', error);
      throw error;
    }
  }

  // 初始化所有数据库连接
  async connect() {
    try {
      logger.info('开始初始化数据库连接...', {
        timestamp: new Date().toISOString(),
      });
      logger.info('尝试连接 MySQL 和 Redis...');

      const startTime = Date.now();
      console.log('📊 数据库连接开始:', {
        mysql: config.db.host,
        redis: config.redis.host,
      });

      // 在开发环境中，允许 Redis 连接失败
      if (config.server.env === 'development') {
        try {
          await this.connectMySQL();
        } catch (error) {
          logger.error('MySQL连接失败，无法继续:', error);
          throw error;
        }

        try {
          // 在开发环境下，给 Redis 连接设置 3 秒总超时
          await Promise.race([
            this.connectRedis(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Redis connection timeout')),
                3000
              )
            ),
          ]);
        } catch (error) {
          logger.warn('Redis连接失败，但在开发环境中继续运行:', error.message);
          if (this.redis) {
            try {
              await this.redis.disconnect();
            } catch (e) {
              // 忽略断开连接时的错误
            }
          }
          this.redis = null; // 确保 redis 为 null，避免后续使用
        }
      } else {
        // 生产环境中，两个数据库都必须连接成功
        await Promise.all([this.connectMySQL(), this.connectRedis()]);
      }

      this.isConnected = true;
      logger.info('所有数据库连接初始化完成');

      return {
        mysql: this.mysql,
        redis: this.redis,
      };
    } catch (error) {
      logger.error('数据库连接初始化失败:', error);
      throw error;
    }
  }

  // 关闭所有连接
  async disconnect() {
    try {
      const promises = [];

      if (this.mysql) {
        promises.push(this.mysql.end());
      }

      if (this.redis) {
        promises.push(this.redis.quit());
      }

      await Promise.all(promises);

      this.isConnected = false;
      logger.info('所有数据库连接已关闭');
    } catch (error) {
      logger.error('关闭数据库连接时出错:', error);
      throw error;
    }
  }

  // 健康检查
  async healthCheck() {
    const health = {
      mysql: false,
      redis: false,
      timestamp: new Date().toISOString(),
    };

    try {
      // 检查MySQL连接
      if (this.mysql) {
        const connection = await this.mysql.getConnection();
        await connection.ping();
        connection.release();
        health.mysql = true;
      }

      // 检查Redis连接
      if (this.redis && this.redis.isReady) {
        await this.redis.ping();
        health.redis = true;
      }

      return health;
    } catch (error) {
      logger.error('数据库健康检查失败:', error);
      return health;
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      mysql: {
        connected: !!this.mysql,
        poolConfig: this.mysql
          ? {
              connectionLimit: this.mysql.config.connectionLimit,
              acquiredConnections: this.mysql.pool._acquiringConnections.length,
              freeConnections: this.mysql.pool._freeConnections.length,
            }
          : null,
      },
      redis: {
        connected: this.redis ? this.redis.isReady : false,
        status: this.redis ? this.redis.status : null,
      },
    };
  }

  // 执行MySQL查询的辅助方法
  async query(sql, params = []) {
    try {
      const [rows, fields] = await this.mysql.execute(sql, params);
      return { rows, fields };
    } catch (error) {
      logger.error('MySQL查询执行失败:', { sql, params, error: error.message });
      throw error;
    }
  }

  // 执行事务的辅助方法
  async transaction(callback) {
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();

      const result = await callback(connection);

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Redis缓存操作辅助方法
  async setCache(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Redis缓存设置失败:', { key, error: error.message });
      return false;
    }
  }

  async getCache(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis缓存获取失败:', { key, error: error.message });
      return null;
    }
  }

  async deleteCache(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis缓存删除失败:', { key, error: error.message });
      return false;
    }
  }
}

// 创建单例实例
const db = new DatabaseConnection();

export default db;
