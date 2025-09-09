import { 
  executeQuery, 
  findOne, 
  findMany, 
  create, 
  update, 
  softDelete,
  count,
  batchCreate,
  paginate,
  transaction
} from './base.model.js';
import { businessLogger, errorLogger } from '../utils/logger.js';
import moment from 'moment-timezone';

/**
 * 饮水记录相关数据模型
 */

// 添加饮水记录
export const createHydrationRecord = async (userId, recordData) => {
  const {
    amount,
    drink_type = 'water',
    drink_name,
    recorded_at,
    location,
    activity_context,
    temperature = 'room',
    source = 'manual',
    device_id,
  } = recordData;

  const insertData = {
    user_id: userId,
    amount,
    drink_type,
    drink_name,
    recorded_at: recorded_at || moment().format('YYYY-MM-DD HH:mm:ss'),
    location,
    activity_context,
    temperature,
    source,
    device_id,
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  const result = await create('hydration_records', insertData);
  
  businessLogger.info('Hydration record created', { 
    userId, 
    recordId: result.insertId,
    amount,
    drink_type 
  });
  
  return result.insertId;
};

// 获取用户饮水记录
export const getUserHydrationRecords = async (userId, filters = {}, pagination = {}) => {
  const {
    startDate,
    endDate,
    drinkType,
    source,
    minAmount,
    maxAmount,
  } = filters;
  
  const {
    page = 1,
    limit = 20,
    orderBy = 'recorded_at DESC',
  } = pagination;

  let conditions = { user_id: userId };
  let whereConditions = ['hr.user_id = ?', 'hr.deleted_at IS NULL'];
  let params = [userId];

  // 构建查询条件
  if (startDate) {
    whereConditions.push('DATE(hr.recorded_at) >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    whereConditions.push('DATE(hr.recorded_at) <= ?');
    params.push(endDate);
  }
  
  if (drinkType) {
    whereConditions.push('hr.drink_type = ?');
    params.push(drinkType);
  }
  
  if (source) {
    whereConditions.push('hr.source = ?');
    params.push(source);
  }
  
  if (minAmount) {
    whereConditions.push('hr.amount >= ?');
    params.push(minAmount);
  }
  
  if (maxAmount) {
    whereConditions.push('hr.amount <= ?');
    params.push(maxAmount);
  }

  const whereClause = whereConditions.join(' AND ');
  const offset = (page - 1) * limit;
  
  // 查询记录
  const dataQuery = `
    SELECT 
      hr.id, hr.amount, hr.drink_type, hr.drink_name,
      hr.recorded_at, hr.location, hr.activity_context,
      hr.temperature, hr.source, hr.created_at
    FROM hydration_records hr
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
  const { rows: data } = await executeQuery(dataQuery, [...params, limit, offset]);
  
  // 查询总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM hydration_records hr
    WHERE ${whereClause}
  `;
  
  const { rows: countResult } = await executeQuery(countQuery, params);
  const total = countResult[0].total;
  
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// 获取单条饮水记录
export const getHydrationRecordById = async (recordId, userId) => {
  const query = `
    SELECT hr.*, u.timezone
    FROM hydration_records hr
    JOIN users u ON hr.user_id = u.id
    WHERE hr.id = ? AND hr.user_id = ? AND hr.deleted_at IS NULL
  `;
  
  const { rows } = await executeQuery(query, [recordId, userId]);
  return rows[0] || null;
};

// 更新饮水记录
export const updateHydrationRecord = async (recordId, userId, updateData) => {
  const allowedFields = [
    'amount', 'drink_type', 'drink_name', 'recorded_at',
    'location', 'activity_context', 'temperature'
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
  
  const affectedRows = await update('hydration_records', filteredData, { 
    id: recordId, 
    user_id: userId 
  });
  
  if (affectedRows > 0) {
    businessLogger.info('Hydration record updated', { recordId, userId, updateData });
  }
  
  return affectedRows;
};

// 删除饮水记录（软删除）
export const deleteHydrationRecord = async (recordId, userId) => {
  const affectedRows = await softDelete('hydration_records', { 
    id: recordId, 
    user_id: userId 
  });
  
  if (affectedRows > 0) {
    businessLogger.info('Hydration record deleted', { recordId, userId });
  }
  
  return affectedRows;
};

// 批量添加饮水记录
export const createBatchHydrationRecords = async (userId, records) => {
  const recordsWithUserId = records.map(record => ({
    user_id: userId,
    amount: record.amount,
    drink_type: record.drink_type || 'water',
    drink_name: record.drink_name,
    recorded_at: record.recorded_at || moment().format('YYYY-MM-DD HH:mm:ss'),
    location: record.location,
    activity_context: record.activity_context,
    temperature: record.temperature || 'room',
    source: record.source || 'batch_import',
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  }));

  const result = await batchCreate('hydration_records', recordsWithUserId);
  
  businessLogger.info('Batch hydration records created', { 
    userId, 
    recordCount: records.length 
  });
  
  return result;
};

// 获取今日饮水进度
export const getTodayHydrationProgress = async (userId, timezone = 'UTC') => {
  const query = `
    SELECT 
      COALESCE(SUM(hr.amount), 0) as today_intake,
      COUNT(hr.id) as today_records,
      hg.daily_goal,
      ROUND((COALESCE(SUM(hr.amount), 0) / hg.daily_goal) * 100, 1) as progress_percentage,
      CASE 
        WHEN COALESCE(SUM(hr.amount), 0) >= hg.daily_goal THEN true 
        ELSE false 
      END as goal_achieved
    FROM users u
    LEFT JOIN hydration_records hr ON u.id = hr.user_id 
      AND DATE(hr.recorded_at) = CURDATE()
      AND hr.deleted_at IS NULL
    LEFT JOIN hydration_goals hg ON u.id = hg.user_id AND hg.is_active = true
    WHERE u.id = ? AND u.deleted_at IS NULL
  `;
  
  const { rows } = await executeQuery(query, [userId]);
  const progress = rows[0] || {};
  
  // 获取今日记录详情
  const recordsQuery = `
    SELECT amount, drink_type, recorded_at
    FROM hydration_records
    WHERE user_id = ? 
      AND DATE(recorded_at) = CURDATE()
      AND deleted_at IS NULL
    ORDER BY recorded_at ASC
  `;
  
  const { rows: todayRecords } = await executeQuery(recordsQuery, [userId]);
  
  return {
    ...progress,
    today_records_detail: todayRecords,
  };
};

// 获取饮水统计信息
export const getHydrationStatistics = async (userId, period = '7d', timezone = 'UTC') => {
  let dateCondition = '';
  let groupBy = '';
  let days = 7;
  
  switch (period) {
    case '7d':
      days = 7;
      dateCondition = "DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      groupBy = "DATE(hr.recorded_at)";
      break;
    case '30d':
      days = 30;
      dateCondition = "DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
      groupBy = "DATE(hr.recorded_at)";
      break;
    case '3m':
      days = 90;
      dateCondition = "DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
      groupBy = "YEAR(hr.recorded_at), WEEK(hr.recorded_at)";
      break;
    default:
      days = 7;
      dateCondition = "DATE(hr.recorded_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      groupBy = "DATE(hr.recorded_at)";
  }

  const query = `
    SELECT 
      ${groupBy} as period,
      SUM(hr.amount) as total_intake,
      COUNT(hr.id) as record_count,
      AVG(hr.amount) as avg_per_record,
      hg.daily_goal,
      CASE 
        WHEN SUM(hr.amount) >= hg.daily_goal THEN 1 
        ELSE 0 
      END as goal_achieved
    FROM hydration_records hr
    LEFT JOIN hydration_goals hg ON hr.user_id = hg.user_id AND hg.is_active = true
    WHERE hr.user_id = ? 
      AND ${dateCondition}
      AND hr.deleted_at IS NULL
    GROUP BY ${groupBy}, hg.daily_goal
    ORDER BY period ASC
  `;
  
  const { rows: dailyStats } = await executeQuery(query, [userId]);
  
  // 计算汇总统计
  const totalIntake = dailyStats.reduce((sum, day) => sum + (day.total_intake || 0), 0);
  const totalRecords = dailyStats.reduce((sum, day) => sum + day.record_count, 0);
  const achievedDays = dailyStats.filter(day => day.goal_achieved === 1).length;
  const avgDailyIntake = dailyStats.length > 0 ? totalIntake / days : 0;
  const achievementRate = dailyStats.length > 0 ? (achievedDays / dailyStats.length) * 100 : 0;
  
  return {
    period,
    summary: {
      total_intake: totalIntake,
      total_records: totalRecords,
      achieved_days: achievedDays,
      total_days: dailyStats.length,
      avg_daily_intake: Math.round(avgDailyIntake),
      achievement_rate: Math.round(achievementRate * 10) / 10,
    },
    daily_stats: dailyStats,
  };
};

// 检查每日记录数量限制
export const checkDailyRecordLimit = async (userId, maxRecords = 50) => {
  const query = `
    SELECT COUNT(*) as count
    FROM hydration_records
    WHERE user_id = ? AND DATE(recorded_at) = CURDATE() AND deleted_at IS NULL
  `;
  
  const { rows } = await executeQuery(query, [userId]);
  const currentCount = rows[0].count;
  
  return {
    current_count: currentCount,
    limit: maxRecords,
    can_add: currentCount < maxRecords,
    remaining: Math.max(0, maxRecords - currentCount),
  };
};

// 获取饮品类型统计
export const getDrinkTypeStatistics = async (userId, days = 30) => {
  const query = `
    SELECT 
      drink_type,
      COUNT(*) as record_count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount,
      ROUND((COUNT(*) * 100.0 / (
        SELECT COUNT(*)
        FROM hydration_records
        WHERE user_id = ? 
          AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          AND deleted_at IS NULL
      )), 1) as percentage
    FROM hydration_records
    WHERE user_id = ? 
      AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND deleted_at IS NULL
    GROUP BY drink_type
    ORDER BY total_amount DESC
  `;
  
  const { rows } = await executeQuery(query, [userId, days, userId, days]);
  return rows;
};

// 获取时间段分析
export const getHourlyPattern = async (userId, days = 30) => {
  const query = `
    SELECT 
      HOUR(recorded_at) as hour,
      COUNT(*) as record_count,
      AVG(amount) as avg_amount,
      SUM(amount) as total_amount
    FROM hydration_records
    WHERE user_id = ? 
      AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND deleted_at IS NULL
    GROUP BY HOUR(recorded_at)
    ORDER BY hour ASC
  `;
  
  const { rows } = await executeQuery(query, [userId, days]);
  
  // 填充没有记录的小时
  const completePattern = [];
  for (let hour = 0; hour < 24; hour++) {
    const existingData = rows.find(row => row.hour === hour);
    completePattern.push({
      hour,
      record_count: existingData ? existingData.record_count : 0,
      avg_amount: existingData ? Math.round(existingData.avg_amount) : 0,
      total_amount: existingData ? existingData.total_amount : 0,
    });
  }
  
  return completePattern;
};

// 更新用户统计数据（通常在添加记录后调用）
export const updateUserStatistics = async (userId, date = null) => {
  const targetDate = date || moment().format('YYYY-MM-DD');
  
  return await transaction(async () => {
    // 计算当日统计
    const dailyQuery = `
      SELECT 
        SUM(amount) as daily_intake,
        COUNT(*) as daily_records
      FROM hydration_records
      WHERE user_id = ? 
        AND DATE(recorded_at) = ?
        AND deleted_at IS NULL
    `;
    
    const { rows: dailyResult } = await executeQuery(dailyQuery, [userId, targetDate]);
    const dailyIntake = dailyResult[0].daily_intake || 0;
    
    // 计算连续天数
    const streakQuery = `
      SELECT COUNT(*) as streak_days
      FROM (
        SELECT DATE(recorded_at) as record_date
        FROM hydration_records hr
        LEFT JOIN hydration_goals hg ON hr.user_id = hg.user_id AND hg.is_active = true
        WHERE hr.user_id = ? 
          AND hr.deleted_at IS NULL
          AND DATE(recorded_at) <= ?
        GROUP BY DATE(recorded_at)
        HAVING SUM(hr.amount) >= hg.daily_goal
        ORDER BY record_date DESC
      ) as achieved_days
    `;
    
    const { rows: streakResult } = await executeQuery(streakQuery, [userId, targetDate]);
    const streakDays = streakResult[0].streak_days || 0;
    
    // 更新或插入统计记录
    const existingStats = await findOne('user_statistics', { user_id: userId });
    
    const statsData = {
      user_id: userId,
      streak_days: streakDays,
      last_updated: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    
    if (existingStats) {
      await update('user_statistics', statsData, { user_id: userId });
    } else {
      await create('user_statistics', statsData);
    }
    
    businessLogger.info('User statistics updated', { 
      userId, 
      date: targetDate, 
      dailyIntake, 
      streakDays 
    });
    
    return { dailyIntake, streakDays };
  });
};