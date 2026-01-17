# 🚀 快速添加图标（5分钟）

## 最简单的方法

### 步骤1: 准备图标图片
找一张你喜欢的图标图片（PNG格式），建议尺寸：
- **最小**: 512×512 像素
- **推荐**: 1024×1024 像素

### 步骤2: 在线转换

访问以下任一在线工具，上传你的PNG图片：

1. **iConvert Icons** (推荐): https://iconverticons.com/online/
   - 上传PNG → 选择ICO → 下载
   - 上传PNG → 选择ICNS → 下载

2. **CloudConvert**: https://cloudconvert.com/png-to-ico
   - PNG转ICO和ICNS

3. **ConvertICO**: https://convertico.com/
   - PNG转ICO

### 步骤3: 放置图标文件

将下载的文件重命名并放到 `build/` 目录：

```
build/
├── icon.ico   ← Windows图标
└── icon.icns  ← macOS图标
```

### 步骤4: 重新打包

```bash
npm run electron:build:win  # Windows
npm run electron:build:mac  # macOS
```

完成！🎉

## 图标设计建议

如果你需要设计图标，可以：
- 使用**学习、奖励**相关的元素（📚📖⭐🏆）
- 使用**渐变色**背景（现代风格）
- 保持**简洁**，易于识别

## 免费图标资源

- **Flaticon**: https://www.flaticon.com/ (搜索"study"或"education")
- **Icons8**: https://icons8.com/
- **Font Awesome**: https://fontawesome.com/icons

选择一个图标，下载PNG格式，然后按上面的步骤转换即可！
