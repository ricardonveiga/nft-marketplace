import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    // Porta própria dos testes: não reaproveita (nem atrapalha) o servidor de desenvolvimento
    // que alguém tenha aberto em 5173.
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_ENABLE_MOCKS: 'true',
    },
  },
})
