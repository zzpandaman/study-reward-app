# Android Keystore 安全说明

## 🔒 安全性重要提示

⚠️ **绝对不要将 keystore 文件提交到 Git！**

- ✅ keystore 文件已在 `.gitignore` 中，不会被提交
- ✅ keystore 使用 GitHub Secrets 安全存储（加密）
- ✅ 只有仓库管理员可以访问 Secrets

## 问题：APK 升级安装需要卸载旧版本

如果每次构建使用不同的 keystore，会导致签名不一致，安装新版本 APK 时需要先卸载旧版本（会删除用户数据）。

## 解决方案：使用固定的 Keystore（安全方案）

为了支持升级安装（保留用户数据），所有构建必须使用**相同的 keystore**。使用 GitHub Secrets 可以安全地存储 keystore，而不需要提交到代码仓库。

### ✅ 推荐方案：使用 GitHub Secrets（最安全）

#### 步骤1：本地生成 Keystore（仅一次）

```bash
# 使用提供的脚本生成（更安全）
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

#### 步骤2：将 Keystore 编码为 Base64

```bash
# macOS
base64 -i android/keystore/study-reward.keystore | pbcopy

# Linux
base64 -i android/keystore/study-reward.keystore | xclip -selection clipboard

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android\keystore\study-reward.keystore")) | Set-Clipboard
```

#### 步骤3：添加到 GitHub Secrets（安全存储）

1. **打开仓库设置**：
   - 进入 GitHub 仓库页面
   - 点击 `Settings` → `Secrets and variables` → `Actions`

2. **添加 Secret**：
   - 点击 `New repository secret`
   - **Name**: `KEYSTORE_BASE64`
   - **Secret**: 粘贴刚才复制的 Base64 字符串
   - 点击 `Add secret`

3. **安全说明**：
   - ✅ Secrets 是加密存储的，只有仓库管理员可以查看
   - ✅ 即使在日志中也不会显示（已配置）
   - ✅ CI workflow 会自动从 Secret 恢复 keystore
   - ✅ keystore 文件不会出现在代码仓库中

#### 步骤4：验证配置

提交代码后，CI 会自动：
1. 从 GitHub Secret 恢复 keystore
2. 使用相同的签名构建 APK
3. 生成的 APK 可以升级安装（保留用户数据）

### 📝 本地开发配置

对于本地开发，keystore 文件保留在本地（不会被 Git 跟踪）：

```bash
# 本地已经生成的 keystore.properties 配置
# 这个文件可以提交（只包含路径，不包含密钥）
storePassword=android
keyPassword=android
keyAlias=study-reward
storeFile=keystore/study-reward.keystore
```

⚠️ **注意**：`keystore.properties` 包含密码，生产环境建议使用环境变量。

### 🔐 安全最佳实践

1. **不要提交 keystore**：
   - ✅ 已在 `.gitignore` 中排除
   - ✅ 定期检查：`git status` 确认没有 keystore 文件

2. **使用 GitHub Secrets**：
   - ✅ 加密存储，只有管理员可访问
   - ✅ CI 中自动使用，无需手动操作

3. **备份 keystore**：
   - ✅ 本地备份到安全位置（加密存储）
   - ✅ 建议使用密码管理器保存

4. **密码管理**：
   - ⚠️ 生产环境应使用强密码
   - ⚠️ 不要将密码硬编码在代码中

## 数据持久化说明

应用使用 **Capacitor** 的 WebView，数据存储在：
- **Web Storage (localStorage)**：应用卸载时**会丢失**
- **Android 数据目录**：应用卸载时**会丢失**

⚠️ **注意**：Android 应用卸载时会删除所有应用数据，包括 localStorage。

✅ **升级安装**（使用相同签名）：数据会保留
❌ **卸载重装**：数据会丢失

## 用户建议

建议用户：
1. 定期使用应用内的数据导出功能备份数据
2. 升级时直接安装新 APK（不要卸载）
3. 如必须卸载，先导出数据再卸载
