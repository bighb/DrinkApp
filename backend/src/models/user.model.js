import {
  executeQuery,
  findOne,
  findMany,
  create,
  update,
  softDelete,
  count,
} from './base.model.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import moment from 'moment-timezone';

/**
 * 用户相关数据模型
 */

// 获取用户完整资料
export const getUserProfile = async userId => {
  const query = `
    SELECT 
      u.id, u.email, u.username, u.full_name, u.gender,
      u.date_of_birth, u.height, u.weight, u.activity_level,
      u.avatar_url, u.timezone, u.locale, u.email_verified,
      u.is_active, u.created_at, u.updated_at,
      hg.daily_goal,
      rs.is_enabled as reminders_enabled,
      us.streak_days, us.total_intake, us.goal_achievement_rate
    FROM users u
    LEFT JOIN hydration_goals hg ON u.id = hg.user_id AND hg.is_active = true
    LEFT JOIN reminder_settings rs ON u.id = rs.user_id
    LEFT JOIN user_statistics us ON u.id = us.user_id
    WHERE u.id = ? AND u.deleted_at IS NULL
  `;

  const { rows } = await executeQuery(query, [userId]);
  return rows[0] || null;
};

// 更新用户基本信息
export const updateUserProfile = async (userId, updateData) => {
  const allowedFields = [
    'full_name',
    'gender',
    'date_of_birth',
    'height',
    'weight',
    'activity_level',
    'timezone',
    'locale',
    'avatar_url',
  ];

  // 过滤允许更新的字段
  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    return 0;
  }

  filteredData.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

  return await update('users', filteredData, { id: userId });
};

// 获取用户统计信息
export const getUserStatistics = async (
  userId,
  period = '7d',
  timezone = 'UTC'
) => {
  let dateCondition = '';
  let groupBy = '';

  switch (period) {
    case '7d':
      dateCondition =
        'DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      groupBy = 'DATE(hr.recorded_at)';
      break;
    case '30d':
      dateCondition =
        'DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      groupBy = 'DATE(hr.recorded_at)';
      break;
    case '3m':
      dateCondition =
        'DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
      groupBy = 'YEAR(hr.recorded_at), MONTH(hr.recorded_at)';
      break;
    default:
      dateCondition =
        'DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      groupBy = 'DATE(hr.recorded_at)';
  }

  const query = `
    SELECT 
      ${groupBy} as period,
      SUM(hr.amount) as total_intake,
      COUNT(hr.id) as record_count,
      AVG(hr.amount) as avg_intake,
      MIN(hr.recorded_at) as first_record,
      MAX(hr.recorded_at) as last_record,
      hg.daily_goal
    FROM hydration_records hr
    LEFT JOIN hydration_goals hg ON hr.user_id = hg.user_id AND hg.is_active = true
    WHERE hr.user_id = ? 
      AND ${dateCondition}
      AND hr.deleted_at IS NULL
    GROUP BY ${groupBy}, hg.daily_goal
    ORDER BY period ASC
  `;

  const { rows } = await executeQuery(query, [userId]);
  return rows;
};

// 获取今日统计
export const getTodayStatistics = async (userId, timezone = 'UTC') => {
  const query = `
    SELECT 
      COALESCE(SUM(hr.amount), 0) as today_intake,
      COUNT(hr.id) as today_records,
      hg.daily_goal,
      ROUND((COALESCE(SUM(hr.amount), 0) / hg.daily_goal) * 100, 1) as progress_percentage
    FROM users u
    LEFT JOIN hydration_records hr ON u.id = hr.user_id 
      AND DATE(hr.recorded_at) = CURDATE()
      AND hr.deleted_at IS NULL
    LEFT JOIN hydration_goals hg ON u.id = hg.user_id AND hg.is_active = true
    WHERE u.id = ? AND u.deleted_at IS NULL
  `;

  const { rows } = await executeQuery(query, [userId]);
  return rows[0] || {};
};

