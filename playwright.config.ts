import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite --config e2e/vite.config.ts',
    url: 'http://127.0.0.1:4175/e2e/fixtures/messages.html',
    reuseExistingServer: !process.env.CI,
  },
})
