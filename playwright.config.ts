import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'ru-RU',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      ADMIN_TOKEN: 'e2e-secret',
      RSVP_DATA_FILE: '.e2e-data/rsvp.json',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
})
