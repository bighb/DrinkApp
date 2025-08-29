import dotenv from 'dotenv';
dotenv.config();

const config = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },

  // 数据库配置
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hydration_tracker',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    timeout: parseInt(process.env.DB_TIMEOUT, 10) || 60000,
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    prefix: process.env.REDIS_PREFIX || 'hydration:',
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  },

  // 密码加密配置
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },

  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5242880, // 5MB
    path: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif').split(','),
  },

  // 云存储配置
  storage: {
    provider: process.env.CLOUD_PROVIDER || 'local', // local, aws, gcp
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION,
    },
    gcp: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
      bucket: process.env.GOOGLE_CLOUD_BUCKET,
    },
  },

  // 邮件配置
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@hydrationtracker.com',
  },

  // 推送通知配置
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },

  // 第三方登录配置
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    wechat: {
      appId: process.env.WECHAT_APP_ID,
      appSecret: process.env.WECHAT_APP_SECRET,
    },
  },

  // API限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    errorFile: process.env.LOG_ERROR_FILE || './logs/error.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5',
  },

  // 缓存配置
  cache: {
    defaultTTL: parseInt(process.env.CACHE_TTL, 10) || 3600, // 1小时
    statisticsTTL: parseInt(process.env.CACHE_STATISTICS_TTL, 10) || 1800, // 30分钟
    userSessionTTL: parseInt(process.env.CACHE_USER_SESSION_TTL, 10) || 86400, // 24小时
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // 安全配置
  security: {
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
  },

  // 定时任务配置
  cron: {
    statisticsUpdate: process.env.CRON_STATISTICS_UPDATE || '0 1 * * *',
    reminderCleanup: process.env.CRON_REMINDER_CLEANUP || '0 2 * * *',
    sessionCleanup: process.env.CRON_SESSION_CLEANUP || '0 3 * * *',
  },

  // 业务配置
  business: {
    defaultDailyGoal: parseInt(process.env.DEFAULT_DAILY_GOAL, 10) || 2000,
    maxDailyRecords: parseInt(process.env.MAX_DAILY_RECORDS, 10) || 50,
    minRecordAmount: parseInt(process.env.MIN_RECORD_AMOUNT, 10) || 50,
    maxRecordAmount: parseInt(process.env.MAX_RECORD_AMOUNT, 10) || 2000,
    reminderMinInterval: parseInt(process.env.REMINDER_MIN_INTERVAL, 10) || 15,
    reminderMaxInterval: parseInt(process.env.REMINDER_MAX_INTERVAL, 10) || 240,
  },

  // 维护模式
  maintenance: {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    message: process.env.MAINTENANCE_MESSAGE || '系统维护中，请稍后再试',
  },

  // 监控配置
  monitoring: {
    healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health',
    metricsPath: process.env.METRICS_PATH || '/metrics',
    analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false',
    errorReportingEnabled: process.env.ERROR_REPORTING_ENABLED !== 'false',
    performanceMonitoring: process.env.PERFORMANCE_MONITORING !== 'false',
  },
};

// 配置验证
const validateConfig = () => {
  const requiredFields = [
    'jwt.secret',
    'jwt.refreshSecret',
    'db.host',
    'db.user',
    'db.database',
  ];

  const missing = requiredFields.filter(field => {
    const keys = field.split('.');
    let value = config;
    for (const key of keys) {
      value = value[key];
      if (value === undefined || value === null || value === '') {
        return true;
      }
    }
    return false;
  });

  if (missing.length > 0) {
    throw new Error(`缺少必要的配置项: ${missing.join(', ')}`);
  }
};

// 开发环境下验证配置
if (config.server.env === 'development') {
  try {
    validateConfig();
  } catch (error) {
    console.error('配置验证失败:', error.message);
    process.exit(1);
  }
}

export default config;