#!/bin/bash
# 生成固定的 Android Keystore
# 使用方法：./scripts/generate-keystore.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KEYSTORE_DIR="$PROJECT_ROOT/android/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/study-reward.keystore"

echo "🔐 生成 Android Keystore..."
echo ""

# 检查是否已存在 keystore
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  警告: Keystore 文件已存在: $KEYSTORE_FILE"
    echo "   如果要重新生成，请先删除现有文件"
    echo "   删除命令: rm $KEYSTORE_FILE"
    exit 1
fi

# 创建目录
mkdir -p "$KEYSTORE_DIR"

# 生成 keystore
cd "$PROJECT_ROOT/android"
keytool -genkeypair -v \
  -keystore "$KEYSTORE_FILE" \
  -alias study-reward \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android \
  -keypass android \
  -dname "CN=Study Reward App, OU=Development, O=Study Reward, L=City, ST=State, C=CN"

# 创建 keystore.properties
cat > "$KEYSTORE_DIR/keystore.properties" <<EOF
storePassword=android
keyPassword=android
keyAlias=study-reward
storeFile=keystore/study-reward.keystore
EOF

echo ""
echo "✅ Keystore 生成成功！"
echo ""
echo "📁 文件位置: $KEYSTORE_FILE"
echo "📝 配置文件: $KEYSTORE_DIR/keystore.properties"
echo ""
echo "⚠️  重要提示:"
echo "   1. 请妥善保管 keystore 文件，丢失后无法更新应用"
echo "   2. 建议备份到安全的地方"
echo "   3. 如需在 CI 中使用，请将其编码为 Base64 并添加到 GitHub Secrets"
echo ""
echo "🔗 添加到 GitHub Secrets:"
echo "   base64 -i $KEYSTORE_FILE | pbcopy  # macOS"
echo "   base64 -i $KEYSTORE_FILE | xclip -selection clipboard  # Linux"
echo "   然后将结果添加到 Secrets → KEYSTORE_BASE64"
