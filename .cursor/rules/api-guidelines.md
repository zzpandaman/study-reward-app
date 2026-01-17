# API层开发规范

## API设计原则

### RESTful风格

- ✅ 使用RESTful风格设计API
- ✅ 统一响应格式：`{ success: boolean, data?: T, error?: string }`
- ✅ 路径使用复数形式：`/api/task-templates` 而不是 `/api/task-template`

### API方法规范

所有API方法必须：

1. **异步方法**：所有方法必须是 `async`
2. **返回类型**：返回 `Promise<ApiResponse<T>>`
3. **通过客户端**：使用 `ApiClientFactory.getClient()` 获取客户端

```typescript
// ✅ 正确示例
export class TaskTemplateAPI {
  static async getTaskTemplates(): Promise<ApiResponse<GetTaskTemplatesResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetTaskTemplatesResponse>('/api/task-templates');
  }
}
```

### 类型定义

- ✅ 所有请求/响应类型定义在 `api/types.ts` 中
- ✅ 使用明确的类型名称：`CreateTaskTemplateRequest`、`UpdateTaskTemplateResponse`
- ✅ 导出自定义类型供外部使用

### 错误处理

```typescript
// API类不处理业务错误，由客户端或LocalService处理
// API类只负责调用客户端并返回结果
const client = ApiClientFactory.getClient();
return client.get<ResponseType>('/api/path');
```

## 客户端切换

### LocalClient (本地模式)

- 调用 `LocalService` 实现业务逻辑
- 直接操作 `dataManager`
- 立即返回结果（同步包装为Promise）

### HttpClient (HTTP模式)

- 发送HTTP请求到后端
- 统一的请求格式：JSON body
- 统一的响应格式解析

## 路径映射

### 任务模板

- `GET /api/task-templates` - 获取所有任务模板
- `POST /api/task-templates` - 创建任务模板
- `PUT /api/task-templates/:id` - 更新任务模板
- `DELETE /api/task-templates/:id` - 删除任务模板

### 任务执行

- `GET /api/task-executions` - 获取所有任务执行记录
- `POST /api/task-executions/start` - 开始任务
- `POST /api/task-executions/:id/pause` - 暂停任务
- `POST /api/task-executions/:id/resume` - 恢复任务
- `POST /api/task-executions/:id/complete` - 完成任务
- `POST /api/task-executions/:id/cancel` - 取消任务

### 商品

- `GET /api/products` - 获取所有商品
- `POST /api/products` - 创建商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品

### 用户数据

- `GET /api/user/data` - 获取用户数据
- `GET /api/user/points` - 获取用户积分
- `GET /api/user/point-records` - 获取积分记录
- `GET /api/user/inventory` - 获取背包物品
- `POST /api/user/exchange` - 兑换商品
- `GET /api/user/custom-style` - 获取自定义样式
- `PUT /api/user/custom-style` - 更新自定义样式

## 添加新API步骤

1. 在 `api/types.ts` 中定义请求/响应类型
2. 在对应的API文件中实现方法（通过客户端调用）
3. 在 `LocalService` 中实现本地逻辑（如果适用）
4. 在 `LocalClient` 中添加路径映射
5. 更新文档

## 参考文档

- @docs/API_LAYER.md - API层详细文档
- @docs/FRONTEND_BACKEND_SEPARATION.md - 前后端分离配置指南
