# Android APK 打包指南

## ✅ Capacitor 配置完成

项目已配置 Capacitor，可以打包 Android APK。

## 📦 构建 APK

### 方法1：使用 Android Studio（推荐）

1. **安装 Android Studio**
   - 下载：https://developer.android.com/studio
   - 安装后打开 Android Studio

2. **导入项目**
   ```bash
   # 先同步代码
   npm run android:sync
   
   # 用 Android Studio 打开
   npm run android:open
   ```

3. **构建 APK**
   - 在 Android Studio 中：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - 构建完成后，APK 位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 方法2：使用命令行（需要 Android SDK）

1. **安装 Android SDK**
   - 确保已安装 Android SDK 和 Gradle
   - 设置环境变量 `ANDROID_HOME`

2. **构建调试版 APK**
   ```bash
   npm run android:build
   ```

3. **APK 位置**
   - 调试版：`android/app/build/outputs/apk/debug/app-debug.apk`
   - 如需发布版，需要在 Android Studio 中配置签名

## 🚀 快速开始

```bash
# 1. 构建 Web 应用并同步到 Android
npm run android:sync

# 2. 打开 Android Studio
npm run android:open

# 3. 在 Android Studio 中构建 APK
```

## 📝 注意事项

1. **首次构建需要较长时间**：需要下载 Gradle 和依赖
2. **需要 Android SDK**：最低支持 Android 5.0 (API 21)
3. **签名配置**：✅ 已完成！签名密钥已配置，可以构建发布版 APK
4. **本地存储**：应用使用 localStorage，数据保存在设备本地

## 🔐 签名密钥配置

✅ **签名密钥已配置完成**

- **密钥库位置**：`android/keystore/study-reward.keystore`
- **配置文件**：`android/keystore/keystore.properties`
- **密钥别名**：`study-reward`
- **默认密码**：`android`（生产环境请修改）

⚠️ **重要提示**：
- 密钥库文件已添加到 `.gitignore`，不会提交到版本控制
- 生产环境请修改密钥库密码
- 请妥善保管密钥库文件，丢失后无法更新应用

## 🔧 可用脚本

- `npm run android:sync` - 构建 Web 并同步到 Android 项目
- `npm run android:open` - 在 Android Studio 中打开项目
- `npm run android:build` - 构建调试版 APK（需要 Android SDK）
- `npm run android:build:release` - 构建发布版 APK（已签名，需要 Android SDK）

## 📦 构建发布版 APK

### 使用命令行（需要 Android SDK）

```bash
# 构建发布版 APK（已签名）
npm run android:build:release
```

### 使用 Android Studio

1. 打开项目：`npm run android:open`
2. 选择 **Build Variants** → 选择 `release`
3. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. APK 位置：`android/app/build/outputs/apk/release/app-release.apk`

## 📱 测试

APK 构建完成后，可以通过以下方式安装测试：

1. **通过 USB 调试**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. **直接传输到手机**
   - 将 APK 文件传输到手机
   - 在手机设置中允许"未知来源"安装
   - 点击 APK 文件安装
