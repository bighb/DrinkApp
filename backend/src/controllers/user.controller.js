import { validationResult } from 'express-validator';
import * as UserModel from '../models/user.model.js';
import * as AuthModel from '../models/auth.model.js';
import AuthService from '../utils/auth.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import config from '../config/index.js';

/**
 * 用户管理控制器 - 函数式风格
 */

// 获取用户资料
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserModel.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    // 移除敏感信息
    const { password_hash, ...safeProfile } = profile;

    res.json({
      success: true,
      data: { user: safeProfile },
    });
  } catch (error) {
    errorLogger.api('Get user profile failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_PROFILE_FAILED',
      message: '获取用户资料失败',
    });
  }
};

// 更新用户资料
export const updateUserProfile = async (req, res) => {
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

    // 如果更新了影响饮水目标的字段，重新计算默认目标
    if (
      updateData.weight ||
      updateData.height ||
      updateData.activity_level ||
      updateData.gender
    ) {
      const currentProfile = await UserModel.getUserProfile(userId);
      if (currentProfile) {
        const newGoal = AuthModel.calculateDefaultGoal(
          updateData.weight || currentProfile.weight,
          updateData.height || currentProfile.height,
          updateData.activity_level || currentProfile.activity_level,
          updateData.gender || currentProfile.gender
        );

        // 询问用户是否要更新目标
        updateData.suggested_daily_goal = newGoal;
      }
    }

    const affectedRows = await UserModel.updateUserProfile(userId, updateData);

    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_CHANGES',
        message: '没有可更新的数据',
      });
    }

    // 获取更新后的资料
    const updatedProfile = await UserModel.getUserProfile(userId);

    businessLogger.info('User profile updated', { userId, updateData });

    res.json({
      success: true,
      message: '资料更新成功',
      data: {
        user: updatedProfile,
        suggested_daily_goal: updateData.suggested_daily_goal || null,
      },
    });
  } catch (error) {
    errorLogger.api('Update user profile failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_PROFILE_FAILED',
      message: '更新资料失败',
    });
  }
};

// 获取用户统计信息
export const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '7d', timezone = 'UTC' } = req.query;

    // 验证period参数
    const validPeriods = ['7d', '30d', '3m'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PERIOD',
        message: '无效的时间段参数',
      });
    }

    const statistics = await UserModel.getUserStatistics(
      userId,
      period,
      timezone
    );
    const todayStats = await UserModel.getTodayStatistics(userId, timezone);
    const achievementStats = await UserModel.getGoalAchievementStats(userId);
    const activityStats = await UserModel.getUserActivityStats(userId, period);

    res.json({
      success: true,
      data: {
        period,
        today: todayStats,
        statistics,
        achievement: achievementStats,
        activity: activityStats,
      },
    });
  } catch (error) {
    errorLogger.api('Get user statistics failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_STATISTICS_FAILED',
      message: '获取统计信息失败',
    });
  }
};

// 更新饮水目标
export const updateWaterGoal = async (req, res) => {
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
    const { goalValue, goalType = 'daily' } = req.body;

    // 验证目标值范围
    if (
      goalValue < config.business.minDailyGoal ||
      goalValue > config.business.maxDailyGoal
    ) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_GOAL_VALUE',
        message: `饮水目标应在 ${config.business.minDailyGoal}ml - ${config.business.maxDailyGoal}ml 之间`,
      });
    }

    await UserModel.updateUserGoal(userId, goalValue, goalType);

    businessLogger.info('Water goal updated', { userId, goalValue, goalType });

    res.json({
      success: true,
      message: '饮水目标更新成功',
      data: {
        daily_goal: goalValue,
        goal_type: goalType,
      },
    });
  } catch (error) {
    errorLogger.api('Update water goal failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_GOAL_FAILED',
      message: '更新饮水目标失败',
    });
  }
};

// 修改密码
export const changePassword = async (req, res) => {
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
    const { currentPassword, newPassword } = req.body;

    // 获取用户当前密码哈希
    const user = await AuthModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    // 验证当前密码
    const currentPasswordHash = await AuthService.hashPassword(currentPassword);
    if (currentPasswordHash !== user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CURRENT_PASSWORD',
        message: '当前密码错误',
      });
    }

    // 检查新密码是否与当前密码相同
    const newPasswordHash = await AuthService.hashPassword(newPassword);
    if (newPasswordHash === user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'SAME_PASSWORD',
        message: '新密码不能与当前密码相同',
      });
    }

    // 更新密码
    await UserModel.changeUserPassword(userId, newPasswordHash);

    // 注销所有其他会话（保留当前会话）
    await AuthModel.removeAllUserSessions(userId);

    businessLogger.info('Password changed successfully', { userId });

    res.json({
      success: true,
      message: '密码修改成功，其他设备需要重新登录',
    });
  } catch (error) {
    errorLogger.api('Change password failed:', error);
    res.status(500).json({
      success: false,
      error: 'CHANGE_PASSWORD_FAILED',
      message: '修改密码失败',
    });
  }
};

// 上传头像
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // 检查是否有上传的文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE_UPLOADED',
        message: '请选择要上传的头像文件',
      });
    }

    // 构建头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新用户头像
    await UserModel.updateUserAvatar(userId, avatarUrl);

    businessLogger.info('Avatar uploaded successfully', { userId, avatarUrl });

    res.json({
      success: true,
      message: '头像上传成功',
      data: { avatar_url: avatarUrl },
    });
  } catch (error) {
    errorLogger.api('Upload avatar failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPLOAD_AVATAR_FAILED',
      message: '头像上传失败',
    });
  }
};

// 删除头像
export const removeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    await UserModel.removeUserAvatar(userId);

    businessLogger.info('Avatar removed successfully', { userId });

    res.json({
      success: true,
      message: '头像删除成功',
    });
  } catch (error) {
    errorLogger.api('Remove avatar failed:', error);
    res.status(500).json({
      success: false,
      error: 'REMOVE_AVATAR_FAILED',
      message: '头像删除失败',
    });
  }
};

// 获取用户偏好分析
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await UserModel.getUserPreferences(userId);

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    errorLogger.api('Get user preferences failed:', error);
    res.status(500).json({
      success: false,
      error: 'GET_PREFERENCES_FAILED',
      message: '获取用户偏好失败',
    });
  }
};

// 导出用户数据
export const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const exportData = await UserModel.exportUserData(userId);

    // 设置响应头
    const filename = `user_data_export_${userId}_${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    businessLogger.info('User data exported', { userId });

    res.json({
      success: true,
      message: '数据导出成功',
      data: exportData,
    });
  } catch (error) {
    errorLogger.api('Export user data failed:', error);
    res.status(500).json({
      success: false,
      error: 'EXPORT_DATA_FAILED',
      message: '数据导出失败',
    });
  }
};

// 删除用户账户
export const deleteAccount = async (req, res) => {
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
    const { password, confirmText } = req.body;

    // 验证确认文本
    if (confirmText !== '删除我的账户') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CONFIRMATION',
        message: '请输入正确的确认文本："删除我的账户"',
      });
    }

    // 验证密码
    const user = await AuthModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    const passwordHash = await AuthService.hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PASSWORD',
        message: '密码错误',
      });
    }

    // 执行软删除
    await UserModel.deleteUserAccount(userId);

    businessLogger.info('User account deleted', { userId, email: user.email });

    res.json({
      success: true,
      message: '账户删除成功',
    });
  } catch (error) {
    errorLogger.api('Delete account failed:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_ACCOUNT_FAILED',
      message: '账户删除失败',
    });
  }
};
