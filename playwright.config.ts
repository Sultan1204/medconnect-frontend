import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against the app in mock mode (isolated from the backend).
 * Integration runs against the Laravel dev API: `E2E_MODE=http npx playwright test`
 * with the backend serving on DEV_BACKEND_URL.
 */
const mode = process.env.E2E_MODE === 'http' ? 'development' : 'mock'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --mode ${mode} --port 4173 --strictPort`,
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
