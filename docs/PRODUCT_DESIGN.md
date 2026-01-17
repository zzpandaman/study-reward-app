# 📚 学习奖励小程序 - 产品设计文档

## 版本信息
- **版本**: v1.0.0
- **最后更新**: 2024-01-17
- **目标平台**: 桌面应用（已完成）→ 微信小程序（计划中）

---

## 一、产品概述

### 1.1 产品定位
一个监督学习的奖励系统，通过完成任务获得积分，用积分兑换奖励物资，帮助用户建立学习习惯和激励机制。

### 1.2 核心价值
- ✅ **任务管理**：预设任务类型，自由执行时长
- ⏱️ **计时功能**：实时计时，支持暂停/继续
- 🎁 **积分奖励**：完成任务获得积分
- 🛒 **积分商城**：自由兑换黄金和玩手机时长
- 💾 **本地存储**：数据保存在本地，保护隐私
- 🎨 **主题切换**：5种主题颜色可选

---

## 二、功能清单

### 2.1 学习任务模块

#### 2.1.1 任务类型（预设）
- **结构化**：进行结构化学习
- **试讲**：进行试讲练习
- **刷题**：进行题目练习

**特性**：
- 三种任务类型固定，不可用户自定义
- 所有任务奖励一致：**1积分/分钟**

#### 2.1.2 任务执行
- **开始任务**：选择任务类型，无需预设时长
- **实时计时**：显示已学习时长（格式：MM:SS）
- **暂停功能**：可以暂停任务（如厕等），暂停时间不计入学习时间
- **继续任务**：从暂停点继续
- **完成任务**：点击完成任务，按实际学习时长结算积分
- **取消任务**：取消任务不获得积分

**规则**：
- 一次只能执行一个任务
- 计时基于实际时间，不包括暂停时间
- 完成任务时按分钟结算：`积分 = 学习分钟数 × 1`

#### 2.1.3 任务记录
- 显示已完成任务列表
- 记录内容：任务名称、开始时间、学习时长、获得积分
- 按完成时间倒序排列

### 2.2 积分商城模块

#### 2.2.1 商品类型
1. **黄金兑换**（自由兑换）
   - 最小单位：0.01g
   - 兑换比例：1g = 480积分（8小时学习）
   - 输入方式：输入整数个0.01g单位（输入1=0.01g，输入100=1g）
   - 积分计算：`积分 = 克数 × 480`

2. **玩手机时长兑换**（自由兑换）
   - 最小单位：1分钟
   - 兑换比例：1分钟学习 = 1分钟玩手机（比例1:1）
   - 输入方式：输入整数分钟
   - 积分计算：`积分 = 分钟数 × 1`

#### 2.2.2 兑换记录
- 显示所有积分消耗记录
- 记录内容：商品名称、兑换时间、消耗积分

### 2.3 背包模块

#### 2.3.1 统计总览
- **总黄金**：统计所有兑换的黄金总量（单位：g）
- **玩手机时长**：统计所有兑换的玩手机时长（单位：分钟）

#### 2.3.2 物品列表
- 显示所有兑换的物品及数量
- 按物品类型分组显示

### 2.4 积分系统

#### 2.4.1 积分获取
- **任务完成**：完成任务获得积分
- **计算公式**：`积分 = 学习分钟数 × 1`
- **记录类型**：`earn`（获取）

#### 2.4.2 积分消耗
- **商城兑换**：兑换商品消耗积分
- **记录类型**：`spend`（消耗）

#### 2.4.3 积分记录
- 显示所有积分变化记录（获取/消耗）
- 记录内容：类型、数量、描述、时间
- 按时间倒序排列

### 2.5 主题系统

#### 2.5.1 主题颜色
- **紫色**（默认）：`#667eea` → `#764ba2`
- **青色**：`#06b6d4` → `#0891b2`
- **蓝色**：`#3b82f6` → `#2563eb`
- **绿色**：`#10b981` → `#059669`
- **橙色**：`#f97316` → `#ea580c`

#### 2.5.2 主题应用
- 应用到：按钮、徽章、进度条、背景等
- 实时切换，无需刷新
- 主题设置自动保存

### 2.6 数据管理

#### 2.6.1 数据导出
- 导出所有数据为JSON格式
- 包含：用户数据、积分记录、任务记录

#### 2.6.2 数据导入
- 从JSON文件导入数据
- 用于数据备份和迁移

---

## 三、数据结构

