import net from 'net';
import { logger } from './logger.js';

/**
 * 端口管理工具类
 * 提供端口可用性检测和自动端口切换功能
 */
class PortManager {
  constructor() {
    this.defaultPort = 5000;
    this.maxPortRange = 50; // 最多尝试50个端口
    this.portCheckTimeout = 3000; // 端口检测超时时间(ms)
  }

  /**
   * 检查指定端口是否可用
   * @param {number} port - 要检查的端口号
   * @returns {Promise<boolean>} - 端口是否可用
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      // 设置超时处理
      const timeout = setTimeout(() => {
        server.close();
        resolve(false);
      }, this.portCheckTimeout);

      server.listen(port, () => {
        clearTimeout(timeout);
        server.close(() => {
          resolve(true);
        });
      });

      server.on('error', (err) => {
        clearTimeout(timeout);
        if (err.code === 'EADDRINUSE') {
          logger.debug(`端口 ${port} 已被占用`);
          resolve(false);
        } else if (err.code === 'EACCES') {
          logger.debug(`端口 ${port} 访问被拒绝（权限不足）`);
          resolve(false);
        } else {
          logger.debug(`端口 ${port} 检测出错: ${err.message}`);
          resolve(false);
        }
      });
    });
  }

  /**
   * 获取指定端口的占用进程信息
   * @param {number} port - 端口号
   * @returns {Promise<Object|null>} - 进程信息或null
   */
  async getPortUsage(port) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);

      // 使用lsof命令查看端口占用情况
      const { stdout } = await execPromise(`lsof -i :${port}`);
      
      if (!stdout.trim()) {
        return null;
      }

      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        return null;
      }

      // 解析第二行（第一行是表头）
      const processLine = lines[1];
      const parts = processLine.split(/\s+/);
      
      return {
        command: parts[0],
        pid: parts[1],
        user: parts[2],
        port: port,
        raw: processLine
      };
    } catch (error) {
      logger.debug(`获取端口 ${port} 占用信息失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 查找下一个可用端口
   * @param {number} startPort - 起始端口（默认使用配置的端口）
   * @returns {Promise<number>} - 可用的端口号
   */
  async findAvailablePort(startPort = null) {
    const basePort = startPort || parseInt(process.env.PORT) || this.defaultPort;
    
    logger.info(`开始寻找可用端口，起始端口: ${basePort}`);

    // 首先检查起始端口
    if (await this.isPortAvailable(basePort)) {
      logger.info(`端口 ${basePort} 可用`);
      return basePort;
    }

    // 记录起始端口的占用情况
    const usage = await this.getPortUsage(basePort);
    if (usage) {
      logger.warn(`端口 ${basePort} 被占用:`, {
        process: usage.command,
        pid: usage.pid,
        user: usage.user
      });
    }

    // 如果起始端口不可用，尝试后续端口
    for (let i = 1; i <= this.maxPortRange; i++) {
      const testPort = basePort + i;
      
      if (await this.isPortAvailable(testPort)) {
        logger.info(`找到可用端口: ${testPort} (偏移 +${i})`);
        return testPort;
      }
      
      logger.debug(`端口 ${testPort} 不可用，继续尝试...`);
    }

    // 如果没有找到可用端口，抛出错误
    const errorMessage = `在端口范围 ${basePort}-${basePort + this.maxPortRange} 内未找到可用端口`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * 智能端口选择
   * 优先选择常用的开发端口
   * @param {number} preferredPort - 首选端口
   * @returns {Promise<number>} - 可用的端口号
   */
  async smartPortSelection(preferredPort = null) {
    const preferred = preferredPort || parseInt(process.env.PORT) || this.defaultPort;
    
    // 定义常用的开发端口优先级列表
    const commonPorts = [
      preferred,      // 首选端口
      3000, 3001, 3002, 3003, 3004, 3005,  // React/Next.js常用端口
      4000, 4001, 4002, 4003, 4004, 4005,  // 其他常用开发端口
      5001, 5002, 5003, 5004, 5005,        // 5000系列（跳过5000因为被系统占用）
      8000, 8001, 8002, 8003, 8004, 8005,  // 8000系列
      9000, 9001, 9002, 9003, 9004, 9005   // 9000系列
    ];

    // 去重并保持优先级
    const uniquePorts = [...new Set(commonPorts)];

    logger.info(`智能端口选择开始，首选端口: ${preferred}`);

    // 按优先级检查端口
    for (const port of uniquePorts) {
      if (await this.isPortAvailable(port)) {
        if (port !== preferred) {
          logger.info(`首选端口 ${preferred} 不可用，使用替代端口: ${port}`);
        } else {
          logger.info(`首选端口 ${port} 可用`);
        }
        return port;
      }
    }

    // 如果常用端口都不可用，使用递增搜索
    logger.warn('常用开发端口均被占用，开始递增搜索...');
    return await this.findAvailablePort(preferred);
  }

  /**
   * 检测并报告端口占用情况
   * @param {number} port - 要检查的端口
   */
  async diagnosePort(port) {
    logger.info(`诊断端口 ${port} 的占用情况...`);

    const available = await this.isPortAvailable(port);
    
    if (available) {
      logger.info(`✅ 端口 ${port} 可用`);
      return { available: true, port };
    }

    const usage = await this.getPortUsage(port);
    
    if (usage) {
      logger.warn(`❌ 端口 ${port} 被占用:`, {
        进程名称: usage.command,
        进程ID: usage.pid,
        用户: usage.user,
        详细信息: usage.raw
      });

      // 特殊情况处理提示
      if (usage.command === 'ControlCe') {
        logger.info(`💡 解决方案: 端口 ${port} 被 macOS 控制中心的 AirPlay 接收器占用。`);
        logger.info(`   可以在 系统偏好设置 > 共享 > AirPlay接收器 中关闭，或使用其他端口。`);
      }
    } else {
      logger.warn(`❌ 端口 ${port} 不可用，但无法获取占用进程信息`);
    }

    return { 
      available: false, 
      port,
      usage: usage || { command: 'unknown', pid: 'unknown', user: 'unknown' }
    };
  }

  /**
   * 更新环境变量中的端口配置
   * @param {number} newPort - 新端口号
   */
  updatePortConfig(newPort) {
    const oldPort = process.env.PORT;
    process.env.PORT = newPort.toString();
    
    // 同时更新相关的URL配置
    if (process.env.API_BASE_URL) {
      process.env.API_BASE_URL = process.env.API_BASE_URL.replace(
        `:${oldPort}`,
        `:${newPort}`
      );
    }

    logger.info(`配置已更新: PORT ${oldPort} → ${newPort}`);
    
    if (process.env.API_BASE_URL) {
      logger.info(`API_BASE_URL 已更新为: ${process.env.API_BASE_URL}`);
    }
  }
}

// 创建单例实例
const portManager = new PortManager();

export default portManager;
export { PortManager };