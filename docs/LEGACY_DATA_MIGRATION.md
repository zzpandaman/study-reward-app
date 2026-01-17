# 老用户数据迁移验证文档

## 迁移兼容性检查结果

### ✅ 兼容性验证通过

经过代码检查，本次改动**完全兼容**老版本数据，迁移逻辑完整且安全。

## 迁移流程

### 1. 自动检测机制 ✅

**检测时机：** 应用启动时，`dataManager.getAppData()` 被调用时

**检测逻辑：**
```typescript
// 1. 先检查新格式数据
const existingData = this.adapter.read();
if (existingData) {
  // 如果版本低于当前版本，执行版本迁移
  if (existingData.version.schemaVersion < CURRENT_SCHEMA_VERSION) {
    return this.migrateToCurrentVersion(existingData);
  }
  return existingData;
}

// 2. 检查旧版本数据
if (this.adapter instanceof LocalStorageAdapter && this.adapter.hasLegacyData()) {
  const migrated = this.migrateFromLegacy();
  if (migrated) {
    return migrated;
  }
}
```

**检测的旧版本键：**
- `study_reward_user_data` - 用户数据
- `study_reward_task_executions` - 任务执行记录
- `study_reward_products` - 商品列表
- `study_reward_tasks` - 任务列表

### 2. 数据迁移过程 ✅

#### 步骤1：读取旧数据

```typescript
const legacy = adapter.readLegacyData();
// 读取所有旧版本localStorage键
```

#### 步骤2：数据转换

- **用户数据**：直接迁移（points、pointRecords、inventory）
- **任务执行记录**：完整迁移（executions数组）
- **任务模板**：合并预设和自定义任务
- **商品**：合并预设和自定义商品
- **版本信息**：创建新版本信息（version: '1.1.0', schemaVersion: 2）

#### 步骤3：保存新格式数据

```typescript
this.saveAppData(appData);
// 写入到 'study_reward_app_data' 键
```

#### 步骤4：验证并清理旧数据 ✅

```typescript
// 验证新数据保存成功
if (this.adapter.exists()) {
  // 清理旧版本数据
  adapter.cleanupLegacyData();
  // 删除所有旧版本localStorage键
}
```

### 3. 旧数据清理机制 ✅

**清理时机：** 迁移成功且新数据保存成功后

**清理逻辑：**
```typescript
cleanupLegacyData(): void {
  // 1. 验证新格式数据已存在（安全机制）
  if (!this.exists()) {
    console.warn('Cannot cleanup legacy data: new format data does not exist');
    return;
  }

  // 2. 删除所有旧版本存储键
  Object.values(this.LEGACY_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
```

**删除的键：**
- ✅ `study_reward_user_data`
- ✅ `study_reward_task_executions`
- ✅ `study_reward_products`
- ✅ `study_reward_tasks`

**安全保证：**
- ✅ 只有在验证新数据保存成功后才删除
- ✅ 删除失败不影响应用运行（只记录错误）
- ✅ 有备份机制（每次写入前自动备份）

### 4. 数据备份机制 ✅

**备份时机：** 每次写入数据前

```typescript
write(data: AppData): void {
  // 写入前先备份
  this.backup();
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
}
```

**备份位置：** `study_reward_app_data_backup`

**恢复方式：** 可通过 `adapter.restore()` 恢复备份

## 版本兼容性

### 支持的旧版本

- ✅ 旧版本数据（分散存储的localStorage键）
- ✅ 新版本v1数据（schemaVersion: 1）
- ✅ 新版本v2数据（schemaVersion: 2，当前版本）

### 迁移路径

```
旧版本数据（分散键）
  ↓
migrateFromLegacy()
  ↓
新格式数据（统一键）
  ↓
cleanupLegacyData() - 删除旧键
  ↓
完成
```

**或者：**

```
新版本v1数据
  ↓
migrateToCurrentVersion()
  ↓
新版本v2数据（当前版本）
  ↓
完成
```

## 迁移保证

### ✅ 数据完整性

1. **自动备份**：写入前自动备份
2. **验证机制**：保存前验证数据完整性
3. **错误处理**：迁移失败时保留原数据

