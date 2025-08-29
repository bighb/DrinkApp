import admin from 'firebase-admin';
import config from '../config/index.js';
import { logger, errorLogger } from './logger.js';

class PushNotificationService {
  constructor() {
    this.app = null;
    this.messaging = null;
    this.initialized = false;
    this.initialize();
  }

  // 初始化Firebase Admin SDK
  initialize() {
    try {
      if (
        !config.firebase.projectId ||
        !config.firebase.clientEmail ||
        !config.firebase.privateKey
      ) {
        logger.warn('Firebase配置不完整，推送通知服务将不可用');
        return;
      }

      // 初始化Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
        databaseURL: config.firebase.databaseURL,
      });

      this.messaging = admin.messaging();
      this.initialized = true;

      logger.info('Firebase推送通知服务初始化成功');
    } catch (error) {
      logger.error('Firebase推送通知服务初始化失败:', error);
      this.initialized = false;
    }
  }

  // 发送单个推送通知
  async sendNotification(token, payload, platform = 'android') {
    try {
      if (!this.initialized) {
        throw new Error('推送服务未初始化');
      }

      if (!token) {
        throw new Error('推送令牌不能为空');
      }

      // 构建消息对象
      const message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: this.sanitizeData(payload.data || {}),
        android: this.getAndroidConfig(payload),
        apns: this.getApnsConfig(payload),
        webpush: this.getWebpushConfig(payload),
      };

      const response = await this.messaging.send(message);

      logger.info('推送通知发送成功:', {
        token: token.substring(0, 20) + '...',
        messageId: response,
        title: payload.title,
      });

      return {
        success: true,
        messageId: response,
        token: token,
      };
    } catch (error) {
      errorLogger.external('firebase_messaging', error, {
        token: token?.substring(0, 20) + '...',
        payload: payload.title,
      });

      // 处理特定的Firebase错误
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        return {
          success: false,
          error: 'INVALID_TOKEN',
          message: '推送令牌已失效',
          shouldRemoveToken: true,
        };
      }

      return {
        success: false,
        error: error.code || 'UNKNOWN_ERROR',
        message: error.message,
      };
    }
  }

  // 批量发送推送通知
  async sendMulticastNotification(tokens, payload) {
    try {
      if (!this.initialized) {
        throw new Error('推送服务未初始化');
      }

      if (!tokens || tokens.length === 0) {
        throw new Error('推送令牌列表不能为空');
      }

      // Firebase限制单次最多500个令牌
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < tokens.length; i += batchSize) {
        batches.push(tokens.slice(i, i + batchSize));
      }

      const results = [];

      for (const batch of batches) {
        const message = {
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: this.sanitizeData(payload.data || {}),
          android: this.getAndroidConfig(payload),
          apns: this.getApnsConfig(payload),
          webpush: this.getWebpushConfig(payload),
        };

        const response = await this.messaging.sendMulticast(message);
        results.push(response);
      }

      // 汇总结果
      const summary = results.reduce(
        (acc, result) => {
          acc.successCount += result.successCount;
          acc.failureCount += result.failureCount;
          acc.responses.push(...result.responses);
          return acc;
        },
        {
          successCount: 0,
          failureCount: 0,
          responses: [],
        }
      );

      logger.info('批量推送通知发送完成:', {
        totalTokens: tokens.length,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        title: payload.title,
      });

      // 处理失效的令牌
      const invalidTokens = [];
      summary.responses.forEach((response, index) => {
        if (response.error) {
          const errorCode = response.error.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });

      return {
        success: true,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        invalidTokens,
        responses: summary.responses,
      };
    } catch (error) {
      errorLogger.external('firebase_messaging', error, {
        tokenCount: tokens?.length,
        payload: payload.title,
      });

      return {
        success: false,
        error: error.code || 'UNKNOWN_ERROR',
        message: error.message,
      };
    }
  }

  // 发送主题推送
  async sendTopicNotification(topic, payload) {
    try {
      if (!this.initialized) {
        throw new Error('推送服务未初始化');
      }

      const message = {
        topic: topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: this.sanitizeData(payload.data || {}),
        android: this.getAndroidConfig(payload),
        apns: this.getApnsConfig(payload),
        webpush: this.getWebpushConfig(payload),
      };

      const response = await this.messaging.send(message);

      logger.info('主题推送发送成功:', {
        topic,
        messageId: response,
        title: payload.title,
      });

      return {
        success: true,
        messageId: response,
        topic,
      };
    } catch (error) {
      errorLogger.external('firebase_messaging', error, {
        topic,
        payload: payload.title,
      });

      return {
        success: false,
        error: error.code || 'UNKNOWN_ERROR',
        message: error.message,
      };
    }
  }

  // 订阅主题
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error('推送服务未初始化');
      }

      const response = await this.messaging.subscribeToTopic(tokens, topic);

      logger.info('主题订阅成功:', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error) {
      errorLogger.external('firebase_messaging', error, {
        topic,
        tokenCount: tokens?.length,
      });

      return {
        success: false,
        error: error.code || 'UNKNOWN_ERROR',
        message: error.message,
      };
    }
  }

  // 取消订阅主题
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error('推送服务未初始化');
      }

      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);

      logger.info('取消主题订阅成功:', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error) {
      errorLogger.external('firebase_messaging', error, {
        topic,
        tokenCount: tokens?.length,
      });

      return {
        success: false,
        error: error.code || 'UNKNOWN_ERROR',
        message: error.message,
      };
    }
  }

  // 发送饮水提醒通知
  async sendHydrationReminder(token, reminderData, platform = 'android') {
    const payload = {
      title: '💧 饮水提醒',
      body: reminderData.message || '该喝水啦！保持身体水分充足',
      imageUrl: reminderData.imageUrl,
      data: {
        type: 'hydration_reminder',
        reminderId: reminderData.reminderId?.toString() || '',
        userId: reminderData.userId?.toString() || '',
        timestamp: new Date().toISOString(),
      },
    };

    return await this.sendNotification(token, payload, platform);
  }

  // 发送目标达成通知
  async sendGoalAchievementNotification(
    token,
    achievementData,
    platform = 'android'
  ) {
    const payload = {
      title: '🎯 目标达成！',
      body: `恭喜！您已连续${achievementData.streak}天达成饮水目标`,
      imageUrl: achievementData.imageUrl,
      data: {
        type: 'goal_achievement',
        streak: achievementData.streak?.toString() || '0',
        userId: achievementData.userId?.toString() || '',
        timestamp: new Date().toISOString(),
      },
    };

    return await this.sendNotification(token, payload, platform);
  }

  // 发送健康建议通知
  async sendHealthTipNotification(token, tipData, platform = 'android') {
    const payload = {
      title: '💡 健康小贴士',
      body: tipData.message,
      imageUrl: tipData.imageUrl,
      data: {
        type: 'health_tip',
        tipId: tipData.tipId?.toString() || '',
        category: tipData.category || '',
        userId: tipData.userId?.toString() || '',
        timestamp: new Date().toISOString(),
      },
    };

    return await this.sendNotification(token, payload, platform);
  }

  // Android特定配置
  getAndroidConfig(payload) {
    return {
      priority: 'high',
      ttl: 3600000, // 1小时
      notification: {
        icon: 'ic_notification',
        color: '#667eea',
        sound: payload.sound || 'default',
        tag: payload.tag,
        clickAction: payload.clickAction,
        channelId: 'hydration_reminders',
      },
      data: payload.androidData || {},
    };
  }

  // iOS特定配置
  getApnsConfig(payload) {
    return {
      headers: {
        'apns-priority': '10',
        'apns-expiration': Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      },
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          badge: payload.badge || 0,
          sound: payload.sound || 'default',
          category: payload.category,
          'thread-id': payload.threadId,
          'mutable-content': payload.mutableContent ? 1 : 0,
        },
        customData: payload.iosData || {},
      },
    };
  }

  // Web推送特定配置
  getWebpushConfig(payload) {
    return {
      headers: {
        TTL: '3600', // 1小时
        Urgency: payload.urgent ? 'high' : 'normal',
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || '/icons/badge-icon.png',
        image: payload.imageUrl,
        tag: payload.tag,
        renotify: payload.renotify || false,
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || [],
        data: payload.webData || {},
      },
    };
  }

  // 清理数据对象（确保所有值都是字符串）
  sanitizeData(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        sanitized[key] = String(value);
      }
    }
    return sanitized;
  }

  // 验证推送令牌
  async validateToken(token) {
    try {
      if (!this.initialized) {
        return { valid: false, error: '推送服务未初始化' };
      }

      // 尝试发送一个干运行消息来验证令牌
      const message = {
        token: token,
        notification: {
          title: 'Test',
          body: 'Test',
        },
        dryRun: true, // 不实际发送
      };

      await this.messaging.send(message);

      return { valid: true };
    } catch (error) {
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        return { valid: false, error: '令牌无效或未注册' };
      }

      return { valid: false, error: error.message };
    }
  }

  // 获取服务状态
  getStatus() {
    return {
      initialized: this.initialized,
      serviceAvailable: !!this.messaging,
      projectId: config.firebase.projectId,
      timestamp: new Date().toISOString(),
    };
  }

  // 创建通知模板
  createReminderTemplate(type, data = {}) {
    const templates = {
      morning: {
        title: '🌅 早安提醒',
        body: '新的一天开始了，来杯温水唤醒身体吧！',
        icon: 'morning',
      },
      regular: {
        title: '💧 饮水提醒',
        body: data.message || '该喝水啦！保持身体水分充足',
        icon: 'water',
      },
      evening: {
        title: '🌙 晚间提醒',
        body: '睡前适量补水，有助于更好的休息',
        icon: 'evening',
      },
      achievement: {
        title: '🏆 目标达成',
        body: `恭喜！您已连续${data.streak || 1}天达成饮水目标`,
        icon: 'achievement',
      },
      milestone: {
        title: '🎉 重要里程碑',
        body: `太棒了！您已记录${data.totalRecords || 100}次饮水`,
        icon: 'milestone',
      },
    };

    return templates[type] || templates.regular;
  }
}

// 创建单例实例
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
