/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ssoTarget = env.VITE_SSO_PROXY_TARGET || 'http://localhost'
  const rewardTarget = env.VITE_REWARD_PROXY_TARGET || 'http://localhost'

  return {
    plugins: [react()],
    test: {
      environment: 'happy-dom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
      exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    },
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
        '/api/reward': {
          target: rewardTarget,
          changeOrigin: true,
        },
        '/api/sso': {
          target: ssoTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
