import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { logger, errorLogger } from './logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  // 初始化邮件传输器
  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: config.email.smtp.auth,
        pool: true, // 使用连接池
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10, // 每秒最多发送10封邮件
      });

      // 只在生产环境中验证配置
      if (config.server.env === 'production') {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.error('邮件服务配置验证失败:', error);
          } else {
            logger.info('邮件服务初始化成功');
          }
        });
      } else {
        logger.info('邮件服务初始化成功（开发环境，跳过验证）');
      }
    } catch (error) {
      logger.error('邮件服务初始化失败:', error);
      throw error;
    }
  }

  // 发送邮件的基础方法
  async sendMail(options) {
    try {
      if (!this.transporter) {
        throw new Error('邮件传输器未初始化');
      }

      const mailOptions = {
        from: options.from || config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments || [],
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('邮件发送成功:', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      errorLogger.external('email_service', error, {
        to: options.to,
        subject: options.subject,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 发送验证邮件
  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${config.server.baseUrl || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const emailTemplate = this.generateVerificationTemplate(
      name,
      verificationUrl
    );

    return await this.sendMail({
      to: email,
      subject: '📧 验证您的邮箱 - 喝水记录APP',
      html: emailTemplate,
      text: `您好 ${name}，请访问以下链接验证您的邮箱：${verificationUrl}`,
    });
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${config.server.baseUrl || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const emailTemplate = this.generatePasswordResetTemplate(name, resetUrl);

    return await this.sendMail({
      to: email,
      subject: '🔒 重置您的密码 - 喝水记录APP',
      html: emailTemplate,
      text: `您好 ${name}，请访问以下链接重置您的密码：${resetUrl}`,
    });
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(email, name) {
    const emailTemplate = this.generateWelcomeTemplate(name);

    return await this.sendMail({
      to: email,
      subject: '🎉 欢迎使用喝水记录APP',
      html: emailTemplate,
      text: `欢迎您 ${name}！感谢您注册喝水记录APP，开始您的健康饮水之旅吧！`,
    });
  }

  // 发送目标达成通知邮件
  async sendGoalAchievementEmail(email, name, achievementData) {
    const emailTemplate = this.generateGoalAchievementTemplate(
      name,
      achievementData
    );

    return await this.sendMail({
      to: email,
      subject: '🎯 恭喜！您达成了饮水目标',
      html: emailTemplate,
      text: `恭喜您 ${name}！您已连续${achievementData.streak}天达成饮水目标。`,
    });
  }

  // 发送月度报告邮件
  async sendMonthlyReportEmail(email, name, reportData) {
    const emailTemplate = this.generateMonthlyReportTemplate(name, reportData);

    return await this.sendMail({
      to: email,
      subject: '📊 您的月度饮水报告',
      html: emailTemplate,
      text: `您好 ${name}，这是您的月度饮水报告摘要...`,
    });
  }

  // 生成邮箱验证模板
  generateVerificationTemplate(name, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>验证邮箱</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💧 喝水记录APP</h1>
                <h2>验证您的邮箱</h2>
            </div>
            <div class="content">
                <p>您好 <strong>${name}</strong>，</p>
                <p>感谢您注册喝水记录APP！请点击下方按钮验证您的邮箱地址：</p>
                <p style="text-align: center;">
                    <a href="${verificationUrl}" class="button">验证邮箱</a>
                </p>
                <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                    ${verificationUrl}
                </p>
                <p><strong>注意：</strong>此链接将在24小时后失效。</p>
                <p>如果您没有注册我们的服务，请忽略此邮件。</p>
            </div>
            <div class="footer">
                <p>© 2025 喝水记录APP. 保持健康，保持水分！</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 生成密码重置模板
  generatePasswordResetTemplate(name, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>重置密码</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 喝水记录APP</h1>
                <h2>重置您的密码</h2>
            </div>
            <div class="content">
                <p>您好 <strong>${name}</strong>，</p>
                <p>我们收到了重置您账户密码的请求。请点击下方按钮设置新密码：</p>
                <p style="text-align: center;">
                    <a href="${resetUrl}" class="button">重置密码</a>
                </p>
                <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                    ${resetUrl}
                </p>
                <div class="warning">
                    <strong>安全提示：</strong>
                    <ul>
                        <li>此链接将在1小时后失效</li>
                        <li>如果您没有请求重置密码，请忽略此邮件</li>
                        <li>为了安全，请在重置后立即登录检查您的账户</li>
                    </ul>
                </div>
            </div>
            <div class="footer">
                <p>© 2025 喝水记录APP. 您的安全是我们的首要任务</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 生成欢迎邮件模板
  generateWelcomeTemplate(name) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>欢迎使用</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .features { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
            .feature { flex: 1; min-width: 200px; background: white; padding: 20px; border-radius: 10px; text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 欢迎加入喝水记录APP</h1>
                <p>开始您的健康饮水之旅</p>
            </div>
            <div class="content">
                <p>亲爱的 <strong>${name}</strong>，</p>
                <p>欢迎您成为我们健康社区的一员！喝水记录APP将帮助您：</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>📱 便捷记录</h3>
                        <p>快速记录每次饮水，培养健康习惯</p>
                    </div>
                    <div class="feature">
                        <h3>⏰ 智能提醒</h3>
                        <p>个性化提醒，从不忘记喝水</p>
                    </div>
                    <div class="feature">
                        <h3>📊 数据分析</h3>
                        <p>详细的统计分析，了解您的饮水模式</p>
                    </div>
                </div>
                
                <p><strong>接下来您可以：</strong></p>
                <ul>
                    <li>设置您的每日饮水目标</li>
                    <li>开始记录您的第一杯水</li>
                    <li>配置个性化的提醒时间</li>
                    <li>探索详细的统计功能</li>
                </ul>
                
                <p>让我们一起开始这段健康之旅吧！💪</p>
            </div>
            <div class="footer">
                <p>© 2025 喝水记录APP. 健康生活，从每一滴水开始</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 生成目标达成模板
  generateGoalAchievementTemplate(name, achievementData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>目标达成</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); color: #2d3436; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .achievement { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 恭喜您！</h1>
                <h2>目标达成通知</h2>
            </div>
            <div class="content">
                <p>亲爱的 <strong>${name}</strong>，</p>
                
                <div class="achievement">
                    <h2>🏆 了不起的成就！</h2>
                    <p>您已连续 <strong>${achievementData.streak}</strong> 天达成饮水目标！</p>
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <h3>${achievementData.totalIntake}ml</h3>
                        <p>总饮水量</p>
                    </div>
                    <div class="stat">
                        <h3>${achievementData.streak}天</h3>
                        <p>连续达标</p>
                    </div>
                    <div class="stat">
                        <h3>${achievementData.achievementRate}%</h3>
                        <p>完成率</p>
                    </div>
                </div>
                
                <p>坚持就是胜利！您的健康饮水习惯正在形成，继续保持下去！</p>
                
                <p><strong>小贴士：</strong>保持规律的饮水习惯对身体健康非常重要，您做得很棒！</p>
            </div>
            <div class="footer">
                <p>© 2025 喝水记录APP. 为您的坚持喝彩！</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 生成月度报告模板
  generateMonthlyReportTemplate(name, reportData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>月度报告</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .report-section { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .stat-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 您的月度饮水报告</h1>
                <p>${reportData.month} 月份总结</p>
            </div>
            <div class="content">
                <p>亲爱的 <strong>${name}</strong>，</p>
                <p>这是您 ${reportData.month} 月份的饮水健康报告：</p>
                
                <div class="report-section">
                    <h3>📈 总体表现</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <h4>${reportData.totalIntake}L</h4>
                            <p>总饮水量</p>
                        </div>
                        <div class="stat-item">
                            <h4>${reportData.averageDaily}ml</h4>
                            <p>日均饮水量</p>
                        </div>
                        <div class="stat-item">
                            <h4>${reportData.goalAchievedDays}天</h4>
                            <p>目标达成天数</p>
                        </div>
                        <div class="stat-item">
                            <h4>${reportData.longestStreak}天</h4>
                            <p>最长连续达标</p>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>🏆 本月亮点</h3>
                    <ul>
                        <li>目标完成率：<strong>${reportData.achievementRate}%</strong></li>
                        <li>最佳记录日：<strong>${reportData.bestDay}</strong></li>
                        <li>最爱饮品：<strong>${reportData.favoritedrink}</strong></li>
                        <li>活跃记录天数：<strong>${reportData.activeDays}天</strong></li>
                    </ul>
                </div>
                
                <div class="report-section">
                    <h3>💡 健康建议</h3>
                    <p>${reportData.healthTips}</p>
                </div>
                
                <p>继续保持良好的饮水习惯，期待下个月更好的表现！</p>
            </div>
            <div class="footer">
                <p>© 2025 喝水记录APP. 健康数据，智慧生活</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 测试邮件服务
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('邮件传输器未初始化');
      }

      await this.transporter.verify();
      return { success: true, message: '邮件服务连接正常' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 获取邮件服务状态
  getStatus() {
    return {
      initialized: !!this.transporter,
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      pooled: true,
    };
  }
}

// 创建单例实例
const emailService = new EmailService();

export default emailService;
