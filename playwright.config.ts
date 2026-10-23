import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  // Baselines da regressão visual: uma pasta por projeto (desktop/mobile), versionadas no repositório.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      // Folga pequena para variações de antialiasing entre máquinas; mudanças reais passam disso.
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
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
      // Timeout curto de propósito: o cenário request-timeout não pode custar 15 s por teste.
      VITE_API_TIMEOUT_MS: '3000',
    },
  },
})
