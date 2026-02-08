/**
 * API客户端抽象层
 * 前后端分离模式，通过 HttpClient 调用后端
 */
import { ApiResponse } from './types';
import { showApiError } from '../utils/api-error';

export interface ApiClientConfig {
  baseURL: string;  // HTTP请求的基础URL（如 /api/reward）
  timeout?: number; // 请求超时时间（毫秒）
  token?: string;   // JWT Token
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
 * HTTP客户端实现（前后端分离）
 */
class HttpClient implements IApiClient {
  constructor(private config: ApiClientConfig) {}

  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    // 去掉 /api 前缀，baseURL 已包含完整路径（如 /api/reward）
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
        const errRes = { success: false as const, error: '登录已过期，请重新登录' };
        showApiError(errRes.error);
        return errRes;
      }

      const result = await response.json();
      
      // 转换后端响应格式为 ApiResponse
      // 后端返回 { code, message, data }，前端期望 { success, data, error }
      if (result.code !== undefined) {
        const success = result.code === 200 || result.code === 0;
        const res = {
          success,
          data: result.data,
          message: result.message,
          error: !success ? result.message : undefined,
        };
        if (!success && res.error) {
          showApiError(res.error);
        }
        return res;
      }

      const res = result as ApiResponse<T>;
      if (!res.success && res.error) {
        showApiError(res.error);
      }
      return res;
    } catch (error) {
      const errMsg = (error as Error).message;
      showApiError(errMsg);
      return { success: false, error: errMsg };
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

const DEFAULT_BASE_URL = '/api/reward';

/**
 * API客户端工厂
 * 固定使用 HttpClient 调用后端
 */
class ApiClientFactory {
  private static client: IApiClient | null = null;
  private static config: ApiClientConfig = {
    baseURL: DEFAULT_BASE_URL,
  };

  /**
   * 配置API客户端
   */
  static configure(config: Partial<ApiClientConfig> = {}): void {
    this.config = {
      baseURL: config.baseURL ?? DEFAULT_BASE_URL,
      timeout: config.timeout,
      token: config.token,
    };
    this.client = null;
  }

  /**
   * 获取API客户端实例
   */
  static getClient(): IApiClient {
    if (!this.client) {
      this.client = new HttpClient(this.config);
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
