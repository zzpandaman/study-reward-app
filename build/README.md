# Build 目录

此目录用于存放应用图标和打包资源。

## 需要的文件

### Windows 图标
- **文件名**: `icon.ico`
- **位置**: `build/icon.ico`
- **格式**: ICO格式，建议256×256像素

### macOS 图标
- **文件名**: `icon.icns`
- **位置**: `build/icon.icns`
- **格式**: ICNS格式，建议1024×1024像素

## 如何生成图标

### 方法1：使用在线工具

1. 准备一张512×512或1024×1024的PNG图片
2. 访问 https://iconverticons.com/online/
3. 上传PNG，选择输出格式（ICO或ICNS）
4. 下载后放到本目录

### 方法2：使用命令行（macOS）

```bash
# PNG转ICNS (需要安装iconutil)
mkdir icon.iconset
# 将不同尺寸的PNG放到iconset中
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

### 方法3：使用ImageMagick（ICO）

```bash
# 安装ImageMagick: brew install imagemagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## 图标设计建议

- 使用学习、奖励相关的元素（📚书本、⭐星星、🏆奖杯等）
- 简洁清晰，在小尺寸下也能识别
- 使用高对比度颜色
- 建议使用渐变色或现代设计风格

## 当前状态

如果没有图标文件，electron-builder会使用默认的Electron图标。

添加图标文件后，请重新运行打包命令。
