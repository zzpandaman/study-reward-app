# 📱 应用图标配置指南

## 快速开始

### 1. 准备图标文件

你需要准备两个图标文件并放到 `build/` 目录：

- **Windows图标**: `build/icon.ico`
- **macOS图标**: `build/icon.icns`

### 2. 推荐的图标尺寸

- **Windows (.ico)**: 256×256 像素（可包含多尺寸：16, 32, 48, 256）
- **macOS (.icns)**: 1024×1024 像素（包含多尺寸：16, 32, 64, 128, 256, 512, 1024）

### 3. 图标生成工具推荐

#### 在线工具（免费）

1. **CloudConvert** (https://cloudconvert.com/)
   - 上传PNG图片，转换为.ico或.icns
   - 支持多尺寸自动生成

2. **IconKitchen** (https://icon.kitchen/)
   - Google的图标生成工具
   - 可以快速生成多平台图标

3. **iConvert Icons** (https://iconverticons.com/online/)
   - 在线PNG转ICO/ICNS工具

#### 桌面工具

1. **Image2icon** (macOS)
   - 免费应用，拖拽PNG即可生成.icns

2. **Online ICO Converter**
   - 网页工具，PNG转ICO

### 4. 图标设计要求

- **简洁清晰**：小尺寸下也能清晰识别
- **背景透明**：或者使用纯色背景
- **高对比度**：确保在各种背景下都清晰可见
- **主题相关**：使用学习、奖励相关的元素（书本、星星、奖杯等）

### 5. 快速图标方案

如果暂时没有图标，可以使用这些免费资源：

- **Flaticon**: https://www.flaticon.com/ (搜索 "study" 或 "education")
- **Icons8**: https://icons8.com/ (免费图标库)
- **Font Awesome**: 有学习相关的图标

### 6. 图标放置位置

将准备好的图标文件放到：

```
build/
├── icon.ico   (Windows图标，256×256或更大)
└── icon.icns  (macOS图标，1024×1024或更大)
```

### 7. 验证配置

图标文件放置后，运行打包命令：

```bash
npm run electron:build:win  # Windows
npm run electron:build:mac  # macOS
```

如果配置正确，打包后应用会显示你的自定义图标。

## 注意事项

⚠️ **图标格式要求**：
- Windows: `.ico` 文件，建议包含多个尺寸
- macOS: `.icns` 文件，必须包含多种分辨率

⚠️ **打包后验证**：
- 开发模式下可能看不到自定义图标
- 只有打包后的应用才会显示自定义图标
