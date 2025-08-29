-- 喝水记录APP数据库设计
-- 数据库: hydration_tracker
-- 编码: utf8mb4_unicode_ci

-- 创建数据库
CREATE DATABASE IF NOT EXISTS hydration_tracker
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hydration_tracker;

-- 1. 用户表
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 个人信息
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
    date_of_birth DATE,
    height DECIMAL(5,2) COMMENT '身高(cm)',
    weight DECIMAL(5,2) COMMENT '体重(kg)',
    activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active') DEFAULT 'moderately_active',
    
    -- 目标设置
    daily_water_goal INT DEFAULT 2000 COMMENT '每日饮水目标(ml)',
    wake_up_time TIME DEFAULT '07:00:00',
    sleep_time TIME DEFAULT '23:00:00',
    
    -- 时区和本地化
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    locale VARCHAR(10) DEFAULT 'zh_CN',
    
    -- 账户状态
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at DATETIME NULL,
    
    -- 第三方登录
    google_id VARCHAR(255) NULL,
    apple_id VARCHAR(255) NULL,
    wechat_openid VARCHAR(255) NULL,
    
    -- 隐私设置
    data_sharing_enabled BOOLEAN DEFAULT FALSE,
    analytics_enabled BOOLEAN DEFAULT TRUE,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    
    -- 索引
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at),
    INDEX idx_is_active (is_active),
    INDEX idx_google_id (google_id),
    INDEX idx_apple_id (apple_id),
    INDEX idx_wechat_openid (wechat_openid)
);

-- 2. 饮水记录表
CREATE TABLE hydration_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 记录信息
    amount INT NOT NULL COMMENT '饮水量(ml)',
    drink_type ENUM('water', 'tea', 'coffee', 'juice', 'sports_drink', 'soda', 'alcohol', 'other') DEFAULT 'water',
    drink_name VARCHAR(100) NULL COMMENT '具体饮品名称',
    
    -- 时间信息
    recorded_at DATETIME NOT NULL COMMENT '记录的饮水时间',
    
    -- 上下文信息
    location VARCHAR(100) NULL COMMENT '地点标签',
    activity_context ENUM('work', 'exercise', 'meal', 'wake_up', 'before_sleep', 'break', 'other') NULL,
    temperature ENUM('hot', 'warm', 'room', 'cold', 'iced') DEFAULT 'room',
    
    -- 记录元数据
    source ENUM('manual', 'quick_add', 'reminder_response', 'smart_cup', 'api_import') DEFAULT 'manual',
    device_id VARCHAR(100) NULL COMMENT '设备标识',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_user_recorded (user_id, recorded_at),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_drink_type (drink_type),
    INDEX idx_source (source),
    INDEX idx_recorded_at (recorded_at)
);

-- 3. 用户目标表
CREATE TABLE user_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 目标设置
    goal_type ENUM('daily_water', 'weekly_consistency', 'monthly_average', 'custom') DEFAULT 'daily_water',
    target_value INT NOT NULL COMMENT '目标值',
    target_unit VARCHAR(20) DEFAULT 'ml',
    
    -- 时间范围
    start_date DATE NOT NULL,
    end_date DATE NULL COMMENT 'NULL表示长期目标',
    
    -- 目标状态
    is_active BOOLEAN DEFAULT TRUE,
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_at DATETIME NULL,
    
    -- 进度跟踪
    current_streak INT DEFAULT 0 COMMENT '当前连续达成天数',
    best_streak INT DEFAULT 0 COMMENT '最佳连续达成天数',
    total_achieved_days INT DEFAULT 0,
    
    -- 自定义设置
    reminder_enabled BOOLEAN DEFAULT TRUE,
    celebration_enabled BOOLEAN DEFAULT TRUE,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_goal_type (goal_type),
    INDEX idx_start_date (start_date),
    INDEX idx_is_achieved (is_achieved)
);

