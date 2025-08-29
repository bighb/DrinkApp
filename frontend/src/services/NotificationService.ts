import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiService } from './ApiService';
import { ApiResponse } from '@/types';

export class NotificationService {
  private static pushToken: string | null = null;

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permissions and get push token
      await this.requestPermissions();
      await this.registerForPushNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Permission for notifications not granted');
          return false;
        }

        return true;
      } else {
        console.warn('Must use physical device for push notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for push notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = token.data;
      console.log('Push notification token:', this.pushToken);

      // Configure platform-specific settings
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Create hydration reminder channel
        await Notifications.setNotificationChannelAsync('hydration-reminders', {
          name: 'Hydration Reminders',
          description: 'Notifications to remind you to drink water',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'water_drop.wav',
        });

        // Create achievement channel
        await Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          description: 'Notifications for achieved milestones',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          sound: 'success.wav',
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Set up notification event listeners
   */
  private static setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // You can customize the behavior when notification is received
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different types of notifications
      switch (data?.type) {
        case 'hydration_reminder':
          this.handleHydrationReminderTap(data);
          break;
        case 'achievement_unlocked':
          this.handleAchievementTap(data);
          break;
        case 'weekly_report':
          this.handleWeeklyReportTap(data);
          break;
        default:
          console.log('Unknown notification type:', data?.type);
      }
    });
  }

  /**
   * Handle hydration reminder notification tap
   */
  private static handleHydrationReminderTap(data: any): void {
    // Navigate to quick record screen or show quick record modal
    console.log('Handling hydration reminder tap:', data);
    // Navigation logic would go here
  }

  /**
   * Handle achievement notification tap
   */
  private static handleAchievementTap(data: any): void {
    // Navigate to achievements screen
    console.log('Handling achievement tap:', data);
    // Navigation logic would go here
  }

  /**
   * Handle weekly report notification tap
   */
  private static handleWeeklyReportTap(data: any): void {
    // Navigate to statistics screen
    console.log('Handling weekly report tap:', data);
    // Navigation logic would go here
  }

  /**
   * Send local notification
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          priority: Notifications.AndroidImportance.HIGH,
          color: '#0ea5e9',
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule hydration reminder
   */
  static async scheduleHydrationReminder(
    message: string,
    scheduledDate: Date,
    reminderId?: number
  ): Promise<string> {
    try {
      const trigger = {
        date: scheduledDate,
      };

      const notificationId = await this.scheduleLocalNotification(
        'Time to Hydrate! 💧',
        message,
        {
          type: 'hydration_reminder',
          reminder_id: reminderId,
          scheduled_at: scheduledDate.toISOString(),
        },
        trigger
      );

      return notificationId;
    } catch (error) {
      console.error('Error scheduling hydration reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule repeating hydration reminders
   */
  static async scheduleRepeatingReminders(
    intervalMinutes: number,
    startTime: Date,
    endTime: Date,
    message: string = 'Don\'t forget to drink water!'
  ): Promise<string[]> {
    try {
      const notificationIds: string[] = [];
      const current = new Date(startTime);
      
      while (current <= endTime) {
        const notificationId = await this.scheduleHydrationReminder(
          message,
          new Date(current)
        );
        notificationIds.push(notificationId);
        
        current.setMinutes(current.getMinutes() + intervalMinutes);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling repeating reminders:', error);
      throw error;
    }
  }

  /**
   * Cancel notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  /**
   * Get scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Register push token with server
   */
  static async registerPushToken(token: string, authToken: string): Promise<ApiResponse<void>> {
    try {
      const response = await ApiService.post('/users/push-token', {
        push_token: token,
        platform: Platform.OS,
        device_id: Constants.deviceId || 'unknown',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Error registering push token:', error);
      throw new Error(error.message || 'Failed to register push token');
    }
  }

  /**
   * Get current push token
   */
  static getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Request to respond to reminder
   */
  static async respondToReminder(
    reminderId: number,
    response: 'drink_logged' | 'snooze_5min' | 'snooze_15min' | 'dismiss',
    authToken: string
  ): Promise<ApiResponse<void>> {
    try {
      const apiResponse = await ApiService.post(`/reminders/${reminderId}/respond`, {
        response_type: response,
        responded_at: new Date().toISOString(),
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return apiResponse;
    } catch (error: any) {
      console.error('Error responding to reminder:', error);
      throw new Error(error.message || 'Failed to respond to reminder');
    }
  }

  /**
   * Show achievement notification
   */
  static async showAchievementNotification(
    achievementName: string,
    description: string,
    points: number
  ): Promise<void> {
    try {
      await this.scheduleLocalNotification(
        `🏆 Achievement Unlocked: ${achievementName}`,
        `${description} (+${points} points)`,
        {
          type: 'achievement_unlocked',
          achievement_name: achievementName,
          points,
        }
      );
    } catch (error) {
      console.error('Error showing achievement notification:', error);
    }
  }

  /**
   * Show daily goal completed notification
   */
  static async showGoalCompletedNotification(intake: number, goal: number): Promise<void> {
    try {
      await this.scheduleLocalNotification(
        '🎉 Daily Goal Achieved!',
        `Great job! You've reached your daily hydration goal of ${goal}ml.`,
        {
          type: 'goal_completed',
          intake,
          goal,
        }
      );
    } catch (error) {
      console.error('Error showing goal completed notification:', error);
    }
  }

  /**
   * Show weekly report notification
   */
  static async showWeeklyReportNotification(averageIntake: number, bestDay: string): Promise<void> {
    try {
      await this.scheduleLocalNotification(
        '📊 Your Weekly Hydration Report',
        `Average: ${averageIntake}ml/day. Best day: ${bestDay}. Tap to see details.`,
        {
          type: 'weekly_report',
          average_intake: averageIntake,
          best_day: bestDay,
        }
      );
    } catch (error) {
      console.error('Error showing weekly report notification:', error);
    }
  }
}