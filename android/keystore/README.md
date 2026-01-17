# Android Keystore 说明

## 问题：APK 升级安装需要卸载旧版本

如果每次构建使用不同的 keystore，会导致签名不一致，安装新版本 APK 时需要先卸载旧版本（会删除用户数据）。

## 解决方案：使用固定的 Keystore

为了支持升级安装（保留用户数据），所有构建必须使用**相同的 keystore**。

### 方法1：使用已生成的 Keystore（推荐）

1. **生成一次 Keystore**（只需执行一次）：
```bash
cd android
keytool -genkeypair -v \
  -keystore keystore/study-reward.keystore \
  -alias study-reward \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android \
  -keypass android \
  -dname "CN=Study Reward App, OU=Development, O=Study Reward, L=City, ST=State, C=CN"
```

2. **配置 keystore.properties**：
```properties
storePassword=android
keyPassword=android
keyAlias=study-reward
storeFile=keystore/study-reward.keystore
```

3. **保存 Keystore 文件**（重要！）：
   - ⚠️ **请妥善保管** `keystore/study-reward.keystore` 文件
   - ⚠️ **丢失后无法更新应用**（必须卸载重装）
   - 💡 建议备份到安全的地方

### 方法2：在 CI 中使用 GitHub Secret

1. **将 Keystore 编码为 Base64**：
```bash
base64 -i keystore/study-reward.keystore > keystore-base64.txt
```

2. **添加到 GitHub Secrets**：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 添加 Secret：`KEYSTORE_BASE64`（值为 `keystore-base64.txt` 的内容）

3. **CI 会自动从 Secret 恢复 Keystore**

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
