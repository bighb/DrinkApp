# 喝水 APP 开发项目 - 智能 Agent 协作系统

欢迎来到喝水 APP 开发项目！本项目采用分工协作的开发模式，由三个专业 Agent 组成开发团队，共同完成从需求分析到产品上线的全流程开发。

## Agent 团队介绍

### 🎯 产品经理 (product-manager)

专注于产品规划和用户体验设计的专家

- 负责需求分析和功能规划
- 制定产品路线图和优先级
- 设计用户故事和验收标准
- 协调团队协作和项目进度

### 📱 前端开发 (frontend-developer)

专精移动端开发的技术专家

- React Native
- 用户界面实现和交互设计
- 性能优化和用户体验提升
- 前端测试和调试

### ⚡ 后端开发 (backend-developer)

专注服务器架构和数据管理的技术专家

- Node.js/Express API 开发
- MySQL 数据库设计
- 云服务部署和系统架构
- 安全防护和性能优化

## 协作工作流程

### 1. 项目启动阶段

```
产品经理 → 需求分析 → 功能规划 → 技术方案评估
    ↓
前端开发 ← 界面设计讨论 ← 后端开发
```

### 2. 开发执行阶段

```
产品经理: 细化需求，制定验收标准
    ↓
前端开发: UI组件开发 ↔ 后端开发: API接口开发
    ↓
集成测试和功能验证
```

### 3. 迭代优化阶段

```
产品经理: 用户反馈收集 → 功能优化建议
    ↓
前端开发: 界面优化 ↔ 后端开发: 性能优化
    ↓
版本发布和上线
```

## Agent 调度策略

### 任务分配原则

1. **产品经理优先**: 新功能开发前，先由产品经理进行需求分析
2. **并行开发**: 前后端可以同时进行开发，通过 API 规范协调
3. **交叉验证**: 不同角色互相 Review 代码和方案
4. **迭代优化**: 基于反馈持续改进产品

### 协作场景示例

#### 场景 1: 新功能开发

```bash
# 1. 产品经理分析需求
claude --agent product-manager "分析用户饮水提醒功能的需求"

# 2. 后端开发设计API
claude --agent backend-developer "设计饮水提醒的后端API"

# 3. 前端开发实现界面
claude --agent frontend-developer "实现饮水提醒的移动端界面"
```

#### 场景 2: 问题排查

```bash
# 1. 前端发现性能问题
claude --agent frontend-developer "分析应用启动缓慢的问题"

# 2. 后端排查API响应
claude --agent backend-developer "检查API响应时间优化点"

# 3. 产品经理评估影响
claude --agent product-manager "评估性能问题对用户体验的影响"
```

#### 场景 3: 架构优化

```bash
# 1. 后端提出架构升级方案
claude --agent backend-developer "设计微服务架构升级方案"

# 2. 前端评估兼容性
claude --agent frontend-developer "评估前端对新架构的适配工作"

# 3. 产品经理制定迁移计划
claude --agent product-manager "制定架构升级的项目计划"
```

## 项目规范

### 开发规范

- 遵循敏捷开发方法论
- 采用 GitFlow 工作流程
- 代码 Review 必须通过
- 自动化测试覆盖率 > 80%

### 协作规范

- 功能开发前先讨论技术方案
- 保持良好的代码和文档质量

### 质量标准

- 用户体验流畅度优先
- 系统安全性和数据保护
- 代码可维护性和扩展性
- 性能指标达到行业标准

## 常用命令

### Agent 调度命令

```bash
# 启动产品规划讨论
claude --agent product-manager

# 开始前端开发工作
claude --agent frontend-developer

# 进行后端架构设计
claude --agent backend-developer

# 多Agent协作讨论
claude --agent product-manager,frontend-developer,backend-developer
```
