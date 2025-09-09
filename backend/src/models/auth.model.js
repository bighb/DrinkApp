import {
  executeQuery,
  findOne,
  findMany,
  create,
  update,
  remove,
  transaction,
} from './base.model.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import moment from 'moment-timezone';

/**
 * 认证相关数据模型
 */

// 根据邮箱或用户名查找用户
export const findUserByEmailOrUsername = async (email, username) => {
  const query = `
    SELECT id, email, username, password_hash, email_verified, is_active, created_at
    FROM users 
    WHERE (email = ? OR username = ?) AND deleted_at IS NULL
  `;

  const { rows } = await executeQuery(query, [email, username]);
  return rows[0] || null;
};

// 根据ID查找用户（包含统计信息）
export const findUserById = async userId => {
  const query = `
    SELECT u.*, us.streak_days, us.total_intake, us.goal_achievement_rate
    FROM users u
    LEFT JOIN user_statistics us ON u.id = us.user_id
    WHERE u.id = ? AND u.deleted_at IS NULL
  `;

  const { rows } = await executeQuery(query, [userId]);
  return rows[0] || null;
};

// 创建新用户
export const createUser = async userData => {
  const {
    email,
    username,
    password_hash,
    full_name,
    gender,
    date_of_birth,
    height,
    weight,
    activity_level,
  } = userData;

  const createTime = moment().format('YYYY-MM-DD HH:mm:ss');

  const insertData = {
    email,
    username,
    password_hash,
    full_name,
    gender,
    date_of_birth,
    height,
    weight,
    activity_level,
    email_verified: false,
    is_active: true,
    created_at: createTime,
    updated_at: createTime,
  };

  const result = await create('users', insertData);
  return result.insertId;
};

// 计算默认饮水目标
export const calculateDefaultGoal = (weight, height, activityLevel, gender) => {
  // 基础需水量计算 (ml)
  let baseWater = weight * 35;

  // 根据活动水平调整
  const activityMultipliers = {
    sedentary: 1.0,
    lightly_active: 1.1,
    moderately_active: 1.2,
    very_active: 1.4,
    extremely_active: 1.6,
  };

  baseWater *= activityMultipliers[activityLevel] || 1.0;

  // 根据性别微调
  if (gender === 'male') {
    baseWater *= 1.05;
  }

  // 四舍五入到最近的100ml
  return Math.round(baseWater / 100) * 100;
};

