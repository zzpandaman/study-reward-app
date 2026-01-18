import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // 尝试多个可能的 preload 路径
  const possiblePreloadPaths = [
    path.join(__dirname, 'preload.js'), // 标准路径
    path.join(__dirname, 'dist-electron', 'preload.js'), // 可能的情况
    path.join(process.cwd(), 'dist-electron', 'preload.js'), // Cursor 可能使用的路径
    path.resolve(__dirname, 'preload.js'), // 绝对路径
  ];
  
  let preloadPath = possiblePreloadPaths[0]; // 默认使用第一个
  for (const possiblePath of possiblePreloadPaths) {
    if (require('fs').existsSync(possiblePath)) {
      preloadPath = possiblePath;
      break;
    }
  }
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // 确保 preload 可以访问 Node.js API
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });
  
  console.log('[Main] 窗口对象已创建');

  // 开发环境加载本地服务器，生产环境加载构建后的文件
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    if (!mainWindow) {
      return;
    }
    
    // 尝试多个端口（Vite 可能在不同端口运行）
    const tryLoadUrl = async (port: number, maxRetries = 10) => {
      const devUrl = `http://localhost:${port}`;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          await mainWindow!.loadURL(devUrl);
          return true;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return false;
    };
    
    // 先尝试 5174（Vite 常用端口），再尝试 5173
    tryLoadUrl(5174).then(success => {
      if (!success && mainWindow) {
        tryLoadUrl(5173);
      }
    });
    
    mainWindow.webContents.openDevTools();
  } else {
    // 打包后的路径：resources/app/dist/index.html
    const distPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIPC() {
  // 处理文件保存（使用 dialog）
  ipcMain.handle('save-file', async (event, content: string, defaultFileName: string) => {
    try {
      // 确保有活动的窗口
      const targetWindow = BrowserWindow.fromWebContents(event.sender) || mainWindow;
      if (!targetWindow) {
        return { success: false, message: '没有活动的窗口' };
      }

      const result = await dialog.showSaveDialog(targetWindow, {
        defaultPath: defaultFileName,
        filters: [
          { name: 'Study Reward Data', extensions: ['srdata'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, message: '用户取消保存' };
      }

      // 确保文件扩展名是 .srdata
      let filePath = result.filePath;
      if (!filePath.toLowerCase().endsWith('.srdata')) {
        filePath += '.srdata';
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, message: '文件保存成功', filePath };
    } catch (error) {
      return { success: false, message: `保存失败: ${error}` };
    }
  });

  // 处理文件下载（使用 webContents.downloadURL）
  ipcMain.handle('download-file', async (event, url: string, fileName: string) => {
    try {
      const targetWindow = BrowserWindow.fromWebContents(event.sender) || mainWindow;
      if (!targetWindow) {
        return { success: false, message: '没有活动的窗口' };
      }

      // 监听下载事件
      targetWindow.webContents.session.once('will-download', (event, item) => {
        // 设置下载路径和文件名
        const downloadsPath = app.getPath('downloads');
        const filePath = require('path').join(downloadsPath, fileName);
        item.setSavePath(filePath);
      });

      // 触发下载
      targetWindow.webContents.downloadURL(url);
      return { success: true, message: '下载已开始' };
    } catch (error) {
      return { success: false, message: `下载失败: ${error}` };
    }
  });
}

app.whenReady().then(() => {
  // 先注册 IPC 处理器
  setupIPC();
  
  // 然后创建窗口
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
