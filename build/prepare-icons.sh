#!/bin/bash

# 图标准备脚本
# 使用方法: 将你的图标PNG文件放到build目录，命名为icon.png，然后运行此脚本

echo "📱 准备应用图标..."

if [ ! -f "icon.png" ]; then
    echo "❌ 错误: 请先将图标PNG文件放到build目录，命名为icon.png"
    echo ""
    echo "快速生成步骤:"
    echo "1. 准备一张512x512或1024x1024的PNG图片"
    echo "2. 将图片重命名为icon.png"
    echo "3. 放到build目录"
    echo "4. 运行此脚本"
    exit 1
fi

echo "✓ 找到icon.png文件"

# 生成Windows ICO文件（需要ImageMagick）
if command -v convert &> /dev/null; then
    echo "生成Windows图标 (icon.ico)..."
    convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
    echo "✓ Windows图标已生成"
else
    echo "⚠ ImageMagick未安装，无法自动生成ICO文件"
    echo "请使用在线工具生成: https://iconverticons.com/online/"
    echo "或安装ImageMagick: brew install imagemagick"
fi

# 生成macOS ICNS文件
if command -v iconutil &> /dev/null && command -v sips &> /dev/null; then
    echo "生成macOS图标 (icon.icns)..."
    
    # 创建iconset目录
    rm -rf icon.iconset
    mkdir icon.iconset
    
    # 生成不同尺寸
    sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png > /dev/null 2>&1
    sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png > /dev/null 2>&1
    sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png > /dev/null 2>&1
    sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png > /dev/null 2>&1
    sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png > /dev/null 2>&1
    sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png > /dev/null 2>&1
    sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png > /dev/null 2>&1
    sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png > /dev/null 2>&1
    sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png > /dev/null 2>&1
    sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png > /dev/null 2>&1
    
    # 生成icns文件
    iconutil -c icns icon.iconset
    
    # 清理iconset目录
    rm -rf icon.iconset
    
    echo "✓ macOS图标已生成"
else
    echo "⚠ iconutil/sips未找到（需要macOS系统）"
    echo "请使用在线工具生成: https://iconverticons.com/online/"
fi

echo ""
echo "✅ 图标准备完成！"
echo ""
echo "下一步:"
echo "1. 检查build目录是否有icon.ico和icon.icns文件"
echo "2. 运行: npm run electron:build:win 或 npm run electron:build:mac"
