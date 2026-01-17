# 🔐 Android Keystore 快速配置指南

## ⚠️ 重要提示

**APK 打包在 GitHub Actions CI 中进行，必须配置 GitHub Secrets 才能使用固定的 keystore。**

不配置的后果：
- ❌ 每次 CI 构建生成新的临时 keystore
- ❌ 签名不一致，无法升级安装
- ❌ 用户必须卸载旧版本（会丢失数据）

## 🚀 快速配置（5 分钟）

### 步骤 1：生成 Keystore（本地）

```bash
# 进入项目目录
cd /path/to/study-reward-app

# 运行生成脚本
./scripts/generate-keystore.sh

# 或手动生成
cd android
keytool -genkeypair -v \
  -keystore keystore/study-reward.keystore \
  -alias study-reward \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android \
  -keypass android \
  -dname "CN=Study Reward App, OU=Development, O=Study Reward, L=City, ST=State, C=CN"
```

### 步骤 2：编码为 Base64

```bash
# macOS（自动复制到剪贴板）
base64 -i android/keystore/study-reward.keystore | pbcopy

# Linux（自动复制到剪贴板）
base64 -i android/keystore/study-reward.keystore | xclip -selection clipboard

# Windows PowerShell（自动复制到剪贴板）
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android\keystore\study-reward.keystore")) | Set-Clipboard
```

### 步骤 3：添加到 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 点击 `Settings`（设置）
3. 左侧菜单选择 `Secrets and variables` → `Actions`
4. 点击 `New repository secret`（新建仓库密钥）
5. 填写：
   - **Name**: `KEYSTORE_BASE64`
   - **Secret**: 粘贴刚才复制的 Base64 字符串
6. 点击 `Add secret`（添加密钥）

### 步骤 4：验证配置

1. 提交代码到 GitHub
2. 查看 GitHub Actions 构建日志
3. 确认看到：`"Restoring keystore from GitHub Secret..."`
4. ✅ 配置成功！

## 🔍 验证 Secret 是否存在

```bash
# 方法1：在 GitHub 上检查
# 进入仓库 → Settings → Secrets and variables → Actions
# 确认存在 KEYSTORE_BASE64

# 方法2：查看 CI 日志
# 如果看到 "Generating keystore with fixed parameters..." 
# 说明 Secret 未设置，需要添加
```

## ✅ 配置完成后的效果

- ✅ CI 构建使用固定的 keystore
- ✅ 所有 APK 使用相同的签名
- ✅ 用户可以升级安装（保留数据）
- ✅ keystore 文件不提交到 Git（安全）

## 🆘 常见问题

### Q: 不设置 GitHub Secret 会怎样？

A: 每次 CI 构建都会生成新的临时 keystore，签名不一致，用户无法升级安装。

### Q: keystore 文件会被提交到 Git 吗？

A: 不会。keystore 文件已在 `.gitignore` 中排除，不会被提交。

### Q: GitHub Secrets 安全吗？

A: 安全。Secrets 是加密存储的，只有仓库管理员可以查看，即使日志中也不会显示。

### Q: 如何备份 keystore？

A: 将 `android/keystore/study-reward.keystore` 文件备份到安全位置（加密存储）。

## 📚 更多信息

详细说明请参考：[README.md](./README.md)
