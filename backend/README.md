# 喝水记录APP后端API

智能饮水管理应用的后端服务系统，基于Node.js和Express框架构建。

## 📋 目录

- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [API文档](#api文档)
- [部署指南](#部署指南)
- [开发指南](#开发指南)
- [监控和维护](#监控和维护)

## 🚀 功能特性

### 核心功能模块

- **用户管理系统**
  - 用户注册、登录、认证
  - 个人资料管理
  - 多设备会话管理
  - 第三方登录支持

- **饮水记录系统**
  - 快速记录饮水量
  - 多种饮品类型支持
  - 历史记录查询
  - 批量数据导入

- **智能提醒系统**
  - 个性化提醒策略
  - 多平台推送通知
  - 提醒效果分析
  - 智能时间调度

- **健康数据分析**
  - 多维度统计分析
  - 饮水趋势预测
  - 健康建议生成
  - 可视化数据展示

- **目标管理系统**
  - 个性化目标设定
  - 进度跟踪和激励
  - 成就系统
  - 连续达标统计

### 技术特性

- **高性能**
  - Redis缓存加速
  - 数据库查询优化
  - API响应时间 < 200ms

- **高可靠性**
  - 数据库主从备份
  - 服务健康检查
  - 自动故障恢复

- **高安全性**
  - JWT认证授权
  - 数据传输加密
  - API访问限流
  - 安全审计日志

- **易扩展性**
  - 微服务架构设计
  - Docker容器化部署
  - 水平扩展支持

## 🛠 技术架构

### 后端技术栈

```
应用层: Express.js + Node.js
数据层: MySQL + Redis
推送服务: Firebase Cloud Messaging
邮件服务: Nodemailer + SMTP
认证: JWT + OAuth 2.0
缓存: Redis
日志: Winston
测试: Jest + Supertest
部署: Docker + Docker Compose
```

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │    Web App      │    │  Admin Panel    │
│  (React Native)  │    │   (React.js)    │    │   (Vue.js)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Express.js)  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Service   │    │Hydration Service│    │Reminder Service │
│  (认证/用户管理)   │    │   (记录管理)      │    │   (智能提醒)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │  MySQL + Redis  │
                    └─────────────────┘
```

### 数据库设计

核心数据表:
- `users` - 用户信息
- `hydration_records` - 饮水记录
- `user_goals` - 用户目标
- `reminder_settings` - 提醒设置
- `reminder_logs` - 提醒历史
- `user_statistics` - 统计数据
- `achievements` - 成就系统
- `user_sessions` - 会话管理

## 🏃‍♂️ 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- Docker (可选)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd DrinkApp/backend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和其他服务
```

4. **初始化数据库**
```bash
# 创建数据库
mysql -u root -p < database/schema.sql

# 运行迁移脚本（如果有）
npm run db:migrate
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **验证服务**
```bash
curl http://localhost:3000/health
```

### Docker部署

1. **使用Docker Compose启动所有服务**
```bash
docker-compose up -d
```

2. **查看服务状态**
```bash
docker-compose ps
```

3. **查看日志**
```bash
docker-compose logs -f app
```

## 📚 API文档

### 基本信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

### 主要端点

#### 认证相关
```
POST   /auth/register          用户注册
POST   /auth/login             用户登录
POST   /auth/refresh           刷新token
POST   /auth/logout            用户登出
POST   /auth/forgot-password   发送重置邮件
POST   /auth/reset-password    重置密码
```

#### 用户管理
```
GET    /users/profile          获取用户资料
PUT    /users/profile          更新用户资料
POST   /users/avatar           上传头像
GET    /users/statistics       获取用户统计
POST   /users/change-password  修改密码
```

#### 饮水记录
```
POST   /hydration/records      添加记录
GET    /hydration/records      获取记录列表
GET    /hydration/records/:id  获取单个记录
PUT    /hydration/records/:id  更新记录
DELETE /hydration/records/:id  删除记录
POST   /hydration/records/batch 批量添加记录
GET    /hydration/today        获取今日进度
```

#### 智能提醒
```
GET    /reminders/settings     获取提醒设置
PUT    /reminders/settings     更新提醒设置
GET    /reminders/history      获取提醒历史
POST   /reminders/instant      发送即时提醒
POST   /reminders/:id/respond  响应提醒
```

### API文档访问

开发环境中可以访问Swagger文档:
```
http://localhost:3000/api-docs
```

### 响应格式

成功响应:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

错误响应:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误描述",
  "details": {
    // 详细信息
  }
}
```

## 🚀 部署指南

### 生产环境部署

#### 1. 准备工作

```bash
# 1. 创建部署目录
mkdir -p /opt/hydration-tracker
cd /opt/hydration-tracker

# 2. 克隆代码
git clone <repository-url> .

# 3. 安装依赖
npm ci --production
```

#### 2. 环境配置

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 编辑生产环境配置
vim .env
```

关键配置项:
```env
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password

# Redis配置
REDIS_HOST=your-redis-host

# JWT密钥（必须更改）
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# 邮件配置
SMTP_HOST=your-smtp-host
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password

# 推送服务配置
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

#### 3. 数据库初始化

```bash
# 1. 导入数据库结构
mysql -u root -p < database/schema.sql

# 2. 运行数据迁移
npm run db:migrate

# 3. 导入初始数据（如果有）
npm run db:seed
```

#### 4. 启动服务

使用PM2进程管理:
```bash
# 1. 安装PM2
npm install -g pm2

# 2. 启动应用
pm2 start src/server.js --name hydration-tracker-api

# 3. 保存PM2配置
pm2 save

# 4. 设置开机自启
pm2 startup
```

#### 5. Nginx反向代理

创建Nginx配置:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件服务
    location /uploads {
        alias /opt/hydration-tracker/uploads;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker生产部署

1. **构建生产镜像**
```bash
docker build -t hydration-tracker-api:latest .
```

2. **使用生产配置运行**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 云服务部署

#### AWS部署

1. **使用ECS部署**
```bash
# 创建ECR仓库
aws ecr create-repository --repository-name hydration-tracker-api

# 构建并推送镜像
docker build -t hydration-tracker-api:latest .
docker tag hydration-tracker-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/hydration-tracker-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/hydration-tracker-api:latest
```

2. **配置RDS和ElastiCache**
```bash
# 创建MySQL实例
aws rds create-db-instance \
  --db-instance-identifier hydration-tracker-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20

# 创建Redis集群
aws elasticache create-cache-cluster \
  --cache-cluster-id hydration-tracker-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

## 💻 开发指南

### 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js   # 数据库配置
│   │   └── index.js      # 主配置文件
│   ├── controllers/      # 控制器
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── hydrationController.js
│   │   └── reminderController.js
│   ├── middlewares/      # 中间件
│   │   ├── auth.js       # 认证中间件
│   │   ├── errorHandler.js
│   │   └── rateLimit.js
│   ├── routes/           # 路由定义
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── hydration.js
│   │   └── reminders.js
│   ├── utils/            # 工具类
│   │   ├── auth.js       # 认证工具
│   │   ├── email.js      # 邮件服务
│   │   ├── logger.js     # 日志工具
│   │   └── pushNotification.js
│   └── server.js         # 应用入口
├── database/
│   ├── schema.sql        # 数据库结构
│   └── migrations/       # 数据库迁移
├── tests/                # 测试文件
├── uploads/              # 文件上传目录
├── logs/                 # 日志文件
├── docker-compose.yml    # Docker编排
├── Dockerfile            # Docker镜像
├── package.json          # 项目配置
└── README.md            # 项目文档
```

### 编码规范

#### 代码风格
- 使用ESLint + Prettier进行代码格式化
- 遵循Airbnb JavaScript风格指南
- 使用2空格缩进
- 文件名使用camelCase

#### 命名约定
```javascript
// 变量和函数使用camelCase
const userName = 'john_doe';
function getUserProfile() {}

// 常量使用UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:3000';

// 类名使用PascalCase
class UserController {}

// 文件名使用camelCase
// userController.js, hydrationService.js
```

#### 注释规范
```javascript
/**
 * 获取用户饮水记录
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @param {string} options.startDate - 开始日期
 * @param {string} options.endDate - 结束日期
 * @returns {Promise<Array>} 饮水记录列表
 */
async function getHydrationRecords(userId, options = {}) {
  // 实现逻辑
}
```

### 开发工作流

#### 1. 功能开发流程
```bash
# 1. 创建功能分支
git checkout -b feature/user-statistics

# 2. 开发功能
# - 编写代码
# - 添加单元测试
# - 更新API文档

# 3. 运行测试
npm test

# 4. 代码检查
npm run lint

# 5. 提交代码
git add .
git commit -m "feat: add user statistics API"

# 6. 推送并创建PR
git push origin feature/user-statistics
```

#### 2. 测试策略
```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e

# 覆盖率测试
npm run test:coverage
```

#### 3. 数据库变更
```bash
# 1. 创建迁移文件
npm run migration:create add_user_preferences

# 2. 编写迁移代码
# database/migrations/20231201_add_user_preferences.js

# 3. 运行迁移
npm run migration:up

# 4. 回滚迁移（如果需要）
npm run migration:down
```

### API开发最佳实践

#### 1. 控制器结构
```javascript
class UserController {
  // 获取用户列表
  static async getUsers(req, res) {
    try {
      // 1. 验证输入参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: errors.array(),
        });
      }

      // 2. 业务逻辑处理
      const users = await UserService.getUsers(req.query);

      // 3. 返回结果
      res.json({
        success: true,
        data: users,
      });

    } catch (error) {
      // 4. 错误处理
      errorLogger.api(error, req);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '获取用户列表失败',
      });
    }
  }
}
```

#### 2. 输入验证
```javascript
const { body, query, param } = require('express-validator');

const createUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码至少8位，包含大小写字母和数字'),
];
```

#### 3. 错误处理
```javascript
// 全局错误处理中间件
const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = '服务器内部错误';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = '未授权访问';
  }

  // 记录错误日志
  errorLogger.api(error, req);

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
```

### 数据库操作最佳实践

#### 1. 查询优化
```javascript
// 使用索引
const query = `
  SELECT u.id, u.username, u.email
  FROM users u
  WHERE u.is_active = true
  AND u.created_at >= ?
  ORDER BY u.created_at DESC
  LIMIT ?
`;

// 避免N+1查询
const usersWithRecords = await db.query(`
  SELECT 
    u.id,
    u.username,
    COUNT(hr.id) as record_count
  FROM users u
  LEFT JOIN hydration_records hr ON u.id = hr.user_id
  WHERE u.id IN (${userIds.map(() => '?').join(',')})
  GROUP BY u.id
`, userIds);
```

#### 2. 事务处理
```javascript
// 使用事务确保数据一致性
async function transferPoints(fromUserId, toUserId, points) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 扣除积分
    await connection.execute(
      'UPDATE users SET points = points - ? WHERE id = ?',
      [points, fromUserId]
    );
    
    // 增加积分
    await connection.execute(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [points, toUserId]
    );
    
    // 记录转账
    await connection.execute(
      'INSERT INTO point_transfers (from_user, to_user, points, created_at) VALUES (?, ?, ?, NOW())',
      [fromUserId, toUserId, points]
    );
    
    await connection.commit();
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

#### 3. 缓存策略
```javascript
// 查询缓存
async function getUserProfile(userId) {
  const cacheKey = `user:profile:${userId}`;
  
  // 尝试从缓存获取
  let userProfile = await db.getCache(cacheKey);
  
  if (!userProfile) {
    // 缓存未命中，从数据库查询
    const query = 'SELECT * FROM users WHERE id = ?';
    const { rows } = await db.query(query, [userId]);
    
    if (rows.length > 0) {
      userProfile = rows[0];
      // 缓存30分钟
      await db.setCache(cacheKey, userProfile, 1800);
    }
  }
  
  return userProfile;
}

// 缓存失效
async function updateUserProfile(userId, profileData) {
  // 更新数据库
  await db.query('UPDATE users SET ? WHERE id = ?', [profileData, userId]);
  
  // 删除缓存
  await db.deleteCache(`user:profile:${userId}`);
}
```

## 📊 监控和维护

### 日志管理

#### 日志级别
- **DEBUG**: 详细的调试信息
- **INFO**: 一般信息消息
- **WARN**: 警告消息
- **ERROR**: 错误消息
- **FATAL**: 严重错误

#### 日志格式
```json
{
  "timestamp": "2023-12-01T10:30:00.000Z",
  "level": "INFO",
  "message": "用户登录成功",
  "requestId": "req_123456",
  "userId": 12345,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "responseTime": 150
}
```

#### 日志查看
```bash
# 查看实时日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 使用PM2查看日志
pm2 logs hydration-tracker-api

# 搜索特定用户的日志
grep "userId:12345" logs/app.log
```

### 性能监控

#### 关键指标
- **响应时间**: API平均响应时间 < 200ms
- **吞吐量**: 每秒请求数 > 100 req/s
- **错误率**: 错误率 < 1%
- **可用性**: 系统可用性 > 99.9%

#### 监控端点
```bash
# 健康检查
curl http://localhost:3000/health

# 详细健康检查
curl http://localhost:3000/health/detailed

# 系统指标
curl http://localhost:3000/metrics
```

#### 性能优化建议

1. **数据库优化**
```sql
-- 添加索引
CREATE INDEX idx_user_created ON users(created_at);
CREATE INDEX idx_record_user_date ON hydration_records(user_id, recorded_at);

-- 查询优化
EXPLAIN SELECT * FROM hydration_records WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 10;
```

2. **缓存优化**
```javascript
// 热点数据缓存
const cacheKeys = {
  userProfile: (userId) => `user:${userId}`,
  userStats: (userId) => `stats:${userId}`,
  dailyGoals: (userId) => `goals:${userId}`,
};

// 缓存预热
async function warmupCache() {
  const activeUsers = await getActiveUsers();
  
  for (const user of activeUsers) {
    await getUserProfile(user.id); // 触发缓存
    await getUserStats(user.id);   // 触发缓存
  }
}
```

3. **API优化**
```javascript
// 批量操作
app.post('/api/v1/hydration/records/batch', async (req, res) => {
  const records = req.body.records;
  
  // 批量插入而不是逐个插入
  const query = `
    INSERT INTO hydration_records (user_id, amount, recorded_at, created_at)
    VALUES ${records.map(() => '(?, ?, ?, NOW())').join(', ')}
  `;
  
  const params = records.flatMap(r => [r.userId, r.amount, r.recordedAt]);
  await db.query(query, params);
});

// 分页查询
app.get('/api/v1/hydration/records', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT * FROM hydration_records
    WHERE user_id = ?
    ORDER BY recorded_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const records = await db.query(query, [userId, limit, offset]);
});
```

### 错误处理和恢复

#### 常见错误类型
1. **数据库连接错误**
2. **缓存服务不可用**
3. **第三方服务超时**
4. **内存溢出**
5. **磁盘空间不足**

#### 自动恢复机制
```javascript
// 数据库连接重试
class DatabaseConnection {
  async connect(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.establishConnection();
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000; // 指数退避
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// 熔断器模式
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = 0;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

### 备份和恢复

#### 数据库备份
```bash
#!/bin/bash
# 数据库备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="hydration_tracker"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: db_backup_$DATE.sql.gz"
```

#### 数据恢复
```bash
#!/bin/bash
# 数据恢复脚本

BACKUP_FILE=$1
DB_NAME="hydration_tracker"

if [ -z "$BACKUP_FILE" ]; then
    echo "使用方法: $0 <备份文件路径>"
    exit 1
fi

# 解压备份文件（如果是压缩的）
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE > temp_restore.sql
    BACKUP_FILE="temp_restore.sql"
fi

# 恢复数据库
mysql -u root -p$DB_PASSWORD $DB_NAME < $BACKUP_FILE

# 清理临时文件
rm -f temp_restore.sql

echo "数据库恢复完成"
```

### 安全维护

#### 安全检查清单
- [ ] 定期更新依赖包
- [ ] 检查安全漏洞
- [ ] 更新SSL证书
- [ ] 审查访问日志
- [ ] 检查异常登录
- [ ] 验证备份完整性

#### 安全扫描
```bash
# 依赖安全扫描
npm audit

# 修复安全漏洞
npm audit fix

# 使用Snyk扫描
npx snyk test

# 代码安全扫描
npm run security:scan
```

#### 日志审计
```bash
# 查找异常登录
grep "login_failed" logs/app.log | tail -100

# 查找频繁请求
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -10

# 查找错误请求
grep "ERROR" logs/app.log | tail -50
```

## 🔧 故障排查

### 常见问题和解决方案

#### 1. 数据库连接问题
```
错误: Error: connect ECONNREFUSED 127.0.0.1:3306
```
解决方案:
```bash
# 检查MySQL服务状态
systemctl status mysql

# 启动MySQL服务
systemctl start mysql

# 检查数据库配置
mysql -u root -p -e "SHOW DATABASES;"

# 检查网络连接
telnet localhost 3306
```

#### 2. Redis连接问题
```
错误: Error: connect ECONNREFUSED 127.0.0.1:6379
```
解决方案:
```bash
# 检查Redis服务状态
systemctl status redis

# 启动Redis服务
systemctl start redis

# 测试Redis连接
redis-cli ping
```

#### 3. 内存使用过高
```
错误: JavaScript heap out of memory
```
解决方案:
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max_old_space_size=4096"

# 或在启动时设置
node --max_old_space_size=4096 src/server.js

# 使用PM2设置
pm2 start src/server.js --name api --node-args="--max_old_space_size=4096"
```

#### 4. 文件上传失败
```
错误: MulterError: File too large
```
解决方案:
```javascript
// 检查multer配置
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// 检查nginx配置
client_max_body_size 5M;

// 检查磁盘空间
df -h
```

#### 5. API响应慢
排查步骤:
```bash
# 1. 检查数据库查询
SHOW PROCESSLIST;

# 2. 检查慢查询日志
grep "Query_time" /var/log/mysql/slow-query.log

# 3. 检查系统资源
top
iostat -x 1

# 4. 检查网络连接
netstat -an | grep :3000

# 5. 分析应用日志
grep "responseTime" logs/app.log | tail -100
```

### 应急响应流程

#### 1. 服务不可用
```bash
# 1. 检查服务状态
pm2 status

# 2. 查看错误日志
pm2 logs --err

# 3. 重启服务
pm2 restart hydration-tracker-api

# 4. 如果无法恢复，回滚到上一版本
git checkout <last-stable-commit>
pm2 restart hydration-tracker-api
```

#### 2. 数据丢失
```bash
# 1. 停止应用服务
pm2 stop hydration-tracker-api

# 2. 从备份恢复
./scripts/restore_database.sh /opt/backups/db_backup_20231201.sql.gz

# 3. 验证数据完整性
mysql -u root -p -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM hydration_records;"

# 4. 重启服务
pm2 start hydration-tracker-api
```

#### 3. 安全事件
```bash
# 1. 立即更改所有敏感密码
# - 数据库密码
# - JWT密钥
# - API密钥

# 2. 检查访问日志
grep "suspicious_pattern" logs/access.log

# 3. 撤销所有用户会话
redis-cli FLUSHDB

# 4. 通知用户重新登录
```

## 📝 更新日志

### v1.0.0 (2023-12-01)
- 初始版本发布
- 用户认证系统
- 饮水记录管理
- 智能提醒功能
- 数据统计分析

## 🤝 贡献指南

### 如何贡献

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码审查

所有代码变更必须通过代码审查才能合并:
- 代码符合编码规范
- 包含适当的测试
- 通过所有自动化测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📧 联系我们

- 项目主页: https://github.com/your-org/hydration-tracker
- 问题反馈: https://github.com/your-org/hydration-tracker/issues
- 邮箱: support@hydrationtracker.com

## 🙏 致谢

感谢所有为项目做出贡献的开发者和测试人员。

---

**祝您使用愉快！保持健康，保持水分！💧**