### 3.1 任务模板（TaskTemplate）
```typescript
interface TaskTemplate {
  id: string;           // 模板ID
  name: string;         // 任务名称
  description: string;  // 任务描述
}

// 预设任务模板
const PRESET_TASK_TEMPLATES: TaskTemplate[] = [
  { id: '1', name: '结构化', description: '进行结构化学习' },
  { id: '2', name: '试讲', description: '进行试讲练习' },
  { id: '3', name: '刷题', description: '进行题目练习' },
];
```

### 3.2 任务执行记录（TaskExecution）
```typescript
interface TaskExecution {
  id: string;                      // 执行ID
  taskTemplateId: string;          // 对应的任务模板ID
  taskName: string;                // 任务名称（快照）
  startTime: number;               // 开始时间戳
  endTime?: number;                // 结束时间戳
  pausedTime?: number;             // 暂停时间戳
  totalPausedDuration: number;     // 总暂停时长（秒）
  actualDuration?: number;         // 实际时长（分钟）- 纯学习时间
  actualReward: number;            // 实际获得积分
  status: 'running' | 'paused' | 'completed';  // 状态
}
```

### 3.3 积分记录（PointRecord）
```typescript
interface PointRecord {
  id: string;           // 记录ID
  type: 'earn' | 'spend';  // 类型：获取/消耗
  amount: number;       // 积分数量
  description: string;  // 描述
  timestamp: number;    // 时间戳
  relatedId?: string;   // 关联ID（任务ID或商品ID）
}
```

### 3.4 背包物品（InventoryItem）
```typescript
interface InventoryItem {
  productId: string;    // 商品ID
  productName: string;  // 商品名称
  quantity: number;     // 数量
  unit?: string;        // 单位（g、分钟）
}
```

### 3.5 用户数据（UserData）
```typescript
interface UserData {
  points: number;              // 总积分
  pointRecords: PointRecord[]; // 积分记录
  inventory: InventoryItem[];  // 背包物品
}
```

### 3.6 导出数据格式（ExportData）
```typescript
interface ExportData {
  version: string;            // 版本号
  exportTime: number;         // 导出时间戳
  userData: UserData;         // 用户数据
  taskExecutions: TaskExecution[];  // 任务执行记录
}
```

---

## 四、核心业务逻辑

### 4.1 任务执行流程

```
1. 用户选择任务类型
   ↓
2. 点击"开始任务"
   ↓
3. 创建TaskExecution记录
   - startTime = 当前时间
   - status = 'running'
   - totalPausedDuration = 0
   ↓
4. 开始计时（每秒更新elapsedSeconds）
   - 基于：startTime + totalPausedDuration
   - 实时计算：now - (startTime + totalPausedDuration)
   ↓
5. 用户操作（暂停/继续/完成）
   ├─ 暂停：status = 'paused', pausedTime = 当前时间
   ├─ 继续：status = 'running', 更新totalPausedDuration
   └─ 完成：计算实际时长和积分
   ↓
6. 完成任务
   - actualDuration = Math.floor(actualSeconds / 60)
   - actualReward = actualDuration × 1
   - status = 'completed'
   - 添加积分记录
```

### 4.2 积分计算规则

**任务完成**：
```
学习分钟数 = Math.floor(学习秒数 / 60)
积分 = 学习分钟数 × 1
```

**黄金兑换**：
```
兑换积分 = 克数 × 480
例如：0.01g = 4.8积分（四舍五入为5积分）
```

**玩手机时长兑换**：
```
兑换积分 = 分钟数 × 1
例如：60分钟 = 60积分
```

### 4.3 时间计算规则

**纯学习时间**：
```
学习时间 = 当前时间 - (开始时间 + 总暂停时长)
```

**暂停时间**：
```
暂停时长 = 继续时间 - 暂停时间
总暂停时长 = 累计所有暂停时长
```

---

## 五、存储接口

### 5.1 任务执行记录存储
- **获取**：`taskExecutionStorage.get()` → `TaskExecution[]`
- **保存**：`taskExecutionStorage.save(executions)`
- **添加**：`taskExecutionStorage.add(execution)`
- **更新**：`taskExecutionStorage.update(execution)`

### 5.2 用户数据存储
- **获取**：`userDataStorage.get()` → `UserData`
- **保存**：`userDataStorage.save(userData)`
- **添加积分记录**：`userDataStorage.addPointRecord(record)`
- **添加背包物品**：`userDataStorage.addInventoryItem(...)`

