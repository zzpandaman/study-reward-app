# 📦 打包指南

## 环境要求

- Node.js 18+ 
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式测试

先测试应用是否能正常运行：

```bash
# 终端1：启动开发服务器
npm run dev

# 终端2：启动Electron（在新终端）
npm run electron:dev
```

如果开发模式正常运行，可以继续打包。

## 打包步骤

### Windows平台打包

```bash
npm run electron:build:win
```

打包完成后，安装文件会在 `release` 目录：
- `学习奖励小程序 Setup 1.0.0.exe` - 安装程序

### macOS平台打包

```bash
npm run electron:build:mac
```

打包完成后，安装文件会在 `release` 目录：
- `学习奖励小程序-1.0.0.dmg` - 磁盘映像文件

### 当前平台打包

```bash
npm run electron:build
```

会自动检测当前系统并打包对应平台。

## 打包流程说明

打包命令会自动执行以下步骤：

1. **编译TypeScript**：编译React应用和Electron主进程
2. **构建React应用**：使用Vite构建前端应用
3. **打包Electron应用**：使用electron-builder打包成安装文件

## 打包输出

打包完成后，所有文件都在 `release` 目录：

- **Windows**: `.exe` 安装程序
- **macOS**: `.dmg` 磁盘映像文件

## 常见问题

### 1. 图标文件缺失

如果没有图标文件，electron-builder会使用默认图标。要使用自定义图标：

- Windows: 将 `icon.ico` 放在 `build/` 目录
- macOS: 将 `icon.icns` 放在 `build/` 目录

### 2. 打包失败

如果打包失败，检查：

1. 是否正确安装了所有依赖
2. TypeScript编译是否成功
3. Vite构建是否成功
4. 是否有足够的磁盘空间

### 3. macOS打包权限问题

macOS打包可能需要代码签名。如果只是个人使用，可以在 `package.json` 的 `build.mac` 中添加：

```json
"identity": null
```

## 分发应用

打包完成后，可以将 `release` 目录中的安装文件分发给用户：

- Windows用户：运行 `.exe` 安装程序
- macOS用户：打开 `.dmg` 文件，拖拽应用到应用程序文件夹

## 文件大小

打包后的安装文件大约：
- Windows: 80-150 MB
- macOS: 100-200 MB

这是正常的，因为包含了完整的Electron运行时和所有依赖。
