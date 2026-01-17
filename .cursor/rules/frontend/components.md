# 前端组件开发规范

## 组件结构

### 组件位置

- ✅ 所有React组件放在 `src/components/` 目录
- ✅ 组件文件命名：PascalCase（如：`TaskManager.tsx`）
- ✅ 样式文件：与组件同名（如：`TaskManager.css`）

### 组件类型

```typescript
// ✅ 使用函数组件
import React from 'react';

const TaskManager: React.FC = () => {
  // 组件实现
};

export default TaskManager;
```

## 数据获取

### 通过兼容层

```typescript
// ✅ 推荐：通过storage.ts兼容层
import { taskTemplateStorage } from '../utils/storage';

const templates = taskTemplateStorage.get();
```

### 直接调用API

```typescript
// ✅ 也可以：直接调用API层
import { TaskTemplateAPI } from '../api';

useEffect(() => {
  const loadData = async () => {
    const response = await TaskTemplateAPI.getTaskTemplates();
    if (response.success) {
      setTemplates(response.data?.data || []);
    }
  };
  loadData();
}, []);
```

### ❌ 禁止直接调用数据层

```typescript
// ❌ 错误：组件直接调用数据层
import { dataManager } from '../data/data-manager';

const appData = dataManager.getAppData(); // 不允许！
```

## 样式规范

### CSS文件

- ✅ 使用独立的CSS文件（如：`TaskManager.css`）
- ✅ 使用CSS变量实现主题切换
- ✅ 遵循BEM命名规范（可选）

### 主题变量

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 状态管理

### 本地状态

```typescript
// ✅ 使用useState管理本地状态
const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'inventory'>('tasks');
```

### 副作用处理

```typescript
// ✅ 使用useEffect处理副作用
useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 1000);
  return () => clearInterval(interval);
}, []);
```

## 用户交互

### 事件处理

```typescript
// ✅ 事件处理函数
const handleClick = () => {
  // 处理逻辑
};

return (
  <button onClick={handleClick}>点击</button>
);
```

### 异步操作

```typescript
// ✅ 异步操作使用async/await
const handleSubmit = async () => {
  const response = await TaskTemplateAPI.createTaskTemplate(request);
  if (response.success) {
    // 处理成功
  }
};
```

## 可自定义内容

### 主题切换

- ✅ 支持5种预设主题
- ✅ 可通过API自定义样式（CustomStyle）

### 任务模板

- ✅ 支持自定义任务模板
- ✅ 预设模板不可编辑/删除

### 商品

- ✅ 支持自定义商品
- ✅ 预设商品不可编辑/删除

## 组件命名

### 组件文件

- ✅ PascalCase：`TaskManager.tsx`
- ✅ 与组件名一致

### CSS类名

- ✅ kebab-case：`task-manager`
- ✅ 与组件名对应：`.task-manager { }`

## 参考文档

- @docs/VIEW_LAYER.md - 视图层详细文档
