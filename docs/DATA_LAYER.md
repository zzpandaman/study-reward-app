# 数据层文档

## 概述

数据层负责应用数据的存储、版本管理、数据迁移和验证。采用适配器模式设计，支持从localStorage平滑迁移到MySQL等数据库。

## 目录结构

```
src/data/
├── storage-adapter.ts    # 存储适配器接口和实现
└── data-manager.ts       # 数据管理器（版本管理、迁移）
```

## 数据结构

### 核心数据结构

#### AppData（应用数据）
```typescript
interface AppData {
  version: DataVersion;           // 版本信息
  userData: UserData;             // 用户数据
  taskTemplates: TaskTemplate[];  // 任务模板列表
  products: Product[];             // 商品列表
  taskExecutions: TaskExecution[]; // 任务执行记录
}
```

#### DataVersion（版本信息）
```typescript
interface DataVersion {
  version: string;        // 应用版本号（如：1.1.0）
  schemaVersion: number;  // 数据结构版本（如：2）
  createdAt: number;     // 创建时间戳
  updatedAt: number;      // 更新时间戳
}
```

#### UserData（用户数据）
```typescript
interface UserData {
  points: number;              // 总积分
  pointRecords: PointRecord[];  // 积分记录（最多保留1000条）
  inventory: InventoryItem[];  // 背包物品
  customStyle?: CustomStyle;   // 自定义样式
}
```

#### TaskTemplate（任务模板）
```typescript
interface TaskTemplate {
  id: string;           // 唯一标识
  name: string;         // 任务名称
  description: string;  // 任务描述
  isPreset: boolean;   // 是否为预设任务
  createdAt?: number;   // 创建时间
}
```

#### Product（商品）
```typescript
interface Product {
  id: string;           // 唯一标识
  name: string;         // 商品名称
  description: string;  // 商品描述
  price: number;        // 所需积分
  unit?: string;        // 单位（如：g、分钟）
  isPreset: boolean;    // 是否为预设商品
  createdAt?: number;   // 创建时间
}
```

#### TaskExecution（任务执行记录）
```typescript
interface TaskExecution {
  id: string;                    // 唯一标识
  taskTemplateId: string;         // 对应的任务模板ID
  taskName: string;              // 任务名称（快照）
  startTime: number;            // 开始时间戳
  endTime?: number;             // 结束时间戳
  pausedTime?: number;           // 暂停时间戳
  totalPausedDuration: number;   // 总暂停时长（秒）
  actualDuration?: number;       // 实际时长（分钟）
  actualReward: number;         // 实际获得积分
  status: 'running' | 'paused' | 'completed';
}
```

#### PointRecord（积分记录）
```typescript
interface PointRecord {
  id: string;           // 唯一标识
  type: 'earn' | 'spend'; // 类型：获取/消耗
  amount: number;        // 积分数量
  description: string;  // 描述
  timestamp: number;     // 时间戳
  relatedId?: string;   // 关联ID（任务ID或商品ID）
}
```

#### InventoryItem（背包物品）
```typescript
interface InventoryItem {
  productId: string;    // 商品ID
  productName: string;  // 商品名称
  quantity: number;     // 数量
  unit?: string;        // 单位
}
```

#### CustomStyle（自定义样式）
```typescript
interface CustomStyle {
  borderImage?: string;      // 边框图片URL
  cursorImage?: string;       // 鼠标图标URL
  backgroundImage?: string;   // 背景图片URL
  borderStyle?: string;       // 边框样式预设名称
  cursorStyle?: string;       // 鼠标样式预设名称
  backgroundStyle?: string;  // 背景样式预设名称
}
```

## 存储位置

### 当前实现（LocalStorage）

**存储键名：**
- 主数据：`study_reward_app_data`
- 备份数据：`study_reward_app_data_backup`

**存储位置：**
- **Web版本**：浏览器LocalStorage
- **Electron版本**：应用数据目录的LocalStorage

**数据格式：**
- JSON字符串，包含完整的AppData对象

### 未来实现（MySQL）

**表结构设计：**

```sql
-- 用户表
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  points INT DEFAULT 0,
  custom_style JSON,
  created_at BIGINT,
  updated_at BIGINT
);

-- 任务模板表
CREATE TABLE task_templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_preset BOOLEAN DEFAULT FALSE,
  created_at BIGINT
);

-- 商品表
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  unit VARCHAR(50),
  is_preset BOOLEAN DEFAULT FALSE,
  created_at BIGINT
);

-- 任务执行记录表
CREATE TABLE task_executions (
  id VARCHAR(255) PRIMARY KEY,
  task_template_id VARCHAR(255),
  task_name VARCHAR(255),
  start_time BIGINT,
  end_time BIGINT,
  paused_time BIGINT,
  total_paused_duration INT DEFAULT 0,
  actual_duration INT,
  actual_reward INT DEFAULT 0,
  status VARCHAR(50),
  created_at BIGINT
);

-- 积分记录表
CREATE TABLE point_records (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  type VARCHAR(50),
  amount INT,
  description TEXT,
  timestamp BIGINT,
  related_id VARCHAR(255),
  created_at BIGINT
);

-- 背包物品表
CREATE TABLE inventory_items (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  product_id VARCHAR(255),
  product_name VARCHAR(255),
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  created_at BIGINT
);
```

