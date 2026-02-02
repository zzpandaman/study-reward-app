/**
 * API配置
 * 通过环境变量或手动配置切换本地模式和HTTP模式
 */

export interface ApiConfig {
  /**
   * API基础URL
   * - 如果不设置或为空字符串，使用本地模式（LocalClient）
   * - 如果设置了baseURL，使用HTTP模式（HttpClient）
   */
  baseURL?: string;

  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number;

  /**
   * JWT Token（HTTP模式需要）
   */
  token?: string;
}

/**
 * 从环境变量获取默认配置
 */
function getEnvConfig(): ApiConfig {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const timeout = import.meta.env.VITE_API_TIMEOUT;
  
  return {
    baseURL: baseURL || undefined,
    timeout: timeout ? parseInt(timeout, 10) : 30000,
  };
}

/**
 * API配置实例
 * 默认从环境变量读取
 */
let apiConfig: ApiConfig = getEnvConfig();

/**
 * 配置API
 * 
 * @param config 配置对象（会与环境变量配置合并）
 * 
 * @example
 * // 使用环境变量配置（默认）
 * configureApi({});
 * 
 * @example
 * // 覆盖环境变量，使用本地模式
 * configureApi({ baseURL: undefined });
 * 
 * @example
 * // 覆盖环境变量，连接指定后端
 * configureApi({ baseURL: 'http://localhost:8080/api/reward' });
 */
export function configureApi(config: Partial<ApiConfig> = {}): void {
  apiConfig = { ...getEnvConfig(), ...config };
  
  // 同步更新client配置
  import('./client').then(({ default: ApiClientFactory }) => {
    ApiClientFactory.configure({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      token: apiConfig.token,
    });
  });
}

/**
 * 初始化API配置（应用启动时调用）
 */
export function initializeApi(): void {
  configureApi({});
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
