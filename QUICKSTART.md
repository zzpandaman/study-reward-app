# 🚀 快速开始指南

## 第一步：安装依赖

```bash
cd study-reward-app
npm install
```

## 第二步：开发测试（可选）

测试应用是否正常运行：

```bash
# 开发模式（Web浏览器）
npm run dev

# 或者Electron桌面应用开发模式
npm run electron:dev
```

## 第三步：打包成安装程序

### 在macOS上打包

打包macOS安装包：
```bash
npm run electron:build:mac
```

打包Windows安装包（需要在macOS上，使用Wine）：
```bash
npm run electron:build:win
```

### 在Windows上打包

打包Windows安装包：
```bash
npm run electron:build:win
```

## 打包结果

打包完成后，安装文件在 `release` 目录：

- **Windows**: `学习奖励小程序 Setup 1.0.0.exe`
- **macOS**: `学习奖励小程序-1.0.0.dmg`

## 分发给用户

用户只需要：

1. **Windows用户**：双击 `.exe` 文件安装
2. **macOS用户**：双击 `.dmg` 文件，拖拽应用到"应用程序"文件夹

就这么简单！

## 注意事项

- 首次打包会下载Electron，可能需要一些时间
- 如果没有图标，会使用默认图标（不影响使用）
- 打包后的应用是单机版，所有数据保存在本地