### 5.3 数据导出/导入
- **导出**：`exportData()` → `string` (JSON)
- **导入**：`importData(jsonData)` → `{success: boolean, message: string}`

### 5.4 主题存储
- **获取**：`themeStorage.get()` → `Theme`
- **保存**：`themeStorage.save(theme)`
- **应用**：`applyTheme(theme)` → 更新CSS变量

---

## 六、UI组件结构

### 6.1 主应用（App）
- **顶部导航**：标题、积分显示、主题选择、数据管理
- **标签页**：学习任务、积分商城、背包
- **主内容区**：根据当前标签显示对应组件

### 6.2 任务管理组件（TaskManager）
- **任务选择区**：显示三个预设任务卡片
- **任务执行区**：显示计时器、操作按钮
- **任务记录区**：显示已完成任务列表

### 6.3 商城组件（Shop）
- **头部**：标题、当前积分
- **兑换区**：黄金兑换、玩手机时长兑换（两个卡片）
- **兑换记录区**：显示积分消耗记录

### 6.4 背包组件（Inventory）
- **统计总览**：总黄金、玩手机时长
- **物品列表**：显示所有物品及数量

---

## 七、样式规范

### 7.1 颜色系统（CSS变量）
```css
:root {
  --primary-color: #667eea;      /* 主题主色 */
  --secondary-color: #764ba2;    /* 主题次色 */
  --gradient: linear-gradient(...); /* 渐变背景 */
}
```

### 7.2 主题颜色映射
```typescript
const themes = {
  purple: { primary: '#667eea', secondary: '#764ba2', ... },
  cyan: { primary: '#06b6d4', secondary: '#0891b2', ... },
  blue: { primary: '#3b82f6', secondary: '#2563eb', ... },
  green: { primary: '#10b981', secondary: '#059669', ... },
  orange: { primary: '#f97316', secondary: '#ea580c', ... },
};
```

### 7.3 样式应用
- **背景**：使用 `var(--gradient)`
- **按钮**：使用 `var(--primary-color)`
- **徽章**：使用 `var(--gradient)`
- **边框**：使用 `var(--primary-color)`

---

## 八、已知问题与修复

### 8.1 已修复问题
1. ✅ **计时显示问题**：改为基于实际时间计算，而不是累加
2. ✅ **主题背景问题**：背景颜色使用CSS变量，支持主题切换

### 8.2 待解决问题
- 无

---

## 九、迁移到微信小程序注意事项

### 9.1 存储API转换
- `localStorage` → `wx.setStorageSync() / wx.getStorageSync()`
- 异步存储：`wx.setStorage() / wx.getStorage()`

### 9.2 样式单位转换
- `px` → `rpx`（响应式单位）
- 参考比例：`1rpx = 屏幕宽度/750px`

### 9.3 组件转换
- `React组件` → `Taro组件` 或 `小程序原生组件`
- `React Hooks` → `Taro Hooks` 或小程序生命周期

### 9.4 计时器处理
- `setInterval` → `wx.setInterval` 或小程序定时器
- 页面隐藏时暂停计时，显示时恢复

### 9.5 主题系统
- CSS变量 → 小程序动态样式（`style="{{theme}}"`）
- 或使用小程序主题配置文件

---

## 十、版本迭代计划

### v1.1.0（计划中）
- [ ] 微信小程序版本
- [ ] 主题背景修复 ✅
- [ ] 计时显示修复 ✅

### v1.2.0（未来）
- [ ] 监督功能（摄像头检测/页面保持）
- [ ] 数据云同步
- [ ] 统计分析功能

---

## 附录

### A. 文件结构
```
src/
├── components/          # React组件
│   ├── TaskManager.tsx  # 任务管理
│   ├── Shop.tsx         # 商城
│   └── Inventory.tsx    # 背包
├── utils/               # 工具函数
│   ├── storage.ts       # 存储接口
│   └── theme.ts         # 主题管理
├── types.ts             # 类型定义
└── App.tsx              # 主应用
```

### B. 关键函数
- `calculateReward(minutes)` - 计算积分奖励
- `formatTime(seconds)` - 格式化时间显示
- `applyTheme(theme)` - 应用主题

### C. 常量定义
- `POINTS_PER_MINUTE = 1` - 每分钟积分
- `GOLD_PRICE_PER_GRAM = 480` - 每克黄金积分
- `PRESET_TASK_TEMPLATES` - 预设任务模板

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-17  
**维护者**: 开发团队
