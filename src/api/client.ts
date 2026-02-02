/**
 * API客户端抽象层
 * 支持本地调用和HTTP请求两种模式
 * 通过配置可以轻松切换，实现前后端分离
 */
import { ApiResponse } from './types';

export interface ApiClientConfig {
  baseURL?: string; // HTTP请求的基础URL，如果为空则使用本地模式
  timeout?: number; // 请求超时时间（毫秒）
  token?: string;   // JWT Token（HTTP模式需要）
}

// Token 存储 key
const TOKEN_STORAGE_KEY = 'star_sso_token';

/**
 * 获取 JWT Token
 * 优先从配置获取，其次从 localStorage 获取
 */
function getToken(configToken?: string): string | null {
  if (configToken) return configToken;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * 设置 JWT Token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

/**
 * 清除 JWT Token
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * API客户端接口
 */
export interface IApiClient {
  get<T>(path: string): Promise<ApiResponse<T>>;
  post<T>(path: string, data?: any): Promise<ApiResponse<T>>;
  put<T>(path: string, data?: any): Promise<ApiResponse<T>>;
  delete<T>(path: string): Promise<ApiResponse<T>>;
}

/**
 * HTTP客户端实现（用于前后端分离）
 */
class HttpClient implements IApiClient {
  constructor(private config: ApiClientConfig) {}

  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    // 去掉 /api 前缀，因为 baseURL 已经包含了完整路径
    // LocalClient 使用 /api/xxx，HttpClient 使用 /xxx
    const apiPath = path.replace(/^\/api/, '');
    const url = `${this.config.baseURL}${apiPath}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加 JWT Token
    const token = getToken(this.config.token);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      signal: this.config.timeout
        ? AbortSignal.timeout(this.config.timeout)
        : undefined,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      // 处理 401 未授权
      if (response.status === 401) {
        clearToken();
        return {
          success: false,
          error: '登录已过期，请重新登录',
        };
      }

      const result = await response.json();
      
      // 转换后端响应格式为 ApiResponse
      // 后端返回 { code, message, data }，前端期望 { success, data, error }
      if (result.code !== undefined) {
        return {
          success: result.code === 200,
          data: result.data,
          message: result.message,
          error: result.code !== 200 ? result.message : undefined,
        };
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data);
  }

  async put<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }
}

/**
 * 本地客户端实现
 * 调用LocalService实现业务逻辑（直接调用数据层），避免循环依赖
 */
import { LocalService } from './local-service';

class LocalClient implements IApiClient {
  async get<T>(path: string): Promise<ApiResponse<T>> {
    // 路径映射到LocalService方法
    if (path === '/api/task-templates') {
      return Promise.resolve(LocalService.getTaskTemplates()) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/task-executions') {
      return Promise.resolve(LocalService.getTaskExecutions()) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/products') {
      return Promise.resolve(LocalService.getProducts()) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/user/data') {
      return Promise.resolve(LocalService.getUserData()) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/user/points') {
      return Promise.resolve(LocalService.getPoints()) as Promise<ApiResponse<T>>;
    }
    if (path.startsWith('/api/user/point-records')) {
      const url = new URL(path, 'http://dummy');
      const type = url.searchParams.get('type') as 'earn' | 'spend' | undefined;
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
      return Promise.resolve(LocalService.getPointRecords(type, page, pageSize)) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/user/inventory') {
      return Promise.resolve(LocalService.getInventory()) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/user/custom-style') {
      return Promise.resolve(LocalService.getCustomStyle()) as Promise<ApiResponse<T>>;
    }

    return Promise.resolve({
      success: false,
      error: `Unknown path: ${path}`,
    } as ApiResponse<T>);
  }

  async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    if (path === '/api/task-templates') {
      return Promise.resolve(LocalService.createTaskTemplate(data)) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/task-executions/start') {
      return Promise.resolve(LocalService.startTask(data)) as Promise<ApiResponse<T>>;
    }
    if (path.match(/^\/api\/task-executions\/(.+)\/pause$/)) {
      const id = path.match(/^\/api\/task-executions\/(.+)\/pause$/)![1];
      return Promise.resolve(LocalService.pauseTask(id)) as Promise<ApiResponse<T>>;
    }
    if (path.match(/^\/api\/task-executions\/(.+)\/resume$/)) {
      const id = path.match(/^\/api\/task-executions\/(.+)\/resume$/)![1];
      return Promise.resolve(LocalService.resumeTask(id)) as Promise<ApiResponse<T>>;
    }
    if (path.match(/^\/api\/task-executions\/(.+)\/complete$/)) {
      const id = path.match(/^\/api\/task-executions\/(.+)\/complete$/)![1];
      return Promise.resolve(LocalService.completeTask(id)) as Promise<ApiResponse<T>>;
    }
    if (path.match(/^\/api\/task-executions\/(.+)\/cancel$/)) {
      const id = path.match(/^\/api\/task-executions\/(.+)\/cancel$/)![1];
      return Promise.resolve(LocalService.cancelTask(id)) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/products') {
      return Promise.resolve(LocalService.createProduct(data)) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/user/exchange') {
      return Promise.resolve(LocalService.exchange(data)) as Promise<ApiResponse<T>>;
    }

    return Promise.resolve({
      success: false,
      error: `Unknown path: ${path}`,
    } as ApiResponse<T>);
  }

  async put<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    if (path.match(/^\/api\/task-templates\/(.+)$/)) {
      const id = path.match(/^\/api\/task-templates\/(.+)$/)![1];
      return Promise.resolve(LocalService.updateTaskTemplate(id, data)) as Promise<ApiResponse<T>>;
    }
    if (path.match(/^\/api\/products\/(.+)$/)) {
      const id = path.match(/^\/api\/products\/(.+)$/)![1];
      return Promise.resolve(LocalService.updateProduct(id, data)) as Promise<ApiResponse<T>>;
    }
    if (path === '/api/user/custom-style') {
      return Promise.resolve(LocalService.updateCustomStyle(data)) as Promise<ApiResponse<T>>;
    }

    return Promise.resolve({
      success: false,
      error: `Unknown path: ${path}`,
    } as ApiResponse<T>);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    if (path.match(/^\/api\/task-templates\/(.+)$/)) {
      const id = path.match(/^\/api\/task-templates\/(.+)$/)![1];
      return Promise.resolve(LocalService.deleteTaskTemplate(id)) as Promise<ApiResponse<T>>;
    }
    if (path.match(/^\/api\/products\/(.+)$/)) {
      const id = path.match(/^\/api\/products\/(.+)$/)![1];
      return Promise.resolve(LocalService.deleteProduct(id)) as Promise<ApiResponse<T>>;
    }

    return Promise.resolve({
      success: false,
      error: `Unknown path: ${path}`,
    } as ApiResponse<T>);
  }
}

/**
 * API客户端工厂
 * 根据配置创建本地客户端或HTTP客户端
 */
class ApiClientFactory {
  private static client: IApiClient | null = null;
  private static config: ApiClientConfig = {};

  /**
   * 配置API客户端
   * @param config 客户端配置
   * 
   * 使用示例：
   * // 使用本地模式（默认）
   * ApiClientFactory.configure({});
   * 
   * // 使用HTTP模式（前后端分离）
   * ApiClientFactory.configure({ baseURL: 'http://localhost:8080' });
   * 
   * // 生产环境
   * ApiClientFactory.configure({ baseURL: 'https://api.example.com' });
   */
  static configure(config: ApiClientConfig = {}): void {
    this.config = config;
    this.client = null; // 重置客户端，下次获取时重新创建
  }

  /**
   * 获取API客户端实例
   */
  static getClient(): IApiClient {
    if (!this.client) {
      // 如果配置了baseURL，使用HTTP客户端；否则使用本地客户端
      if (this.config.baseURL) {
        this.client = new HttpClient(this.config);
      } else {
        this.client = new LocalClient();
      }
    }
    return this.client;
  }

  /**
   * 获取当前配置
   */
  static getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

// 默认导出工厂
export default ApiClientFactory;

// 导出便捷方法
export const apiClient = ApiClientFactory.getClient();
