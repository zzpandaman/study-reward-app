# 视图层文档

## 概述

视图层负责用户界面的渲染和交互，通过调用API层获取数据，实现用户与应用的交互。视图层突出用户可自定义的内容，提供丰富的个性化选项。

## 目录结构

```
src/
├── components/          # 视图组件
│   ├── TaskManager.tsx # 任务管理组件
│   ├── Shop.tsx        # 商城组件
│   └── Inventory.tsx   # 背包组件
├── App.tsx             # 主应用组件
├── utils/
│   └── theme.ts        # 主题工具
└── App.css             # 应用样式
```

## 用户可自定义内容

### 1. 主题自定义

#### 预设主题

应用提供5种预设主题，用户可随时切换：

- **紫色主题** (`purple`)
- **青色主题** (`cyan`)
- **蓝色主题** (`blue`)
- **绿色主题** (`green`)
- **橙色主题** (`orange`)

#### 主题切换方式

1. 点击右上角主题按钮（🎨图标）
2. 从下拉菜单中选择主题
3. 主题立即生效，并保存到本地

#### 主题存储

- 存储位置：`localStorage` (`study_reward_theme`)
- 持久化：应用重启后保持用户选择

#### 主题配置结构

```typescript
interface ThemeConfig {
  name: string;        // 主题名称
  primary: string;     // 主色
  secondary: string;  // 次色
  gradient: string;   // 渐变背景
}
```

### 2. 自定义样式（CustomStyle）

用户可以通过API自定义以下样式元素：

#### 边框样式

- **borderImage**：自定义边框图片（base64或URL）
- **borderStyle**：边框样式预设名称（如：`rounded`, `sharp`, `dashed`）

#### 鼠标样式

- **cursorImage**：自定义鼠标图标（base64或URL）
- **cursorStyle**：鼠标样式预设名称（如：`pointer`, `crosshair`, `grab`）

#### 背景样式

- **backgroundImage**：自定义背景图片（base64或URL）
- **backgroundStyle**：背景样式预设名称（如：`gradient`, `solid`, `pattern`）

#### 使用方式

```typescript
// 通过API更新自定义样式
UserAPI.updateCustomStyle({
  borderStyle: 'rounded',
  cursorStyle: 'pointer',
  backgroundStyle: 'gradient'
});
```

### 3. 任务模板自定义

#### 预设任务模板

应用提供3种预设任务模板：
- **结构化**：进行结构化学习
- **试讲**：进行试讲练习
- **刷题**：进行题目练习

#### 自定义任务模板

用户可以：
- **创建**：添加自定义任务模板
- **编辑**：修改自定义任务模板（预设模板不可编辑）
- **删除**：删除自定义任务模板（预设模板不可删除）

#### 任务模板字段

- **name**：任务名称
- **description**：任务描述
- **isPreset**：是否为预设（系统自动设置）

### 4. 商品自定义

#### 预设商品

应用提供4种预设商品：
- **黄金1g**：480积分
- **黄金0.1g**：48积分
- **黄金0.01g**：5积分
- **玩手机60分钟**：60积分

#### 自定义商品

用户可以：
- **创建**：添加自定义商品
- **编辑**：修改自定义商品（预设商品不可编辑）
- **删除**：删除自定义商品（预设商品不可删除）

#### 商品字段

- **name**：商品名称
- **description**：商品描述
- **price**：所需积分
- **unit**：单位（如：g、分钟、个）

### 5. 数据管理自定义

#### 数据导出

用户可以导出所有应用数据：
- 格式：JSON文件
- 包含：用户数据、任务模板、商品、任务执行记录
- 用途：备份、迁移、恢复

#### 数据导入

用户可以导入之前导出的数据：
- 格式：JSON文件
- 验证：自动验证数据格式
- 迁移：自动执行数据迁移（如果需要）

## 组件说明

### App.tsx（主应用组件）

**功能：**
- 应用布局和导航
- 主题切换
- 数据导入/导出
- 积分显示

