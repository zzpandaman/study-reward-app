# 鼠标光标图片下载和处理脚本

## 概述

这些脚本用于下载和处理疯狂动物城2解毒笔图片，并将其添加到鼠标光标预设中。

## 脚本说明

### 1. `download-cursor-images.js`

直接下载指定URL的图片并处理。

**使用方式：**
```bash
node scripts/download-cursor-images.js
```

**功能：**
- 下载用户提供的图片链接
- 自动调整图片大小到32x32像素（鼠标光标推荐尺寸）
- 转换为PNG格式
- 保存到 `src/assets/images/` 目录

### 2. `search-images-apify.js`

使用 Apify 搜索并下载图片（需要配置 Apify Token）。

**使用方式：**

1. 安装 Apify Client（如果未安装）：
```bash
npm install @apify/client
```

2. 获取 Apify Token：
   - 访问 https://console.apify.com/
   - 注册/登录账户
   - 前往 Account → Integrations
   - 复制 API Token

3. 设置环境变量或修改脚本：
```bash
# 方式1：设置环境变量
export APIFY_TOKEN=your_token_here
node scripts/search-images-apify.js

# 方式2：在脚本中直接替换 YOUR_APIFY_TOKEN_HERE
```

**功能：**
- 使用 Apify 搜索"zootopia 2 antidote pen"相关图片
- 下载找到的图片（最多5张）
- 自动处理图片（调整大小、转换格式）
- 保存到 `src/assets/images/` 目录

## 已完成的步骤

✅ 已下载并处理用户提供的图片：
- `zootopia-antidote-pen-1.png` - 已添加到鼠标光标预设

✅ 已更新预设文件 `src/utils/style-presets.ts`：
- 添加了"疯狂动物城2解毒笔"预设项
- 图片路径已配置为使用 Vite 导入方式

## 下一步操作

### 使用 Apify 搜索更多图片

1. **配置 Apify Token**（见上方说明）

2. **运行搜索脚本**：
```bash
node scripts/search-images-apify.js
```

3. **手动添加新图片到预设**：
   - 下载的图片会自动保存到 `src/assets/images/`
   - 在 `src/utils/style-presets.ts` 中导入新图片
   - 添加到 `CURSOR_STYLE_PRESETS` 数组

### 图片抠图（移除背景）

如果需要移除图片背景，可以使用以下工具：

**在线工具：**
- [Remove.bg](https://www.remove.bg/) - 自动AI抠图
- [Photopea](https://photopea.com/) - 在线PS，手动抠图
- [Canva](https://www.canva.com/) - 背景移除功能

**处理步骤：**
1. 使用上述工具处理图片，移除背景
2. 保存为PNG格式（保留透明通道）
3. 替换 `src/assets/images/` 中的对应文件

## 注意事项

⚠️ **图片版权**：
- 确保使用的图片有使用许可
- 商业用途需要获得相应授权
- 建议使用官方或授权素材

⚠️ **图片要求**：
- 推荐尺寸：32x32 像素
- 格式：PNG（支持透明背景）
- 文件大小：建议小于100KB

⚠️ **Apify 使用限制**：
- Apify 有免费额度限制
- 超出限制可能需要付费
- 建议控制搜索数量

## 相关文件

- `src/utils/style-presets.ts` - 鼠标光标预设定义
- `src/utils/style-apply.ts` - 样式应用逻辑
- `src/components/StyleCustomizer.tsx` - 样式自定义界面
