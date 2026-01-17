# 📱 应用图标配置

## ⚡ 超快速方案（推荐）

### 3步完成：

1. **下载图标PNG**（512×512或更大）
   - 推荐网站：https://www.flaticon.com/
   - 搜索关键词：study, education, reward, learning

2. **在线转换**
   - 访问：https://iconverticons.com/online/
   - 上传PNG，分别转换为 `.ico` 和 `.icns`

3. **放到build目录**
   ```
   build/
   ├── icon.ico   ← Windows图标
   └── icon.icns  ← macOS图标
   ```

4. **重新打包**
   ```bash
   npm run electron:build:win
   npm run electron:build:mac
   ```

## 详细说明

详见 `ICON_GUIDE.md` 或 `QUICK_START.md`

## 当前状态

✅ 配置已准备好，只需要添加图标文件即可。

如果没有图标文件，打包时会使用默认图标（不影响功能）。
