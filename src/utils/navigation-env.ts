/**
 * Web（带 base）、Electron file://、Capacitor WebView 等环境下的路由与布局约定。
 */

export function getBrowserRouterBasename(): string {
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = base.replace(/\/$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Electron 打包 loadFile 为 file://，使用 Hash 路由避免无 pathname */
export function shouldUseHashRouter(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'file:';
}
