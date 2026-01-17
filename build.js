const { build } = require('vite');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function buildApp() {
  console.log('📦 开始构建应用...');

  // 1. 构建渲染进程（React应用）
  console.log('🔨 构建渲染进程...');
  await build({
    configFile: path.resolve(__dirname, 'vite.config.ts'),
  });

  // 2. 编译Electron主进程
  console.log('🔨 编译Electron主进程...');
  const tsConfigPath = path.resolve(__dirname, 'tsconfig.electron.json');
  execSync(`npx tsc -p ${tsConfigPath}`, { stdio: 'inherit' });

  // 3. 复制preload文件到dist-electron（如果需要）
  const distElectronDir = path.resolve(__dirname, 'dist-electron');
  if (!fs.existsSync(distElectronDir)) {
    fs.mkdirSync(distElectronDir, { recursive: true });
  }

  console.log('✅ 构建完成！');
  console.log('💡 运行 npm run electron:build 来打包成安装程序');
}

buildApp().catch((err) => {
  console.error('❌ 构建失败:', err);
  process.exit(1);
});
