import { expect, test } from '@playwright/test'

test('mock responde o status de saude da API', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  const body = await page.evaluate(async () => {
    const response = await fetch('/api/health')
    return response.json()
  })

  expect(body).toEqual({ status: 'ok' })
})
