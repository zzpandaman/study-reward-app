/**
 * 统一 API 错误通知
 * 业务层或 HttpClient 调用 showApiError 触发 Toast 展示
 */
type Listener = (message: string | null) => void;

const listeners = new Set<Listener>();

export function showApiError(message: string): void {
  listeners.forEach((fn) => fn(message));
}

export function clearApiError(): void {
  listeners.forEach((fn) => fn(null));
}

export function subscribeApiError(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
