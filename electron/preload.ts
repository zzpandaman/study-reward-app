import { contextBridge, ipcRenderer } from 'electron';

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  saveFile: (content: string, fileName: string) => {
    return ipcRenderer.invoke('save-file', content, fileName);
  },
  downloadFile: (url: string, fileName: string) => {
    return ipcRenderer.invoke('download-file', url, fileName);
  },
});
