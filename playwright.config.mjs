import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  timeout: 30000,
  expect: { timeout: 7000 },
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure' },
  webServer: { command: 'python3 -m http.server 3000 --bind 127.0.0.1', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 30000 },
  reporter: process.env.CI ? 'github' : 'list'
});
