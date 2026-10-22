import { expect, test } from '@playwright/test'

test('mostra o status de saude da API retornado pelo mock', async ({ page }) => {
  await page.goto('/')

  const status = page.getByTestId('health-status')

  await expect(status).toBeVisible()
  await expect(status).toContainText('ok')
})
