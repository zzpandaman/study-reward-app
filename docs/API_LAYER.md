# 接口层文档

## 概述

接口层提供RESTful风格的API抽象，将业务逻辑与数据存储解耦。便于后续转型为Java Web后端，支持HTTP请求调用。

## 目录结构

```
src/api/
├── types.ts          # API类型定义（请求/响应）
├── task-api.ts       # 任务相关API
├── product-api.ts    # 商品相关API
├── user-api.ts       # 用户数据相关API
└── index.ts          # 统一导出
```

## API设计原则

1. **RESTful风格**：遵循REST设计规范
2. **统一响应格式**：所有API返回统一格式
3. **类型安全**：使用TypeScript确保类型安全
4. **错误处理**：统一的错误响应格式

## 统一响应格式

### 成功响应

```typescript
{
  success: true,
  data: T,  // 具体数据
  message?: string  // 可选消息
}
```

### 错误响应

```typescript
{
  success: false,
  error: string,  // 错误信息
  message?: string  // 可选消息
}
```

## API接口列表

### 任务模板相关

#### 1. 获取所有任务模板

**接口：** `GET /api/task-templates`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/task-templates
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "name": "结构化",
        "description": "进行结构化学习",
        "isPreset": true,
        "createdAt": 1234567890
      }
    ],
    "total": 3
  }
}
```

#### 2. 创建任务模板

**接口：** `POST /api/task-templates`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/task-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新任务",
    "description": "任务描述"
  }'
```

**请求体：**
```json
{
  "name": "新任务",
  "description": "任务描述"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "name": "新任务",
      "description": "任务描述",
      "isPreset": false,
      "createdAt": 1234567890
    }
  }
}
```

#### 3. 更新任务模板

**接口：** `PUT /api/task-templates/:id`

**curl示例：**
```bash
curl -X PUT http://localhost:3000/api/task-templates/1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的任务名",
    "description": "更新后的描述"
  }'
```

**请求体：**
```json
{
  "name": "更新后的任务名",
  "description": "更新后的描述"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "name": "更新后的任务名",
      "description": "更新后的描述",
      "isPreset": false,
      "createdAt": 1234567890
    }
  }
}
```

#### 4. 删除任务模板

**接口：** `DELETE /api/task-templates/:id`

**curl示例：**
```bash
curl -X DELETE http://localhost:3000/api/task-templates/1234567890
```

**响应：**
```json
{
  "success": true,
  "message": "Task template deleted"
}
```

### 任务执行相关

#### 1. 获取所有任务执行记录

**接口：** `GET /api/task-executions`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/task-executions
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1234567890",
        "taskTemplateId": "1",
        "taskName": "结构化",
        "startTime": 1234567890,
        "endTime": 1234568000,
        "totalPausedDuration": 0,
        "actualDuration": 2,
        "actualReward": 2,
        "status": "completed"
      }
    ],
    "total": 1
  }
}
```

#### 2. 开始任务

**接口：** `POST /api/task-executions/start`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/task-executions/start \
  -H "Content-Type: application/json" \
  -d '{
    "taskTemplateId": "1"
  }'
```

**请求体：**
```json
{
  "taskTemplateId": "1"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "taskTemplateId": "1",
      "taskName": "结构化",
      "startTime": 1234567890,
      "totalPausedDuration": 0,
      "actualReward": 0,
      "status": "running"
    }
  }
}
```

#### 3. 暂停任务

**接口：** `POST /api/task-executions/:id/pause`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/task-executions/1234567890/pause
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "status": "paused",
      "pausedTime": 1234567900
    }
  }
}
```

#### 4. 恢复任务

**接口：** `POST /api/task-executions/:id/resume`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/task-executions/1234567890/resume
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "status": "running",
      "totalPausedDuration": 10
    }
  }
}
```

#### 5. 完成任务

**接口：** `POST /api/task-executions/:id/complete`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/task-executions/1234567890/complete
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "endTime": 1234568000,
      "actualDuration": 2,
      "actualReward": 2,
      "status": "completed"
    },
    "reward": 2
  }
}
```

#### 6. 取消任务

**接口：** `POST /api/task-executions/:id/cancel`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/task-executions/1234567890/cancel
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "status": "completed",
      "endTime": 1234568000,
      "actualReward": 0
    }
  }
}
```

### 商品相关

#### 1. 获取所有商品

**接口：** `GET /api/products`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/products
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "name": "黄金1g",
        "description": "兑换1克黄金",
        "price": 480,
        "unit": "g",
        "isPreset": true,
        "createdAt": 1234567890
      }
    ],
    "total": 4
  }
}
```

#### 2. 创建商品

**接口：** `POST /api/products`

**curl示例：**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新商品",
    "description": "商品描述",
    "price": 100,
    "unit": "个"
  }'
```

**请求体：**
```json
{
  "name": "新商品",
  "description": "商品描述",
  "price": 100,
  "unit": "个"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "name": "新商品",
      "description": "商品描述",
      "price": 100,
      "unit": "个",
      "isPreset": false,
      "createdAt": 1234567890
    }
  }
}
```

#### 3. 更新商品

**接口：** `PUT /api/products/:id`

**curl示例：**
```bash
curl -X PUT http://localhost:3000/api/products/1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的商品名",
    "price": 150
  }'
```

**请求体：**
```json
{
  "name": "更新后的商品名",
  "price": 150
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "id": "1234567890",
      "name": "更新后的商品名",
      "price": 150
    }
  }
}
```

#### 4. 删除商品

**接口：** `DELETE /api/products/:id`

