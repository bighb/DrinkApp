import db from '../config/database.js';
import { businessLogger, errorLogger } from '../utils/logger.js';

/**
 * 基础模型类 - 封装通用数据库操作
 */

// 通用查询执行函数
export const executeQuery = async (query, params = []) => {
  try {
    const result = await db.query(query, params);
    return result;
  } catch (error) {
    errorLogger.database(error, query, params);
    throw error;
  }
};

// 查询单条记录
export const findOne = async (table, conditions = {}, fields = '*') => {
  const conditionKeys = Object.keys(conditions);
  const whereClause =
    conditionKeys.length > 0
      ? `WHERE ${conditionKeys.map(key => `${key} = ?`).join(' AND ')}`
      : '';

  const query = `SELECT ${fields} FROM ${table} ${whereClause} LIMIT 1`;
  const params = Object.values(conditions);

  const { rows } = await executeQuery(query, params);
  return rows[0] || null;
};

// 查询多条记录
export const findMany = async (table, conditions = {}, options = {}) => {
  const {
    fields = '*',
    orderBy = '',
    limit = '',
    offset = 0,
    joins = '',
  } = options;

  const conditionKeys = Object.keys(conditions);
  const whereClause =
    conditionKeys.length > 0
      ? `WHERE ${conditionKeys.map(key => `${key} = ?`).join(' AND ')}`
      : '';

  const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
  const limitClause = limit ? `LIMIT ${limit} OFFSET ${offset}` : '';

  const query =
    `SELECT ${fields} FROM ${table} ${joins} ${whereClause} ${orderClause} ${limitClause}`.trim();
  const params = Object.values(conditions);

  const { rows } = await executeQuery(query, params);
  return rows;
};

// 插入记录
export const create = async (table, data) => {
  const fields = Object.keys(data);
  const placeholders = fields.map(() => '?').join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
  const result = await executeQuery(query, values);

  return {
    insertId: result.insertId,
    affectedRows: result.affectedRows,
  };
};

// 更新记录
export const update = async (table, data, conditions) => {
  const updateFields = Object.keys(data);
  const conditionFields = Object.keys(conditions);

  const setClause = updateFields.map(field => `${field} = ?`).join(', ');
  const whereClause = conditionFields
    .map(field => `${field} = ?`)
    .join(' AND ');

  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  const params = [...Object.values(data), ...Object.values(conditions)];

  const result = await executeQuery(query, params);
  return result.affectedRows;
};

// 删除记录（物理删除）
export const remove = async (table, conditions) => {
  const conditionFields = Object.keys(conditions);
  const whereClause = conditionFields
    .map(field => `${field} = ?`)
    .join(' AND ');

  const query = `DELETE FROM ${table} WHERE ${whereClause}`;
  const params = Object.values(conditions);

  const result = await executeQuery(query, params);
  return result.affectedRows;
};

// 软删除记录
export const softDelete = async (table, conditions) => {
  const data = { deleted_at: new Date() };
  return await update(table, data, conditions);
};

// 统计记录数量
export const count = async (table, conditions = {}) => {
  const conditionKeys = Object.keys(conditions);
  const whereClause =
    conditionKeys.length > 0
      ? `WHERE ${conditionKeys.map(key => `${key} = ?`).join(' AND ')}`
      : '';

  const query = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
  const params = Object.values(conditions);

  const { rows } = await executeQuery(query, params);
  return rows[0].count;
};

// 批量插入
export const batchCreate = async (table, dataArray) => {
  if (!dataArray.length) return { affectedRows: 0 };

  const fields = Object.keys(dataArray[0]);
  const placeholders = fields.map(() => '?').join(', ');
  const valuesPlaceholder = dataArray.map(() => `(${placeholders})`).join(', ');

  const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${valuesPlaceholder}`;
  const params = dataArray.flatMap(item => Object.values(item));

  const result = await executeQuery(query, params);
  return result;
};

// 事务执行
export const transaction = async callback => {
  if (!db.mysql) {
    throw new Error('MySQL连接未初始化，请检查数据库连接状态');
  }

  const connection = await db.mysql.getConnection();

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
};

// 分页查询
export const paginate = async (table, conditions = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    orderBy = 'id DESC',
    fields = '*',
    joins = '',
  } = options;

  const offset = (page - 1) * limit;

  // 查询总数
  const totalCount = await count(table, conditions);

  // 查询数据
  const data = await findMany(table, conditions, {
    fields,
    orderBy,
    limit,
    offset,
    joins,
  });

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
  };
};
