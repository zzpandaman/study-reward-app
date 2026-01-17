# 如何构建 Android APK

## ⚠️ 当前情况

构建 APK 需要 **Android SDK** 环境。您的系统可能需要安装 Android Studio 或配置 Android SDK。

## 🚀 快速方案：使用 Android Studio

### 步骤1：安装 Android Studio

1. 下载 Android Studio：https://developer.android.com/studio
2. 安装并打开 Android Studio
3. 首次打开会自动下载 Android SDK

### 步骤2：打开项目并构建

```bash
# 1. 同步代码到 Android 项目
npm run android:sync

# 2. 用 Android Studio 打开项目
npm run android:open

# 3. 在 Android Studio 中：
#    - 等待 Gradle 同步完成（首次可能需要几分钟）
#    - 选择 Build → Build Bundle(s) / APK(s) → Build APK(s)
#    - 等待构建完成
```

### 步骤3：找到 APK

构建完成后，APK 文件位置：
- **调试版**：`android/app/build/outputs/apk/debug/app-debug.apk`
- **发布版**：`android/app/build/outputs/apk/release/app-release.apk`

## 📱 在线构建方案（备选）

如果不想安装 Android Studio，可以考虑使用在线构建服务：
- GitHub Actions（需要配置 CI/CD）
- 云构建服务（如 Codemagic、Bitrise 等）

## 🔧 命令行构建（需要 Android SDK）

如果已安装 Android SDK：

```bash
# 1. 设置环境变量
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# 2. 构建调试版
npm run android:build

# 3. 构建发布版
npm run android:build:release
```

## 📦 当前项目状态

✅ Capacitor 已配置
✅ Android 平台已添加
✅ 签名密钥已配置
✅ Web 应用已构建
⚠️ 需要 Android SDK 才能构建 APK

## 💡 建议

**最快的方式**：使用 Android Studio（推荐）
1. 下载安装 Android Studio（约 5-10 分钟）
2. 打开项目并构建（约 2-5 分钟）
3. 即可获得 APK 文件