**curl示例：**
```bash
curl -X DELETE http://localhost:3000/api/products/1234567890
```

**响应：**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

### 用户数据相关

#### 1. 获取用户数据

**接口：** `GET /api/user/data`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/user/data
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "points": 100,
      "pointRecords": [...],
      "inventory": [...],
      "customStyle": {}
    }
  }
}
```

#### 2. 获取用户积分

**接口：** `GET /api/user/points`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/user/points
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "points": 100
    }
  }
}
```

#### 3. 获取积分记录

**接口：** `GET /api/user/point-records?type=earn`

**curl示例：**
```bash
# 获取所有积分记录
curl -X GET http://localhost:3000/api/user/point-records

# 获取获取积分记录
curl -X GET http://localhost:3000/api/user/point-records?type=earn

# 获取消耗积分记录
curl -X GET http://localhost:3000/api/user/point-records?type=spend
```

**查询参数：**
- `type` (可选): `earn` | `spend`

**响应：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1234567890",
        "type": "earn",
        "amount": 10,
        "description": "完成任务: 结构化 (10分钟)",
        "timestamp": 1234567890,
        "relatedId": "1234567890"
      }
    ],
    "total": 1
  }
}
```

#### 4. 获取背包物品

**接口：** `GET /api/user/inventory`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/user/inventory
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "productId": "gold",
        "productName": "黄金",
        "quantity": 1.5,
        "unit": "g"
      }
    ],
    "total": 1
  }
}
```

#### 5. 兑换商品

**接口：** `POST /api/user/exchange`

**curl示例：**
```bash
# 兑换玩手机时长（60分钟）
curl -X POST http://localhost:3000/api/user/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "phone",
    "quantity": 60
  }'

# 兑换黄金（0.01g单位，100个 = 1g）
curl -X POST http://localhost:3000/api/user/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "gold",
    "quantity": 100
  }'
```

**请求体：**
```json
{
  "productId": "phone",
  "quantity": 60
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "product": {
        "id": "phone",
        "name": "玩手机",
        "price": 1
      },
      "quantity": 60,
      "pointsSpent": 60,
      "remainingPoints": 40
    }
  }
}
```

**错误响应（积分不足）：**
```json
{
  "success": false,
  "error": "积分不足！当前积分: 50，需要: 60"
}
```

#### 6. 更新自定义样式

**接口：** `PUT /api/user/custom-style`

**curl示例：**
```bash
curl -X PUT http://localhost:3000/api/user/custom-style \
  -H "Content-Type: application/json" \
  -d '{
    "borderStyle": "rounded",
    "cursorStyle": "pointer",
    "backgroundStyle": "gradient"
  }'
```

**请求体：**
```json
{
  "borderImage": "data:image/png;base64,...",
  "cursorImage": "data:image/png;base64,...",
  "backgroundImage": "data:image/png;base64,...",
  "borderStyle": "rounded",
  "cursorStyle": "pointer",
  "backgroundStyle": "gradient"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "borderStyle": "rounded",
      "cursorStyle": "pointer",
      "backgroundStyle": "gradient"
    }
  }
}
```

#### 7. 获取自定义样式

**接口：** `GET /api/user/custom-style`

**curl示例：**
```bash
curl -X GET http://localhost:3000/api/user/custom-style
```

**响应：**
```json
{
  "success": true,
  "data": {
    "data": {
      "borderStyle": "rounded",
      "cursorStyle": "pointer",
      "backgroundStyle": "gradient"
    }
  }
}
```

## 错误码说明

### 通用错误

- **400 Bad Request**：请求参数错误
- **404 Not Found**：资源不存在
- **500 Internal Server Error**：服务器内部错误

### 业务错误

- **Task template not found**：任务模板不存在
- **Cannot update preset task template**：不能更新预设任务模板
- **Cannot delete preset task template**：不能删除预设任务模板
- **Task execution not found**：任务执行记录不存在
- **Task is not running**：任务未运行
- **Task is not paused**：任务未暂停
- **一次只能执行一个任务！请先完成当前任务。**：已有任务在运行
- **Product not found**：商品不存在
- **Cannot update preset product**：不能更新预设商品
- **Cannot delete preset product**：不能删除预设商品
- **积分不足！当前积分: X，需要: Y**：积分不足

## 使用示例

### TypeScript/JavaScript调用

```typescript
import { TaskTemplateAPI, TaskExecutionAPI, UserAPI } from './api';

// 获取任务模板
const templates = TaskTemplateAPI.getTaskTemplates();
if (templates.success) {
  console.log(templates.data?.data);
}

// 开始任务
const startResult = TaskExecutionAPI.startTask({
  taskTemplateId: '1'
});
if (startResult.success) {
  console.log('任务已开始:', startResult.data?.data);
}

// 获取用户积分
const points = UserAPI.getPoints();
if (points.success) {
  console.log('当前积分:', points.data?.data.points);
}
```

### HTTP请求调用（未来Java Web实现）

```bash
# 使用fetch API
fetch('http://localhost:3000/api/task-templates', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## 未来扩展

### Java Web实现

接口层设计已考虑Java Web转型：

1. **Controller层**：对应API类（如`TaskTemplateAPI`）
2. **Service层**：业务逻辑处理
3. **Repository层**：数据访问（对应数据层）

### 认证授权

未来可添加：
- JWT Token认证
- 用户权限控制
- API限流

### 数据验证

- 使用Bean Validation（Java）
- 请求参数验证
- 响应数据验证

## 总结

接口层采用RESTful设计，提供统一的API抽象。当前为本地调用，未来可无缝切换为HTTP请求，便于Java Web后端实现。
