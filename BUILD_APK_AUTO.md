# 自动构建 Android APK 指南

## 🚀 方案1：使用 GitHub Actions（推荐 - 无需本地安装 Android SDK）

我已经为您创建了 GitHub Actions 工作流，可以在云端自动构建 APK。

### 步骤：

1. **提交代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add Android build workflow"
   git push
   ```

2. **触发构建**
   - 前往 GitHub 仓库
   - 点击 **Actions** 标签页
   - 选择 **Build Android APK** 工作流
   - 点击 **Run workflow** 手动触发
   - 或者代码推送后自动触发

3. **下载 APK**
   - 构建完成后（约 5-10 分钟）
   - 在 Actions 页面点击构建任务
   - 在 **Artifacts** 部分下载 `app-debug.apk` 或 `app-release.apk`

### 优点：
✅ 无需本地安装 Android SDK
✅ 自动构建，随时可用
✅ 构建环境标准化

---

## 🛠️ 方案2：本地构建（需要 Android Studio）

如果您想本地构建，需要：

1. **安装 Android Studio**（约 2GB）
   - 下载：https://developer.android.com/studio
   - 安装并首次打开，自动下载 Android SDK

2. **构建 APK**
   ```bash
   npm run android:open
   # 在 Android Studio 中：Build → Build APK(s)
   ```

---

## 📦 当前状态

✅ Capacitor 已配置
✅ Android 项目已创建
✅ 签名密钥已配置
✅ GitHub Actions 工作流已创建
⚠️ 本地需要 Android Studio 才能构建

## 💡 建议

**最快方式**：使用 GitHub Actions（方案1）
- 提交代码到 GitHub
- 在 GitHub Actions 中构建
- 下载生成的 APK

这样您就不需要在本地安装 Android SDK 了！
