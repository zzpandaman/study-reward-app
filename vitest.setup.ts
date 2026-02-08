/**
 * Vitest 测试环境配置
 * - HTTP 集成测试时补全 fetch 相对路径为绝对 URL
 */
// HTTP 集成测试：将相对 URL 解析为 http://localhost
const BASE = 'http://localhost';
const originalFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' && input.startsWith('/')
      ? BASE + input
      : input;
  return originalFetch(url as RequestInfo, init);
}) as typeof fetch;
