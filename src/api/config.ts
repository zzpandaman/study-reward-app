/**
 * API配置
 * 前后端分离模式，ssoBaseURL 指向 star-sso，rewardBaseURL 指向 star-reward
 */

const DEFAULT_SSO_BASE_URL = '/api/sso';
const DEFAULT_REWARD_BASE_URL = '/api/reward';

export interface ApiConfig {
  ssoBaseURL: string;
  rewardBaseURL: string;
  timeout?: number;
  token?: string;
}

/**
 * 从环境变量获取默认配置
 */
function getEnvConfig(): ApiConfig {
  const ssoBaseURL = import.meta.env.VITE_SSO_BASE_URL;
  const rewardBaseURL = import.meta.env.VITE_REWARD_BASE_URL;
  const timeout = import.meta.env.VITE_API_TIMEOUT;
  return {
    ssoBaseURL: ssoBaseURL || DEFAULT_SSO_BASE_URL,
    rewardBaseURL: rewardBaseURL || import.meta.env.VITE_API_BASE_URL || DEFAULT_REWARD_BASE_URL,
    timeout: timeout ? parseInt(timeout, 10) : 30000,
  };
}

let apiConfig: ApiConfig = getEnvConfig();

/**
 * 配置API
 */
export function configureApi(config: Partial<ApiConfig> = {}): void {
  apiConfig = { ...getEnvConfig(), ...config };
  import('./client').then(({ default: ApiClientFactory }) => {
    ApiClientFactory.configure({
      baseURL: apiConfig.rewardBaseURL,
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
 * 判断是否使用HTTP模式（前后端分离模式下始终为 true）
 */
export function isHttpMode(): boolean {
  return true;
}