**可自定义部分：**
- 主题选择器
- 数据管理菜单

### TaskManager.tsx（任务管理组件）

**功能：**
- 任务模板选择
- 任务开始/暂停/恢复/完成/取消
- 任务计时显示
- 任务历史记录

**可自定义部分：**
- 任务模板列表（可添加自定义模板）
- 任务显示样式

### Shop.tsx（商城组件）

**功能：**
- 商品展示
- 积分兑换
- 兑换记录

**可自定义部分：**
- 商品列表（可添加自定义商品）
- 兑换数量输入

### Inventory.tsx（背包组件）

**功能：**
- 背包物品展示
- 物品统计

**可自定义部分：**
- 物品显示方式

## 样式自定义

### CSS变量

应用使用CSS变量实现主题切换：

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 主题应用

主题通过JavaScript动态应用到CSS变量：

```typescript
export const applyTheme = (theme: Theme): void => {
  const themeConfig = themes[theme];
  const root = document.documentElement;
  root.style.setProperty('--primary-color', themeConfig.primary);
  root.style.setProperty('--secondary-color', themeConfig.secondary);
  root.style.setProperty('--gradient', themeConfig.gradient);
};
```

## 用户交互流程

### 任务执行流程

```
1. 选择任务模板
   ↓
2. 点击"开始任务"
   ↓
3. 任务计时开始
   ↓
4. 可暂停/恢复（暂停时间不计入学习时间）
   ↓
5. 完成任务获得积分
   ↓
6. 查看任务记录
```

### 商品兑换流程

```
1. 查看可用积分
   ↓
2. 选择商品或输入兑换数量
   ↓
3. 点击"立即兑换"
   ↓
4. 扣除积分，添加到背包
   ↓
5. 查看兑换记录
```

### 数据管理流程

```
1. 点击设置按钮（⚙️图标）
   ↓
2. 选择"导出数据"或"导入数据"
   ↓
3. 导出：下载JSON文件
   导入：选择JSON文件上传
   ↓
4. 数据验证和迁移（导入时）
   ↓
5. 完成
```

## 响应式设计

### 布局适配

- **桌面端**：完整功能展示
- **移动端**：自适应布局（未来支持）

### 交互优化

- **按钮状态**：禁用/启用状态清晰
- **加载状态**：数据加载时显示（未来支持）
- **错误提示**：友好的错误信息展示

## 性能优化

### 数据更新

- **实时更新**：积分等关键数据实时刷新
- **定时刷新**：使用`setInterval`定期更新（1秒）

### 渲染优化

- **组件懒加载**：按需加载组件（未来支持）
- **虚拟滚动**：长列表虚拟滚动（未来支持）

## 可扩展性

### 新增主题

在`src/utils/theme.ts`中添加新主题：

```typescript
export const themes: Record<Theme, ThemeConfig> = {
  // ... 现有主题
  newTheme: {
    name: '新主题',
    primary: '#color1',
    secondary: '#color2',
    gradient: 'linear-gradient(...)',
  },
};
```

### 新增组件

1. 在`src/components/`创建新组件
2. 在`App.tsx`中引入和使用
3. 添加对应的API调用

### 新增自定义选项

1. 在`CustomStyle`类型中添加新字段
2. 在API层添加更新接口
3. 在视图层添加UI控件

## 未来扩展

### 高级自定义

- **CSS编辑器**：允许用户直接编辑CSS
- **组件布局**：允许用户自定义组件布局
- **快捷键配置**：允许用户自定义快捷键

### 主题市场

- **主题分享**：用户可以分享自定义主题
- **主题下载**：用户可以下载其他用户分享的主题

### 插件系统

- **组件插件**：允许第三方开发组件插件
- **功能扩展**：允许通过插件扩展功能

## 总结

视图层提供丰富的用户自定义选项，包括主题、样式、任务模板、商品等。通过API层与数据层解耦，便于维护和扩展。未来可进一步扩展自定义能力，提供更灵活的个性化选项。
