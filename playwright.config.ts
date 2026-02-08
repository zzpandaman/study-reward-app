import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174/star/',
    trace: 'on-first-retry',
    headless: !process.env.PW_HEADED,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: 'npx vite --port 5174',
    env: { ...process.env, VITE_API_BASE_URL: '' },
    url: 'http://localhost:5174/star/',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
