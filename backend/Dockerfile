# 多阶段构建 - 生产环境优化
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 开发阶段
FROM base AS development

# 复制 package 文件
COPY package*.json ./

# 安装开发依赖
RUN npm ci --only=development

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 开发环境启动命令
CMD ["dumb-init", "npm", "run", "dev"]

# 构建阶段
FROM base AS build

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖
RUN npm ci

# 复制源代码
COPY . .

# 运行测试和代码检查
RUN npm run test && npm run lint

# 生产阶段
FROM base AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force

# 复制构建后的应用
COPY --from=build --chown=nodeuser:nodejs /app/src ./src
COPY --from=build --chown=nodeuser:nodejs /app/logs ./logs

# 创建上传目录
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs uploads logs

# 切换到非root用户
USER nodeuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 生产环境启动命令
CMD ["dumb-init", "node", "src/server.js"]