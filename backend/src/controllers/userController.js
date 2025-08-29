import { body, query, validationResult } from 'express-validator';
import AuthService from '../utils/auth.js';
import db from '../config/database.js';
import { businessLogger, errorLogger } from '../utils/logger.js';

class UserController {
  // 获取用户资料
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          u.id, u.email, u.username, u.full_name, u.avatar_url,
          u.gender, u.date_of_birth, u.height, u.weight, u.activity_level,
          u.daily_water_goal, u.wake_up_time, u.sleep_time,
          u.timezone, u.locale, u.email_verified, u.is_premium,
          u.premium_expires_at, u.data_sharing_enabled, u.analytics_enabled,
          u.created_at, u.updated_at, u.last_login_at,
          -- 统计信息
          (SELECT COUNT(*) FROM hydration_records WHERE user_id = u.id AND deleted_at IS NULL) as total_records,
          (SELECT COALESCE(SUM(amount), 0) FROM hydration_records WHERE user_id = u.id AND deleted_at IS NULL) as total_intake,
          (SELECT COUNT(DISTINCT DATE(recorded_at)) FROM hydration_records WHERE user_id = u.id AND deleted_at IS NULL) as active_days,
          (SELECT COALESCE(SUM(amount), 0) FROM hydration_records WHERE user_id = u.id AND DATE(recorded_at) = CURDATE() AND deleted_at IS NULL) as today_intake,
          -- 当前连续达标天数
          (SELECT current_streak FROM user_goals WHERE user_id = u.id AND is_active = true ORDER BY created_at DESC LIMIT 1) as current_streak,
          (SELECT best_streak FROM user_goals WHERE user_id = u.id AND is_active = true ORDER BY created_at DESC LIMIT 1) as best_streak
        FROM users u
        WHERE u.id = ?
      `;

      const { rows: users } = await db.query(query, [userId]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在',
        });
      }

      const user = users[0];

      // 获取最近的饮水记录
      const recentRecordsQuery = `
        SELECT amount, drink_type, recorded_at, activity_context
        FROM hydration_records
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY recorded_at DESC
        LIMIT 5
      `;

      const { rows: recentRecords } = await db.query(recentRecordsQuery, [userId]);

      // 获取本周统计
      const weekStatsQuery = `
        SELECT 
          DATE(recorded_at) as date,
          SUM(amount) as daily_intake,
          COUNT(*) as daily_records
        FROM hydration_records
        WHERE user_id = ? 
          AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE())-1 DAY)
          AND deleted_at IS NULL
        GROUP BY DATE(recorded_at)
        ORDER BY date
      `;

      const { rows: weekStats } = await db.query(weekStatsQuery, [userId]);

      // 构造响应数据
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        
        // 个人信息
        personalInfo: {
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          height: user.height,
          weight: user.weight,
          activityLevel: user.activity_level,
        },

        // 目标设置
        goals: {
          dailyWaterGoal: user.daily_water_goal,
          wakeUpTime: user.wake_up_time,
          sleepTime: user.sleep_time,
        },

        // 系统设置
        settings: {
          timezone: user.timezone,
          locale: user.locale,
          dataSharingEnabled: user.data_sharing_enabled,
          analyticsEnabled: user.analytics_enabled,
        },

        // 账户状态
        account: {
          emailVerified: user.email_verified,
          isPremium: user.is_premium,
          premiumExpiresAt: user.premium_expires_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLoginAt: user.last_login_at,
        },

        // 统计信息
        statistics: {
          totalRecords: parseInt(user.total_records) || 0,
          totalIntake: parseInt(user.total_intake) || 0,
          activeDays: parseInt(user.active_days) || 0,
          todayIntake: parseInt(user.today_intake) || 0,
          currentStreak: parseInt(user.current_streak) || 0,
          bestStreak: parseInt(user.best_streak) || 0,
        },

        // 最近记录
        recentRecords: recentRecords.map(record => ({
          amount: record.amount,
          drinkType: record.drink_type,
          recordedAt: record.recorded_at,
          activityContext: record.activity_context,
        })),

        // 本周统计
        weeklyStats: weekStats.map(stat => ({
          date: stat.date,
          dailyIntake: parseInt(stat.daily_intake),
          dailyRecords: parseInt(stat.daily_records),
          goalAchieved: parseInt(stat.daily_intake) >= user.daily_water_goal,
        })),
      };

      res.json({
        success: true,
        data: userData,
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_PROFILE_ERROR',
        message: '获取用户资料失败',
      });
    }
  }

  // 更新用户资料
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const updateData = req.body;

      // 定义可更新的字段
      const allowedFields = {
        full_name: updateData.fullName,
        gender: updateData.gender,
        date_of_birth: updateData.dateOfBirth,
        height: updateData.height,
        weight: updateData.weight,
        activity_level: updateData.activityLevel,
        daily_water_goal: updateData.dailyWaterGoal,
        wake_up_time: updateData.wakeUpTime,
        sleep_time: updateData.sleepTime,
        timezone: updateData.timezone,
        locale: updateData.locale,
        data_sharing_enabled: updateData.dataSharingEnabled,
        analytics_enabled: updateData.analyticsEnabled,
      };

      // 过滤掉未定义的字段
      const fieldsToUpdate = {};
      const values = [];
      const setClause = [];

      Object.entries(allowedFields).forEach(([dbField, value]) => {
        if (value !== undefined) {
          fieldsToUpdate[dbField] = value;
          values.push(value);
          setClause.push(`${dbField} = ?`);
        }
      });

      if (setClause.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_FIELDS_TO_UPDATE',
          message: '没有需要更新的字段',
        });
      }

      // 执行更新
      values.push(userId); // 添加 WHERE 条件的参数
      const updateQuery = `
        UPDATE users 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, values);

      // 如果更新了饮水目标，同步更新用户目标表
      if (updateData.dailyWaterGoal !== undefined) {
        const goalUpdateQuery = `
          UPDATE user_goals 
          SET target_value = ?, updated_at = NOW()
          WHERE user_id = ? AND is_active = true
        `;

        await db.query(goalUpdateQuery, [updateData.dailyWaterGoal, userId]);
      }

      // 清除用户缓存
      await db.deleteCache(`user:${userId}`);

      // 记录更新日志
      businessLogger.userAction(userId, 'update_profile', {
        updatedFields: Object.keys(fieldsToUpdate),
      });

      res.json({
        success: true,
        message: '用户资料更新成功',
        data: {
          updatedFields: Object.keys(fieldsToUpdate),
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'UPDATE_PROFILE_ERROR',
        message: '更新用户资料失败',
      });
    }
  }

  // 修改密码
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // 获取当前密码哈希
      const userQuery = 'SELECT password_hash FROM users WHERE id = ?';
      const { rows: users } = await db.query(userQuery, [userId]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在',
        });
      }

      const user = users[0];

      // 验证当前密码
      const isCurrentPasswordValid = await AuthService.verifyPassword(
        currentPassword, 
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        businessLogger.securityEvent('password_change_failed', userId, req.ip, {
          reason: 'invalid_current_password'
        });

        return res.status(400).json({
          success: false,
          error: 'INVALID_CURRENT_PASSWORD',
          message: '当前密码错误',
        });
      }

      // 检查新密码是否与当前密码相同
      const isSamePassword = await AuthService.verifyPassword(newPassword, user.password_hash);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: 'SAME_PASSWORD',
          message: '新密码不能与当前密码相同',
        });
      }

      // 加密新密码
      const newPasswordHash = await AuthService.hashPassword(newPassword);

      // 更新密码
      await db.query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newPasswordHash, userId]
      );

      // 清除除当前会话外的所有会话（可选）
      const currentSessionToken = req.session.session_token;
      await db.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = ? AND session_token != ?',
        [userId, currentSessionToken]
      );

      businessLogger.userAction(userId, 'change_password', {
        ip: req.ip,
        sessionId: currentSessionToken,
      });

      res.json({
        success: true,
        message: '密码修改成功',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'CHANGE_PASSWORD_ERROR',
        message: '修改密码失败',
      });
    }
  }

  // 上传头像
  static async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILE_UPLOADED',
          message: '请选择要上传的图片',
        });
      }

      const userId = req.user.id;
      const file = req.file;

      // 这里应该集成云存储服务（AWS S3, Google Cloud Storage等）
      // 简化处理，直接返回本地文件路径
      const avatarUrl = `/uploads/avatars/${file.filename}`;

      // 更新用户头像URL
      await db.query(
        'UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?',
        [avatarUrl, userId]
      );

      // 清除用户缓存
      await db.deleteCache(`user:${userId}`);

      businessLogger.userAction(userId, 'upload_avatar', {
        filename: file.filename,
        size: file.size,
      });

      res.json({
        success: true,
        message: '头像上传成功',
        data: {
          avatarUrl,
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'UPLOAD_AVATAR_ERROR',
        message: '头像上传失败',
      });
    }
  }

  // 删除头像
  static async deleteAvatar(req, res) {
    try {
      const userId = req.user.id;

      // 移除头像URL
      await db.query(
        'UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      // 清除用户缓存
      await db.deleteCache(`user:${userId}`);

      businessLogger.userAction(userId, 'delete_avatar');

      res.json({
        success: true,
        message: '头像删除成功',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'DELETE_AVATAR_ERROR',
        message: '头像删除失败',
      });
    }
  }

  // 获取用户统计数据
  static async getStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'week', startDate, endDate } = req.query;

      let dateCondition = '';
      let dateParams = [];

      if (startDate && endDate) {
        dateCondition = 'AND DATE(recorded_at) BETWEEN ? AND ?';
        dateParams = [startDate, endDate];
      } else {
        // 根据period设置日期条件
        switch (period) {
          case 'today':
            dateCondition = 'AND DATE(recorded_at) = CURDATE()';
            break;
          case 'week':
            dateCondition = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
            break;
          case 'month':
            dateCondition = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
            break;
          case 'year':
            dateCondition = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
            break;
          default:
            dateCondition = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        }
      }

      // 获取基础统计数据
      const statsQuery = `
        SELECT 
          COUNT(*) as total_records,
          SUM(amount) as total_intake,
          AVG(amount) as avg_record_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          COUNT(DISTINCT DATE(recorded_at)) as active_days,
          -- 按饮品类型统计
          SUM(CASE WHEN drink_type = 'water' THEN amount ELSE 0 END) as water_intake,
          SUM(CASE WHEN drink_type = 'tea' THEN amount ELSE 0 END) as tea_intake,
          SUM(CASE WHEN drink_type = 'coffee' THEN amount ELSE 0 END) as coffee_intake,
          SUM(CASE WHEN drink_type NOT IN ('water', 'tea', 'coffee') THEN amount ELSE 0 END) as other_intake,
          -- 按时间段统计
          SUM(CASE WHEN HOUR(recorded_at) BETWEEN 6 AND 11 THEN amount ELSE 0 END) as morning_intake,
          SUM(CASE WHEN HOUR(recorded_at) BETWEEN 12 AND 17 THEN amount ELSE 0 END) as afternoon_intake,
          SUM(CASE WHEN HOUR(recorded_at) BETWEEN 18 AND 23 THEN amount ELSE 0 END) as evening_intake,
          SUM(CASE WHEN HOUR(recorded_at) BETWEEN 0 AND 5 THEN amount ELSE 0 END) as night_intake
        FROM hydration_records
        WHERE user_id = ? AND deleted_at IS NULL ${dateCondition}
      `;

      const { rows: stats } = await db.query(statsQuery, [userId, ...dateParams]);
      const statistics = stats[0] || {};

      // 获取每日统计数据
      const dailyStatsQuery = `
        SELECT 
          DATE(recorded_at) as date,
          SUM(amount) as daily_intake,
          COUNT(*) as daily_records,
          AVG(amount) as avg_amount_per_record
        FROM hydration_records
        WHERE user_id = ? AND deleted_at IS NULL ${dateCondition}
        GROUP BY DATE(recorded_at)
        ORDER BY date DESC
      `;

      const { rows: dailyStats } = await db.query(dailyStatsQuery, [userId, ...dateParams]);

      // 获取用户目标
      const goalQuery = `
        SELECT target_value, current_streak, best_streak
        FROM user_goals
        WHERE user_id = ? AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const { rows: goals } = await db.query(goalQuery, [userId]);
      const currentGoal = goals[0] || { target_value: 2000, current_streak: 0, best_streak: 0 };

      // 计算目标达成率
      const goalAchievementDays = dailyStats.filter(day => 
        day.daily_intake >= currentGoal.target_value
      ).length;

      const goalAchievementRate = dailyStats.length > 0 
        ? (goalAchievementDays / dailyStats.length) * 100 
        : 0;

      // 计算总摄入量的饮品分布
      const totalIntake = parseInt(statistics.total_intake) || 0;
      const drinkDistribution = totalIntake > 0 ? {
        water: ((parseInt(statistics.water_intake) || 0) / totalIntake * 100).toFixed(1),
        tea: ((parseInt(statistics.tea_intake) || 0) / totalIntake * 100).toFixed(1),
        coffee: ((parseInt(statistics.coffee_intake) || 0) / totalIntake * 100).toFixed(1),
        other: ((parseInt(statistics.other_intake) || 0) / totalIntake * 100).toFixed(1),
      } : { water: 0, tea: 0, coffee: 0, other: 0 };

      // 计算时间分布
      const timeDistribution = totalIntake > 0 ? {
        morning: ((parseInt(statistics.morning_intake) || 0) / totalIntake * 100).toFixed(1),
        afternoon: ((parseInt(statistics.afternoon_intake) || 0) / totalIntake * 100).toFixed(1),
        evening: ((parseInt(statistics.evening_intake) || 0) / totalIntake * 100).toFixed(1),
        night: ((parseInt(statistics.night_intake) || 0) / totalIntake * 100).toFixed(1),
      } : { morning: 0, afternoon: 0, evening: 0, night: 0 };

      res.json({
        success: true,
        data: {
          period,
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
          overview: {
            totalRecords: parseInt(statistics.total_records) || 0,
            totalIntake: parseInt(statistics.total_intake) || 0,
            averagePerRecord: parseFloat(statistics.avg_record_amount) || 0,
            minAmount: parseInt(statistics.min_amount) || 0,
            maxAmount: parseInt(statistics.max_amount) || 0,
            activeDays: parseInt(statistics.active_days) || 0,
          },
          goals: {
            currentGoal: currentGoal.target_value,
            currentStreak: currentGoal.current_streak,
            bestStreak: currentGoal.best_streak,
            achievementRate: parseFloat(goalAchievementRate.toFixed(1)),
            achievedDays: goalAchievementDays,
          },
          distribution: {
            drinkTypes: drinkDistribution,
            timeOfDay: timeDistribution,
          },
          dailyStats: dailyStats.map(day => ({
            date: day.date,
            intake: parseInt(day.daily_intake),
            records: parseInt(day.daily_records),
            averagePerRecord: parseFloat(day.avg_amount_per_record).toFixed(1),
            goalAchieved: parseInt(day.daily_intake) >= currentGoal.target_value,
          })),
        },
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'GET_STATISTICS_ERROR',
        message: '获取统计数据失败',
      });
    }
  }

  // 注销账户
  static async deleteAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details: errors.array(),
        });
      }

      const { password, confirmDelete } = req.body;
      const userId = req.user.id;

      if (confirmDelete !== 'DELETE_ACCOUNT') {
        return res.status(400).json({
          success: false,
          error: 'CONFIRMATION_REQUIRED',
          message: '请输入确认文本: DELETE_ACCOUNT',
        });
      }

      // 验证密码
      const userQuery = 'SELECT password_hash FROM users WHERE id = ?';
      const { rows: users } = await db.query(userQuery, [userId]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在',
        });
      }

      const user = users[0];
      const isPasswordValid = await AuthService.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        businessLogger.securityEvent('account_deletion_failed', userId, req.ip, {
          reason: 'invalid_password'
        });

        return res.status(400).json({
          success: false,
          error: 'INVALID_PASSWORD',
          message: '密码错误',
        });
      }

      // 执行账户删除（软删除）
      await db.transaction(async (connection) => {
        // 软删除用户记录
        await connection.execute(
          'UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = ?',
          [userId]
        );

        // 软删除相关数据
        await connection.execute(
          'UPDATE hydration_records SET deleted_at = NOW() WHERE user_id = ?',
          [userId]
        );

        // 禁用所有会话
        await connection.execute(
          'UPDATE user_sessions SET is_active = false WHERE user_id = ?',
          [userId]
        );

        // 清除设备信息
        await connection.execute(
          'UPDATE user_devices SET is_active = false WHERE user_id = ?',
          [userId]
        );
      });

      // 清除缓存
      await db.deleteCache(`user:${userId}`);

      businessLogger.userAction(userId, 'delete_account', {
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: '账户删除成功',
      });

    } catch (error) {
      errorLogger.api(error, req);
      
      res.status(500).json({
        success: false,
        error: 'DELETE_ACCOUNT_ERROR',
        message: '账户删除失败',
      });
    }
  }
}

// 输入验证规则
const updateProfileValidation = [
  body('fullName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('性别值无效'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .isBefore(new Date().toISOString())
    .withMessage('出生日期格式无效'),
  body('height')
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage('身高应在100-250cm之间'),
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('体重应在30-300kg之间'),
  body('activityLevel')
    .optional()
    .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .withMessage('活动水平值无效'),
  body('dailyWaterGoal')
    .optional()
    .isInt({ min: 500, max: 5000 })
    .withMessage('每日饮水目标应在500-5000ml之间'),
  body('wakeUpTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('起床时间格式无效'),
  body('sleepTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('睡眠时间格式无效'),
  body('timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('时区格式无效'),
  body('locale')
    .optional()
    .isLength({ max: 10 })
    .withMessage('语言设置格式无效'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码至少8位，包含大小写字母和数字'),
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('请输入密码确认'),
  body('confirmDelete')
    .equals('DELETE_ACCOUNT')
    .withMessage('请输入确认文本: DELETE_ACCOUNT'),
];

const statisticsValidation = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('时间周期参数无效'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
];

export {
  UserController,
  updateProfileValidation,
  changePasswordValidation,
  deleteAccountValidation,
  statisticsValidation,
};

export default UserController;