-- 4. 提醒设置表
CREATE TABLE reminder_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 提醒策略
    strategy_type ENUM('fixed_interval', 'smart_adaptive', 'activity_based', 'custom') DEFAULT 'smart_adaptive',
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- 固定间隔设置
    fixed_interval_minutes INT DEFAULT 60 COMMENT '固定间隔分钟数',
    
    -- 时间范围设置
    start_time TIME DEFAULT '07:00:00',
    end_time TIME DEFAULT '22:00:00',
    
    -- 工作日/周末差异
    weekday_enabled BOOLEAN DEFAULT TRUE,
    weekend_enabled BOOLEAN DEFAULT TRUE,
    weekend_start_time TIME DEFAULT '09:00:00',
    weekend_end_time TIME DEFAULT '23:00:00',
    
    -- 智能设置
    consider_weather BOOLEAN DEFAULT FALSE,
    consider_activity BOOLEAN DEFAULT TRUE,
    consider_previous_intake BOOLEAN DEFAULT TRUE,
    
    -- 免打扰设置
    do_not_disturb_enabled BOOLEAN DEFAULT FALSE,
    dnd_start_time TIME NULL,
    dnd_end_time TIME NULL,
    
    -- 提醒方式
    notification_type SET('push', 'sound', 'vibration') DEFAULT 'push,sound',
    notification_sound VARCHAR(50) DEFAULT 'default',
    
    -- 自定义消息
    custom_messages JSON NULL COMMENT '自定义提醒消息列表',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    UNIQUE KEY uk_user_reminder (user_id),
    
    -- 索引
    INDEX idx_enabled (is_enabled),
    INDEX idx_strategy_type (strategy_type)
);

-- 5. 提醒历史表
CREATE TABLE reminder_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reminder_setting_id BIGINT NULL,
    
    -- 提醒信息
    scheduled_at DATETIME NOT NULL COMMENT '计划发送时间',
    sent_at DATETIME NULL COMMENT '实际发送时间',
    
    -- 提醒内容
    message TEXT NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    
    -- 响应情况
    status ENUM('scheduled', 'sent', 'delivered', 'opened', 'responded', 'ignored', 'failed') DEFAULT 'scheduled',
    response_type ENUM('drink_logged', 'snooze_5min', 'snooze_15min', 'dismiss', 'none') NULL,
    responded_at DATETIME NULL,
    
    -- 上下文信息
    context JSON NULL COMMENT '发送时的上下文信息',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_setting_id) REFERENCES reminder_settings(id) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_user_scheduled (user_id, scheduled_at),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_response_type (response_type)
);

-- 6. 用户统计表
CREATE TABLE user_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 统计日期
    stat_date DATE NOT NULL,
    stat_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    
    -- 饮水统计
    total_intake INT DEFAULT 0 COMMENT '总饮水量(ml)',
    goal_achievement_rate DECIMAL(5,2) DEFAULT 0 COMMENT '目标完成率(%)',
    record_count INT DEFAULT 0 COMMENT '记录次数',
    
    -- 饮品分布
    water_percentage DECIMAL(5,2) DEFAULT 0,
    tea_percentage DECIMAL(5,2) DEFAULT 0,
    coffee_percentage DECIMAL(5,2) DEFAULT 0,
    other_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- 时间分布
    morning_intake INT DEFAULT 0 COMMENT '上午饮水量(ml)',
    afternoon_intake INT DEFAULT 0 COMMENT '下午饮水量(ml)',
    evening_intake INT DEFAULT 0 COMMENT '晚上饮水量(ml)',
    
    -- 行为模式
    avg_interval_minutes DECIMAL(8,2) DEFAULT 0 COMMENT '平均饮水间隔',
    most_common_amount INT DEFAULT 0 COMMENT '最常见的饮水量',
    peak_hour TINYINT DEFAULT 0 COMMENT '饮水高峰时段',
    
    -- 提醒效果
    reminder_count INT DEFAULT 0 COMMENT '收到提醒次数',
    reminder_response_rate DECIMAL(5,2) DEFAULT 0 COMMENT '提醒响应率(%)',
    
    -- 健康指标
    consistency_score DECIMAL(5,2) DEFAULT 0 COMMENT '饮水规律性评分',
    health_score DECIMAL(5,2) DEFAULT 0 COMMENT '整体健康评分',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    UNIQUE KEY uk_user_stat_date_type (user_id, stat_date, stat_type),
    
    -- 索引
    INDEX idx_user_date (user_id, stat_date),
    INDEX idx_stat_type (stat_type),
    INDEX idx_created_at (created_at)
);

-- 7. 成就系统表
CREATE TABLE achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 成就基本信息
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500) NULL,
    category ENUM('consistency', 'volume', 'diversity', 'social', 'milestone', 'seasonal') NOT NULL,
    
    -- 成就规则
    criteria JSON NOT NULL COMMENT '成就达成条件',
    difficulty ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') DEFAULT 'bronze',
    points INT DEFAULT 10 COMMENT '成就积分',
    
    -- 显示设置
    is_hidden BOOLEAN DEFAULT FALSE COMMENT '是否为隐藏成就',
    unlock_message VARCHAR(200) NULL,
    
    -- 时间相关
    is_repeatable BOOLEAN DEFAULT FALSE,
    cooldown_days INT DEFAULT 0 COMMENT '重复获得冷却天数',
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_active (is_active)
);

