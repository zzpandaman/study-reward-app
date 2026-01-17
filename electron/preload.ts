import { contextBridge } from 'electron';

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