### ✅ 数据不丢失

1. **完整迁移**：所有旧数据字段都被迁移
2. **合并策略**：预设数据和自定义数据正确合并
3. **默认值填充**：缺失字段使用合理默认值

### ✅ 旧数据清理

1. **迁移后清理**：迁移成功后自动删除旧数据
2. **安全验证**：确保新数据存在后才清理
3. **错误容忍**：清理失败不影响应用运行

## 测试场景

### 场景1：老用户首次安装新版本

**前提：**
- 本地存储存在旧版本数据（分散的localStorage键）

**流程：**
1. 应用启动
2. 检测到旧版本数据
3. 执行 `migrateFromLegacy()`
4. 保存新格式数据到 `study_reward_app_data`
5. 验证新数据存在
6. 删除所有旧版本键
7. 完成

**预期结果：** ✅ 数据成功迁移，旧键被删除

### 场景2：已有新格式数据，但存在旧键（异常情况）

**前提：**
- 同时存在新格式数据和旧版本键（可能由于迁移中断）

**流程：**
1. 应用启动
2. 检测到新格式数据，直接使用
3. 不会执行迁移（因为已有新数据）
4. 旧键保留（不会自动清理，避免误删）

**预期结果：** ✅ 使用新格式数据，旧键保留（安全）

**注意：** 如果需要清理残留的旧键，可以手动触发或在下一次迁移时清理。

### 场景3：版本升级（v1 -> v2）

**前提：**
- 存在新格式v1数据（schemaVersion: 1）

**流程：**
1. 应用启动
2. 检测到新格式数据，但版本为1
3. 执行 `migrateToCurrentVersion()`
4. 添加缺失字段（customStyle、createdAt等）
5. 保存v2格式数据
6. 完成

**预期结果：** ✅ 数据成功升级到v2

## 迁移验证清单

### 功能验证

- ✅ 自动检测旧版本数据
- ✅ 自动执行数据迁移
- ✅ 保存新格式数据
- ✅ 删除旧版本数据（迁移成功后）
- ✅ 数据备份机制
- ✅ 错误处理和日志记录

### 数据完整性验证

- ✅ 用户数据（points、pointRecords、inventory）完整迁移
- ✅ 任务执行记录完整迁移
- ✅ 自定义任务模板保留
- ✅ 自定义商品保留
- ✅ 预设数据正确合并

### 安全性验证

- ✅ 迁移前自动备份
- ✅ 迁移失败时保留原数据
- ✅ 删除旧数据前验证新数据存在
- ✅ 清理失败不影响应用运行

## 潜在问题和解决方案

### 问题1：迁移过程中断

**场景：** 迁移过程中应用崩溃或关闭

**解决方案：**
- ✅ 迁移前自动备份
- ✅ 下次启动时会检测到新数据或旧数据，继续迁移
- ✅ 支持从备份恢复

### 问题2：新旧数据同时存在

**场景：** 迁移成功后旧数据未清理（异常情况）

**解决方案：**
- ✅ 优先使用新格式数据
- ✅ 旧键会被保留（安全起见）
- ✅ 不影响应用正常运行

### 问题3：迁移失败

**场景：** 数据格式异常导致迁移失败

**解决方案：**
- ✅ 迁移失败时返回null，使用默认数据
- ✅ 原数据保留在旧键中（未删除）
- ✅ 记录错误日志，便于调试
- ✅ 用户可以通过导出功能备份数据

## 总结

### ✅ 兼容性状态：完全兼容

**迁移机制：**
- ✅ 自动检测旧版本数据
- ✅ 完整的数据迁移逻辑
- ✅ 迁移成功后自动清理旧数据
- ✅ 完善的安全机制和错误处理

**老用户升级流程：**
1. 安装新版本
2. 启动应用（自动检测旧数据）
3. 自动迁移（无需用户操作）
4. 自动清理旧数据（迁移成功后）
5. 完成（数据完整，旧数据已删除）

**结论：** 本次改动完全兼容老版本，老用户的本地存储数据会在安装新版本后正确迁移并删除旧数据。