## 版本管理

### 版本号规则

- **应用版本（version）**：遵循语义化版本（如：1.1.0）
- **数据结构版本（schemaVersion）**：整数递增（当前为2）

### 版本迁移策略

#### Schema v1 -> v2 迁移

1. **添加字段**：
   - `TaskTemplate.createdAt`
   - `Product.createdAt`
   - `UserData.customStyle`

2. **字段默认值**：
   - `isPreset`：根据预设列表自动判断
   - `createdAt`：使用当前时间戳

3. **数据验证**：
   - 确保所有必需字段存在
   - 验证数组类型正确性

### 迁移流程

```
1. 读取现有数据
2. 检查schemaVersion
3. 如果版本低于当前版本，执行迁移
4. 更新版本信息
5. 保存迁移后的数据
```

## 老用户数据迁移保证

### 迁移机制

#### 1. 自动检测旧版本数据

系统启动时自动检测以下旧版本存储键：
- `study_reward_user_data`
- `study_reward_task_executions`
- `study_reward_products`
- `study_reward_tasks`

#### 2. 数据迁移步骤

1. **读取旧数据**：从各个旧键读取数据
2. **数据转换**：将旧格式转换为新格式
3. **合并数据**：
   - 用户数据：直接迁移
   - 任务执行记录：完整迁移
   - 任务模板：合并预设和自定义
   - 商品：合并预设和自定义
4. **保存新数据**：写入统一存储键
5. **保留旧数据**：暂时保留旧数据（可选清理）

#### 3. 数据完整性保证

- **备份机制**：每次写入前自动备份
- **回滚支持**：可以从备份恢复数据
- **验证机制**：写入前验证数据完整性
- **错误处理**：迁移失败时保留原数据

#### 4. 向后兼容

- 保留旧版本存储键一段时间
- 提供数据导出/导入功能
- 支持手动迁移

### 迁移示例

```typescript
// 旧版本数据格式
{
  points: 100,
  pointRecords: [...],
  inventory: [...]
}

// 迁移到新版本
{
  version: {
    version: '1.1.0',
    schemaVersion: 2,
    createdAt: 1234567890,
    updatedAt: 1234567890
  },
  userData: {
    points: 100,
    pointRecords: [...],
    inventory: [...],
    customStyle: {}
  },
  taskTemplates: [...],
  products: [...],
  taskExecutions: [...]
}
```

## 数据验证

### 验证规则

1. **必需字段检查**：
   - `version` 必须存在
   - `userData` 必须存在
   - 数组字段必须是数组类型

2. **数据范围检查**：
   - 积分不能为负数（业务层控制）
   - 时间戳必须有效

3. **数据一致性检查**：
   - 任务执行记录中的`taskTemplateId`必须存在于任务模板中
   - 背包物品中的`productId`必须存在于商品列表中

## 数据导出/导入

### 导出格式

```json
{
  "version": "1.1.0",
  "exportTime": 1234567890,
  "data": {
    "version": {...},
    "userData": {...},
    "taskTemplates": [...],
    "products": [...],
    "taskExecutions": [...]
  }
}
```

### 导入验证

1. 检查JSON格式有效性
2. 验证必需字段存在
3. 验证数据类型正确
4. 执行数据迁移（如果需要）

## 性能优化

### 数据量控制

- **积分记录**：最多保留1000条，超出自动删除最旧的
- **任务执行记录**：建议定期清理已完成的历史记录

### 存储优化

- 使用JSON压缩（可选）
- 定期清理备份数据
- 考虑数据分页加载（未来MySQL实现）

## 安全考虑

### 数据保护

1. **备份机制**：每次写入前自动备份
2. **数据加密**：敏感数据可考虑加密存储（未来）
3. **访问控制**：API层控制数据访问权限

### 数据恢复

- 支持从备份恢复
- 支持数据导入恢复
- 提供数据导出功能

## 未来扩展

### MySQL迁移

1. **适配器切换**：实现`MySQLStorageAdapter`
2. **数据同步**：首次启动时从localStorage迁移到MySQL
3. **双写模式**：过渡期支持双写（可选）

### 数据同步

- 支持多设备数据同步（未来）
- 支持云端备份（未来）

## 总结

数据层采用适配器模式，支持灵活的存储后端切换。通过版本管理和自动迁移机制，确保老用户数据不丢失。当前使用LocalStorage，未来可平滑迁移到MySQL等数据库。
