import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/star/',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 开发环境代理 API 请求，解决 CORS 问题
      '/api/reward': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