-- 8. 用户成就表
CREATE TABLE user_achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    
    -- 获得信息
    earned_at DATETIME NOT NULL,
    progress_data JSON NULL COMMENT '成就进度数据',
    
    -- 展示设置
    is_displayed BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- 唯一约束 (如果成就不可重复)
    UNIQUE KEY uk_user_achievement (user_id, achievement_id, earned_at),
    
    -- 索引
    INDEX idx_user_earned (user_id, earned_at),
    INDEX idx_achievement_earned (achievement_id, earned_at),
    INDEX idx_is_displayed (is_displayed)
);

-- 9. 设备管理表
CREATE TABLE user_devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 设备信息
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type ENUM('mobile_app', 'smart_cup', 'fitness_tracker', 'smart_scale', 'other') NOT NULL,
    platform ENUM('ios', 'android', 'web', 'iot', 'other') NULL,
    
    -- 推送设置
    push_token VARCHAR(500) NULL,
    push_enabled BOOLEAN DEFAULT TRUE,
    
    -- 设备状态
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME NULL,
    
    -- 设备配置
    settings JSON NULL COMMENT '设备特定配置',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_user_device (user_id, device_type),
    INDEX idx_device_id (device_id),
    INDEX idx_push_token (push_token),
    INDEX idx_is_active (is_active)
);

-- 10. 用户会话表
CREATE TABLE user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_id BIGINT NULL,
    
    -- 会话信息
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NULL,
    
    -- 会话状态
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME NOT NULL,
    
    -- 登录信息
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    location_info JSON NULL,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_session_token (session_token),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_expires_at (expires_at)
);

-- 11. 系统配置表
CREATE TABLE system_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 配置键值
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    
    -- 配置描述
    description TEXT NULL,
    category VARCHAR(50) DEFAULT 'general',
    
    -- 配置状态
    is_active BOOLEAN DEFAULT TRUE,
    is_sensitive BOOLEAN DEFAULT FALSE,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_config_key (config_key),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

-- 12. 应用日志表
CREATE TABLE app_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 日志基本信息
    level ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL,
    message TEXT NOT NULL,
    
    -- 上下文信息
    user_id BIGINT NULL,
    session_id VARCHAR(255) NULL,
    request_id VARCHAR(100) NULL,
    
    -- 错误信息
    error_code VARCHAR(50) NULL,
    stack_trace TEXT NULL,
    
    -- 请求信息
    api_endpoint VARCHAR(200) NULL,
    http_method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NULL,
    ip_address VARCHAR(45) NULL,
    
    -- 附加数据
    metadata JSON NULL,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_level_created (level, created_at),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_error_code (error_code),
    INDEX idx_api_endpoint (api_endpoint),
    INDEX idx_created_at (created_at)
);

-- 插入基础系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description, category) VALUES
('daily_water_default', '2000', 'number', '默认每日饮水目标(ml)', 'user_defaults'),
('reminder_default_interval', '60', 'number', '默认提醒间隔(分钟)', 'reminder'),
('max_daily_records', '50', 'number', '每日最大记录数限制', 'limits'),
('session_expire_hours', '24', 'number', '会话过期时间(小时)', 'security'),
('refresh_token_expire_days', '30', 'number', '刷新令牌过期时间(天)', 'security'),
('password_min_length', '8', 'number', '密码最小长度', 'security'),
('max_file_size_mb', '5', 'number', '最大文件上传大小(MB)', 'file_upload'),
('rate_limit_per_minute', '100', 'number', 'API调用频率限制(每分钟)', 'api'),
('maintenance_mode', 'false', 'boolean', '维护模式开关', 'system'),
('registration_enabled', 'true', 'boolean', '是否允许新用户注册', 'system');

-- 插入基础成就
INSERT INTO achievements (name, description, category, criteria, difficulty, points, unlock_message) VALUES
('第一滴水', '记录你的第一次饮水', 'milestone', '{"total_records": 1}', 'bronze', 10, '恭喜你开始了健康的饮水之旅！'),
('坚持7天', '连续7天达成饮水目标', 'consistency', '{"consecutive_days": 7}', 'silver', 50, '一周的坚持，习惯正在养成！'),
('饮水达人', '单日饮水超过3升', 'volume', '{"daily_amount": 3000}', 'gold', 30, '今天你真是个饮水小能手！'),
('多样品味', '一天内记录5种不同饮品', 'diversity', '{"drink_types_per_day": 5}', 'silver', 25, '丰富的口感，健康的选择！'),
('月度冠军', '一个月内30天都达成目标', 'consistency', '{"monthly_achievement": 30}', 'gold', 100, '一个月的坚持，你是真正的冠军！');