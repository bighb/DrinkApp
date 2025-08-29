# 🚰 DrinkApp - 智能饮水记录与健康管理APP

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73.6-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange.svg)](https://www.mysql.com/)

## 📱 项目简介

DrinkApp (HydrationTracker) 是一款智能饮水记录与健康管理应用，旨在帮助用户养成健康的饮水习惯。通过科学的数据分析和个性化提醒，让每一滴水都有意义。

### ✨ 核心特性

- 🎯 **智能提醒系统** - AI驱动的个性化饮水提醒
- 📊 **数据可视化** - 直观的饮水统计和趋势分析
- ⚡ **快速记录** - 3秒内完成一次饮水记录
- 🎨 **现代化UI** - 简洁优雅的Material Design界面
- 🔒 **隐私安全** - 符合GDPR的数据保护机制
- 🌐 **跨平台支持** - iOS和Android双平台原生体验

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React Native + Expo 50.0
- **状态管理**: Redux Toolkit
- **导航**: React Navigation 6.x
- **UI组件**: React Native Paper
- **图表**: Victory Native
- **本地存储**: AsyncStorage + MMKV

### 后端技术栈
- **服务器**: Node.js + Express
- **数据库**: MySQL 8.0 + Redis
- **认证**: JWT + bcrypt
- **推送**: Firebase Cloud Messaging
- **日志**: Winston
- **API文档**: Swagger

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier
- **测试**: Jest
- **容器**: Docker + Docker Compose

## 📦 项目结构

```
DrinkApp/
├── 📱 frontend/                    # React Native前端应用
│   ├── src/
│   │   ├── components/            # 可复用组件
│   │   ├── screens/              # 页面组件
│   │   ├── navigation/           # 导航配置
│   │   ├── store/                # Redux状态管理
│   │   ├── services/             # API服务
│   │   └── types/                # TypeScript类型定义
│   ├── App.tsx                   # 应用入口
│   └── package.json
├── 🖥️ backend/                     # Node.js后端服务
│   ├── src/
│   │   ├── controllers/          # 控制器
│   │   ├── routes/               # 路由定义
│   │   ├── middlewares/          # 中间件
│   │   ├── utils/                # 工具函数
│   │   └── config/               # 配置文件
│   ├── database/
│   │   └── schema.sql            # 数据库schema
│   ├── Dockerfile
│   └── package.json
├── 📋 docs/                       # 项目文档
│   ├── PRD_HydrationApp.md       # 产品需求文档
│   ├── Architecture_Diagram.md   # 架构设计文档
│   ├── Development_Timeline.md   # 开发时间线
│   └── UX_Flow_Design.md         # 用户体验流程
├── 🤖 CLAUDE.md                   # AI Agent协作框架
└── README.md                     # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- pnpm 8.0+
- MySQL 8.0+
- Redis 6.0+
- iOS模拟器或Android模拟器

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/bighb/DrinkApp.git
cd DrinkApp
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
pnpm install

# 安装前端依赖
cd ../frontend
pnpm install
```

3. **数据库配置**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE hydration_tracker;

# 导入数据库结构
mysql -u root -p hydration_tracker < backend/database/schema.sql
```

4. **环境变量配置**
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 根据实际情况修改配置
```

5. **启动服务**
```bash
# 启动后端服务 (终端1)
cd backend
pnpm run dev

# 启动前端应用 (终端2)
cd frontend
pnpm start
```

## 🔧 开发指南

### 代码规范

项目采用统一的代码规范，确保代码质量和一致性：

```bash
# 代码检查
pnpm run lint

# 代码格式化
pnpm run lint:fix

# TypeScript类型检查
pnpm run type-check
```

### 测试

```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm run test:watch

# 生成测试覆盖率报告
pnpm run test -- --coverage
```

### Docker部署

```bash
# 构建和启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 🤖 AI Agent协作开发框架

本项目采用创新的AI Agent协作开发模式，由三个专业Agent组成开发团队：

- **🎯 产品经理 (product-manager)** - 负责需求分析和功能规划
- **📱 前端开发 (frontend-developer)** - 专精移动端开发和UI实现
- **⚡ 后端开发 (backend-developer)** - 专注服务器架构和API开发

详细的协作流程和使用方法请参考 [CLAUDE.md](./CLAUDE.md) 文档。

## 📊 功能特性

### 核心功能模块

#### 🥤 饮水记录系统
- 预设常用容量快速记录
- 自定义水量输入
- 饮品类型分类管理
- 历史记录查询和编辑

#### ⏰ 智能提醒系统
- 基于用户习惯的智能算法
- 多种提醒方式（推送/声音/振动）
- 工作模式和休息模式切换
- 地理位置感知提醒策略

#### 📈 健康数据分析
- 多维度饮水统计报告
- 饮水趋势分析和预测
- 个性化健康建议
- 异常饮水模式预警

#### 🎯 目标管理系统
- 智能目标推荐算法
- 个性化目标设定
- 目标达成情况追踪
- 阶段性目标自动调整

## 🎨 界面设计

应用采用现代化的Material Design设计语言，主要特点：

- **色彩主题**: 清新蓝色系，体现水的纯净感
- **交互设计**: 支持手势操作，提供即时反馈
- **无障碍设计**: 支持屏幕阅读器和大字体模式
- **深色模式**: 自适应系统主题设置

## 🔐 安全与隐私

- **数据加密**: 所有API通信使用HTTPS加密
- **密码安全**: 采用bcrypt进行密码哈希加密
- **数据最小化**: 遵循隐私保护法的数据收集原则
- **用户控制**: 提供完整的隐私设置选项

## 📈 性能指标

- **应用启动时间**: < 2秒
- **记录操作时间**: < 3秒
- **API响应时间**: < 500ms
- **测试覆盖率**: > 80%
- **内存使用**: < 100MB

## 🗓️ 开发计划

### MVP版本 (v1.0) - 已完成
- ✅ 用户注册登录系统
- ✅ 基础饮水记录功能
- ✅ 简单数据统计展示
- ✅ 基础提醒功能

### 增强版本 (v1.1) - 开发中
- 🔄 智能提醒算法优化
- 🔄 详细数据分析报告
- 🔄 目标管理系统
- 🔄 成就激励机制

### 高级版本 (v2.0) - 规划中
- 📋 高级健康分析
- 📋 社交功能模块
- 📋 智能设备集成
- 📋 付费增值服务

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

### 代码审查标准
- 代码风格符合项目规范
- 包含适当的单元测试
- 更新相关文档
- 通过所有CI检查

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **项目维护者**: HydrationTracker Team
- **问题反馈**: [GitHub Issues](https://github.com/bighb/DrinkApp/issues)
- **讨论交流**: [GitHub Discussions](https://github.com/bighb/DrinkApp/discussions)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**让每一滴水都有意义** 💧✨