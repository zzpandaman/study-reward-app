# 前后端分离配置指南

## 概述

本项目已支持前后端分离，只需要修改API配置的`baseURL`即可，**无需修改视图层代码**。

## 架构设计

### 设计原则

1. **视图层无需改动**：视图层代码完全不关心是本地调用还是HTTP请求
2. **配置化切换**：通过配置`baseURL`即可切换模式
3. **向后兼容**：默认使用本地模式，保持现有功能不变

### 架构图

```
视图层（View Layer）
  ↓ 调用
兼容层（storage.ts）
  ↓ 调用
API层（API Classes）
  ↓ 通过配置选择
本地模式 ←→ HTTP模式
  ↓              ↓
数据层       HTTP客户端
  ↓              ↓
localStorage 后端服务
```

## 配置方式

### 1. 本地模式（默认）

**当前模式**：API直接调用数据层，所有数据存储在localStorage。

**配置方式：**
```typescript
// src/main.tsx 或 App.tsx
import { configureApi } from './api/config';

// 使用默认配置（本地模式）
// 无需任何配置，默认就是本地模式
```

### 2. HTTP模式（前后端分离）

**模式说明**：API通过HTTP请求调用后端服务。

**配置方式：**

#### 方式1：在入口文件中配置

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { configureApi } from './api/config';
import './index.css';

// 配置API使用HTTP模式
configureApi({
  baseURL: 'http://localhost:8080', // 后端服务地址
  timeout: 30000, // 30秒超时
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 方式2：通过环境变量配置

```typescript
// src/main.tsx
import { configureApi } from './api/config';

// 从环境变量读取配置
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || undefined;

configureApi({
  baseURL: apiBaseURL,
  timeout: 30000,
});
```

**环境变量配置（.env）：**
```env
# 开发环境
VITE_API_BASE_URL=http://localhost:8080

# 生产环境
VITE_API_BASE_URL=https://api.example.com
```

#### 方式3：运行时配置

```typescript
// src/utils/config.ts
import { configureApi } from '../api/config';

// 根据当前环境自动选择
const getApiBaseURL = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8080'; // 开发环境
  }
  return 'https://api.example.com'; // 生产环境
};

configureApi({
  baseURL: getApiBaseURL(),
});
```

## API路径映射

当前API层使用以下路径映射：

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
- `GET /api/user/point-records?type=earn` - 获取积分记录
- `GET /api/user/inventory` - 获取背包物品
- `POST /api/user/exchange` - 兑换商品
- `GET /api/user/custom-style` - 获取自定义样式
- `PUT /api/user/custom-style` - 更新自定义样式

## 后端实现要求

### 响应格式

后端API必须返回以下格式：

**成功响应：**
```json
{
  "success": true,
  "data": {
    // 具体数据
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 请求格式

- **Content-Type**: `application/json`
- **请求体**: JSON格式

### 示例实现（Java Spring Boot）

```java
@RestController
@RequestMapping("/api")
public class TaskTemplateController {
    
    @GetMapping("/task-templates")
    public ApiResponse<GetTaskTemplatesResponse> getTaskTemplates() {
        // 实现逻辑
        return ApiResponse.success(data);
    }
    
    @PostMapping("/task-templates")
    public ApiResponse<CreateTaskTemplateResponse> createTaskTemplate(
        @RequestBody CreateTaskTemplateRequest request
    ) {
        // 实现逻辑
        return ApiResponse.success(data);
    }
}
```

详细接口定义请参考 [API_LAYER.md](./API_LAYER.md)

## 切换步骤

### 从本地模式切换到HTTP模式

1. **配置baseURL**
   ```typescript
   // src/main.tsx
   import { configureApi } from './api/config';
   
   configureApi({
     baseURL: 'http://localhost:8080',
   });
   ```

2. **启动后端服务**
   - 确保后端服务已启动
   - 确保后端服务实现了所有API接口

3. **测试验证**
   - 检查API请求是否正常
   - 验证数据是否正确同步

4. **部署**
   - 更新生产环境配置
   - 部署后端服务

### 从HTTP模式切换回本地模式

1. **移除或注释baseURL配置**
   ```typescript
   // src/main.tsx
   import { configureApi } from './api/config';
   
   // 不配置baseURL，或设置为undefined
   configureApi({
     baseURL: undefined,
   });
   ```

2. **数据迁移（可选）**
   - 如果需要，可以从后端导出数据
   - 导入到localStorage

## 注意事项

### 1. CORS配置

如果前端和后端不在同一域名，需要配置CORS：

**后端配置（Spring Boot示例）：**
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

### 2. 认证授权

如果后端需要认证，可以在HTTP客户端中添加token：

```typescript
// src/api/client.ts（需要扩展）
class HttpClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // 添加认证token
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
}
```

### 3. 错误处理

HTTP模式下，需要处理网络错误：

```typescript
// API客户端已自动处理网络错误
// 返回格式：{ success: false, error: "错误信息" }
```

### 4. 数据同步

- HTTP模式下，数据存储在后端
- 本地模式下，数据存储在localStorage
- 切换模式时，需要手动迁移数据（或通过导入/导出功能）

## 验证配置

### 检查当前模式

```typescript
import { getApiConfig, isHttpMode, isLocalMode } from './api/config';

console.log('API配置:', getApiConfig());
console.log('是否HTTP模式:', isHttpMode());
console.log('是否本地模式:', isLocalMode());
```

### 测试API调用

```typescript
import { TaskTemplateAPI } from './api/task-api';

// 调用API（不需要关心是本地还是HTTP）
const response = TaskTemplateAPI.getTaskTemplates();
if (response.success) {
  console.log('任务模板:', response.data);
}
```

## 总结

✅ **视图层无需修改**：所有视图层代码保持不变  
✅ **配置化切换**：只需修改`baseURL`配置  
✅ **向后兼容**：默认本地模式，保持现有功能  
✅ **类型安全**：TypeScript确保类型一致  
✅ **统一接口**：本地和HTTP使用相同的API接口

通过以上设计，实现前后端分离时，**只需要修改配置，不需要改动视图层代码**。