// 更新用户饮水目标
export const updateUserGoal = async (userId, goalValue, goalType = 'daily') => {
  // 先停用旧目标
  await update(
    'hydration_goals',
    { is_active: false },
    { user_id: userId, is_active: true }
  );

  // 创建新目标
  const goalData = {
    user_id: userId,
    daily_goal: goalValue,
    goal_type: goalType,
    is_active: true,
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  return await create('hydration_goals', goalData);
};

// 修改密码
export const changeUserPassword = async (userId, newPasswordHash) => {
  const updateData = {
    password_hash: newPasswordHash,
    password_updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  return await update('users', updateData, { id: userId });
};

// 更新头像
export const updateUserAvatar = async (userId, avatarUrl) => {
  return await update(
    'users',
    {
      avatar_url: avatarUrl,
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    { id: userId }
  );
};

// 删除头像
export const removeUserAvatar = async userId => {
  return await update(
    'users',
    {
      avatar_url: null,
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    { id: userId }
  );
};

// 获取目标达成率统计
export const getGoalAchievementStats = async (userId, days = 30) => {
  const query = `
    SELECT 
      DATE(hr.recorded_at) as date,
      SUM(hr.amount) as daily_intake,
      hg.daily_goal,
      CASE 
        WHEN SUM(hr.amount) >= hg.daily_goal THEN 1 
        ELSE 0 
      END as goal_achieved
    FROM hydration_records hr
    LEFT JOIN hydration_goals hg ON hr.user_id = hg.user_id AND hg.is_active = true
    WHERE hr.user_id = ? 
      AND hr.recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND hr.deleted_at IS NULL
    GROUP BY DATE(hr.recorded_at), hg.daily_goal
    ORDER BY date DESC
  `;

  const { rows } = await executeQuery(query, [userId, days]);

  const totalDays = rows.length;
  const achievedDays = rows.filter(row => row.goal_achieved === 1).length;
  const achievementRate = totalDays > 0 ? (achievedDays / totalDays) * 100 : 0;

  return {
    total_days: totalDays,
    achieved_days: achievedDays,
    achievement_rate: Math.round(achievementRate * 10) / 10,
    daily_stats: rows,
  };
};

// 获取用户活跃度统计
export const getUserActivityStats = async (userId, period = '30d') => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const query = `
    SELECT 
      DATE(hr.recorded_at) as date,
      COUNT(hr.id) as record_count,
      SUM(hr.amount) as total_intake,
      COUNT(DISTINCT HOUR(hr.recorded_at)) as active_hours
    FROM hydration_records hr
    WHERE hr.user_id = ? 
      AND hr.recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND hr.deleted_at IS NULL
    GROUP BY DATE(hr.recorded_at)
    ORDER BY date ASC
  `;

  const { rows } = await executeQuery(query, [userId, days]);

  return {
    period,
    total_days_with_records: rows.length,
    daily_activity: rows,
    avg_records_per_day:
      rows.length > 0
        ? Math.round(
            (rows.reduce((sum, day) => sum + day.record_count, 0) /
              rows.length) *
              10
          ) / 10
        : 0,
  };
};

// 获取用户偏好统计（饮品类型、时间段等）
export const getUserPreferences = async userId => {
  // 饮品类型偏好
  const drinkTypesQuery = `
    SELECT 
      drink_type,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      ROUND(AVG(amount), 0) as avg_amount
    FROM hydration_records
    WHERE user_id = ? 
      AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND deleted_at IS NULL
    GROUP BY drink_type
    ORDER BY count DESC
  `;

  const { rows: drinkTypes } = await executeQuery(drinkTypesQuery, [userId]);

  // 时间段偏好
  const timePatternQuery = `
    SELECT 
      HOUR(recorded_at) as hour,
      COUNT(*) as count,
      AVG(amount) as avg_amount
    FROM hydration_records
    WHERE user_id = ? 
      AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND deleted_at IS NULL
    GROUP BY HOUR(recorded_at)
    ORDER BY hour ASC
  `;

  const { rows: timePattern } = await executeQuery(timePatternQuery, [userId]);

  return {
    drink_types: drinkTypes,
    time_pattern: timePattern,
  };
};

// 软删除用户账户
export const deleteUserAccount = async userId => {
  // 同时软删除相关数据
  const tables = [
    'hydration_records',
    'reminder_settings',
    'hydration_goals',
    'user_statistics',
  ];

  // 更新用户状态
  await update(
    'users',
    {
      is_active: false,
      deleted_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    { id: userId }
  );

  // 软删除相关数据
  for (const table of tables) {
    await softDelete(table, { user_id: userId });
  }

  // 注销所有会话
  await update('user_sessions', { is_active: false }, { user_id: userId });

  businessLogger.info('User account deleted', { userId });
  return true;
};

// 获取用户数据导出
export const exportUserData = async userId => {
  const profile = await getUserProfile(userId);
  const statistics = await getUserStatistics(userId, '30d');
  const preferences = await getUserPreferences(userId);

  // 获取最近的饮水记录
  const recordsQuery = `
    SELECT id, amount, drink_type, drink_name, recorded_at, location
    FROM hydration_records
    WHERE user_id = ? 
      AND deleted_at IS NULL
      AND recorded_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    ORDER BY recorded_at DESC
  `;

  const { rows: records } = await executeQuery(recordsQuery, [userId]);

  return {
    profile,
    statistics,
    preferences,
    recent_records: records,
    export_date: moment().format('YYYY-MM-DD HH:mm:ss'),
  };
};