// 创建默认饮水目标
export const createDefaultGoal = async (userId, goalValue) => {
  const goalData = {
    user_id: userId,
    daily_goal: goalValue,
    goal_type: 'daily',
    is_active: true,
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  return await create('hydration_goals', goalData);
};

// 创建默认提醒设置
export const createDefaultReminderSettings = async userId => {
  const settingsData = {
    user_id: userId,
    is_enabled: true,
    start_time: '08:00:00',
    end_time: '22:00:00',
    interval_minutes: 120, // 2小时间隔
    smart_reminders: true,
    weekend_enabled: true,
    reminder_types: JSON.stringify(['push', 'sound']),
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  return await create('reminder_settings', settingsData);
};

// 验证用户凭据
export const validateUserCredentials = async (login, passwordHash) => {
  const query = `
    SELECT 
      id, email, username, full_name, password_hash,
      email_verified, is_active, last_login_at
    FROM users 
    WHERE (email = ? OR username = ?) 
      AND password_hash = ? 
      AND deleted_at IS NULL
      AND is_active = true
  `;

  const { rows } = await executeQuery(query, [login, login, passwordHash]);
  return rows[0] || null;
};

// 更新最后登录时间
export const updateLastLoginTime = async userId => {
  const loginTime = moment().format('YYYY-MM-DD HH:mm:ss');
  return await update('users', { last_login_at: loginTime }, { id: userId });
};

// 创建用户会话
export const createSession = async sessionData => {
  const {
    user_id,
    session_token,
    refresh_token,
    device_info,
    ip_address,
    user_agent,
    expires_at,
  } = sessionData;

  const sessionRecord = {
    user_id,
    session_token,
    refresh_token,
    device_info: JSON.stringify(device_info),
    ip_address,
    user_agent,
    expires_at,
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    is_active: true,
  };

  return await create('user_sessions', sessionRecord);
};

// 验证会话令牌
export const validateSession = async sessionToken => {
  const query = `
    SELECT us.*, u.id as user_id, u.email, u.username, u.is_active
    FROM user_sessions us
    JOIN users u ON us.user_id = u.id
    WHERE us.session_token = ? 
      AND us.is_active = true 
      AND us.expires_at > NOW()
      AND u.deleted_at IS NULL
      AND u.is_active = true
  `;

  const { rows } = await executeQuery(query, [sessionToken]);
  return rows[0] || null;
};

// 刷新会话令牌
export const refreshSession = async (
  refreshToken,
  newSessionToken,
  newRefreshToken,
  newExpiresAt
) => {
  const updateData = {
    session_token: newSessionToken,
    refresh_token: newRefreshToken,
    expires_at: newExpiresAt,
    updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  return await update('user_sessions', updateData, {
    refresh_token: refreshToken,
    is_active: true,
  });
};

// 注销单个会话
export const removeSession = async sessionToken => {
  return await update(
    'user_sessions',
    { is_active: false },
    { session_token: sessionToken }
  );
};

// 注销用户所有会话
export const removeAllUserSessions = async userId => {
  return await update(
    'user_sessions',
    { is_active: false },
    { user_id: userId }
  );
};

// 更新邮箱验证状态
export const updateEmailVerification = async (userId, isVerified = true) => {
  return await update(
    'users',
    {
      email_verified: isVerified,
      email_verified_at: isVerified
        ? moment().format('YYYY-MM-DD HH:mm:ss')
        : null,
    },
    { id: userId }
  );
};

// 更新密码
export const updatePassword = async (userId, passwordHash) => {
  return await update(
    'users',
    {
      password_hash: passwordHash,
      password_updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    { id: userId }
  );
};

// 创建密码重置令牌
export const createPasswordResetToken = async (
  userId,
  resetToken,
  expiresAt
) => {
  const tokenData = {
    user_id: userId,
    reset_token: resetToken,
    expires_at: expiresAt,
    is_used: false,
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  return await create('password_reset_tokens', tokenData);
};

// 验证密码重置令牌
export const validatePasswordResetToken = async resetToken => {
  const query = `
    SELECT prt.*, u.email, u.username
    FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.reset_token = ? 
      AND prt.is_used = false 
      AND prt.expires_at > NOW()
      AND u.deleted_at IS NULL
  `;

  const { rows } = await executeQuery(query, [resetToken]);
  return rows[0] || null;
};

// 标记重置令牌为已使用
export const markResetTokenAsUsed = async resetToken => {
  return await update(
    'password_reset_tokens',
    {
      is_used: true,
      used_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    { reset_token: resetToken }
  );
};

// 完整的用户注册流程（事务）
export const registerUserWithDefaults = async userData => {
  return await transaction(async connection => {
    // 1. 创建用户
    const userId = await createUser(userData);

    // 2. 计算并创建默认目标
    const defaultGoal = calculateDefaultGoal(
      userData.weight,
      userData.height,
      userData.activity_level,
      userData.gender
    );
    await createDefaultGoal(userId, defaultGoal);

    // 3. 创建默认提醒设置
    await createDefaultReminderSettings(userId);

    businessLogger.info('User registered successfully', {
      userId,
      email: userData.email,
    });

    return userId;
  });
};

// 获取用户统计摘要
export const getUserStatsSummary = async userId => {
  const query = `
    SELECT 
      COUNT(hr.id) as total_records,
      COALESCE(SUM(hr.amount), 0) as total_intake,
      COUNT(DISTINCT DATE(hr.recorded_at)) as active_days,
      AVG(hr.amount) as avg_intake_per_record
    FROM hydration_records hr
    WHERE hr.user_id = ? 
      AND hr.deleted_at IS NULL
      AND hr.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `;

  const { rows } = await executeQuery(query, [userId]);
  return rows[0] || {};
};
