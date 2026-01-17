# 📚 学习奖励小程序

一个监督学习的小程序，可以创建学习任务并计时，完成任务后获得积分奖励，用积分在商城中兑换物资。

## ✨ 功能特点

- ✅ **学习任务管理**：创建、开始、暂停、完成学习任务
- ⏱️ **实时计时**：任务进行时实时显示已用时间
- 🎁 **积分奖励**：完成任务获得积分奖励
- 🛒 **积分商城**：用积分兑换各种奖励物资
- 💾 **本地存储**：所有数据保存在本地，保护隐私

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器：

```bash
npm run dev
```

启动Electron开发模式：

```bash
npm run electron:dev
```

### 构建打包

#### 构建Web版本

```bash
npm run build
```

#### 打包成桌面应用

**Windows安装包：**
```bash
npm run electron:build:win
```

**macOS安装包：**
```bash
npm run electron:build:mac
```

**当前平台安装包：**
```bash
npm run electron:build
```

打包后的安装文件会在 `release` 目录中。

## 📦 打包说明

### Windows
- 打包后会生成 `.exe` 安装程序在 `release` 目录
- 用户双击安装程序即可安装
- 安装后可在开始菜单和桌面找到应用

### macOS
- 打包后会生成 `.dmg` 磁盘映像文件在 `release` 目录
- 用户双击 `.dmg` 文件，拖拽应用到应用程序文件夹即可安装
- 首次运行可能需要右键点击应用，选择"打开"来允许运行

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **桌面框架**: Electron
- **打包工具**: electron-builder
- **样式**: CSS3

## 📝 使用说明

### 添加学习任务
1. 在"学习任务"标签页，填写任务信息
2. 设置预计时长和奖励积分
3. 点击"添加任务"

### 开始学习
1. 在待办任务列表中点击"开始学习"
2. 任务开始计时，可随时暂停
3. 完成任务后点击"完成任务"获得积分

### 兑换奖励
1. 切换到"积分商城"标签页
2. 查看可用积分和商品
3. 点击"立即兑换"使用积分兑换奖励

## 📁 项目结构

```
study-reward-app/
├── electron/          # Electron主进程文件
│   ├── main.ts       # 主进程入口
│   └── preload.ts    # 预加载脚本
├── src/              # React应用源码
│   ├── data/         # 数据层（存储、版本管理、迁移）
│   ├── api/          # 接口能力层（RESTful API抽象）
│   ├── components/   # 视图渲染层（React组件）
│   ├── utils/        # 工具函数（兼容层、主题等）
│   ├── types.ts      # 类型定义
│   └── App.tsx       # 主应用组件
├── docs/             # 架构文档
│   ├── ARCHITECTURE.md  # 架构总览
│   ├── DATA_LAYER.md    # 数据层文档
│   ├── API_LAYER.md     # 接口层文档
│   └── VIEW_LAYER.md    # 视图层文档
├── build.js          # 构建脚本
└── package.json      # 项目配置
```

## 🏗️ 架构设计

本项目采用**三层架构**设计：

1. **数据层（Data Layer）**：负责数据存储、版本管理、数据迁移
   - 支持从localStorage平滑迁移到MySQL
   - 自动检测和迁移老用户数据
   - 数据备份和恢复机制

2. **接口能力层（API Layer）**：提供RESTful风格的API抽象
   - 业务逻辑与数据存储解耦
   - 便于后续转型Java Web后端
   - 统一的响应格式和错误处理

3. **视图渲染层（View Layer）**：用户界面和交互
   - 丰富的用户自定义选项（主题、样式等）
   - 通过API层获取数据
   - 响应式设计

详细架构文档请参考 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 💡 注意事项

- 所有数据保存在本地浏览器的LocalStorage中
- 卸载应用会清除所有数据，请谨慎操作
- 建议定期备份数据（可通过"设置"菜单导出数据）
- **老用户数据自动迁移**：升级到新版本时，系统会自动检测并迁移旧版本数据，确保数据不丢失

## 📚 架构文档

- [架构总览](./docs/ARCHITECTURE.md) - 三层架构设计说明
- [数据层文档](./docs/DATA_LAYER.md) - 数据结构、存储位置、数据迁移
- [接口层文档](./docs/API_LAYER.md) - RESTful API设计文档
- [视图层文档](./docs/VIEW_LAYER.md) - 用户自定义选项说明

## 📄 许可证

MIT
