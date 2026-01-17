/**
 * API配置
 * 通过配置baseURL可以轻松切换本地模式和HTTP模式（前后端分离）
 */

export interface ApiConfig {
  /**
   * API基础URL
   * - 如果不设置或为空字符串，使用本地模式（直接调用API类）
   * - 如果设置了baseURL（如 'http://localhost:8080'），使用HTTP模式
   */
  baseURL?: string;

  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number;
}

/**
 * API配置实例
 * 默认使用本地模式
 */
let apiConfig: ApiConfig = {
  baseURL: undefined, // 本地模式
  timeout: 30000, // 30秒
};

/**
 * 配置API
 * 
 * @param config 配置对象
 * 
 * @example
 * // 使用本地模式（默认）
 * configureApi({});
 * 
 * @example
 * // 使用HTTP模式（前后端分离）
 * configureApi({ baseURL: 'http://localhost:8080' });
 * 
 * @example
 * // 生产环境
 * configureApi({ baseURL: 'https://api.example.com' });
 */
export function configureApi(config: ApiConfig): void {
  apiConfig = { ...apiConfig, ...config };
  
  // 同步更新client配置
  import('./client').then(({ default: ApiClientFactory }) => {
    ApiClientFactory.configure({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
    });
  });
}

/**
 * 获取当前API配置
 */
export function getApiConfig(): ApiConfig {
  return { ...apiConfig };
}

/**
 * 判断是否使用HTTP模式
 */
export function isHttpMode(): boolean {
  return !!apiConfig.baseURL;
}

/**
 * 判断是否使用本地模式
 */
export function isLocalMode(): boolean {
  return !apiConfig.baseURL;
}
