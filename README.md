# 学习奖励

学习任务计时 + 积分奖励系统，支持本地模式和服务器模式。

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（本地数据）
npm run dev

# 构建生产版本
npm run build
```

## 多环境配置

### 本地模式（默认）

数据存储在 localStorage，无需后端服务。

```bash
# .env.development（默认）
VITE_API_TIMEOUT=30000
```

### 服务器模式

连接 star-reward 后端，数据存储在 MySQL。

```bash
# .env.production
VITE_API_BASE_URL=/api/reward
VITE_API_TIMEOUT=30000
```

本地开发时连接服务器：

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api/reward
```

## 数据迁移

从本地模式切换到服务器模式时，系统会自动检测本地数据并提示迁移。

- 迁移前自动备份
- 使用 name 作为幂等键，避免重复
- 迁移后本地数据保留

## 构建打包

### Web

```bash
npm run build
```

### Electron 桌面应用

```bash
npm run electron:build
```

### Android APK

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

## 项目结构

```
src/
├── api/          # API 层（LocalClient / HttpClient）
├── data/         # 数据层（本地模式）
├── components/   # 视图层
└── utils/        # 工具函数
```

## 许可证

MIT
