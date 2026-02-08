/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SSO_BASE_URL?: string;
  readonly VITE_REWARD_BASE_URL?: string;
  readonly VITE_SSO_PROXY_TARGET?: string;
  readonly VITE_REWARD_PROXY_TARGET?: string;
  readonly VITE_API_TIMEOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron API 类型声明
interface Window {
  electronAPI?: {
    platform: string;
    saveFile: (content: string, fileName: string) => Promise<{ success: boolean; message?: string; filePath?: string }>;
    downloadFile: (url: string, fileName: string) => Promise<{ success: boolean; message?: string }>;
  };
}

// 声明图片模块类型
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
