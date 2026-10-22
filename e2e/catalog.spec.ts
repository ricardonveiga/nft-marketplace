import { expect, test } from '@playwright/test'

test('mostra skeletons e depois o grid de cards', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await expect(page.getByTestId('nft-card')).toHaveCount(24)
  await expect(page.getByTestId('nft-grid-loading')).toHaveCount(0)

  const first = page.getByTestId('nft-card').first()
  await expect(first.getByRole('heading', { level: 3 })).toHaveText('Brisa Dourada')
  await expect(first).toContainText('Edição 1/50')
  await expect(first).toContainText('0.85 ETH')
  await expect(first.getByRole('img')).toBeVisible()
})

test('marca NFTs esgotados com texto', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await expect(page.getByText('Esgotado')).toHaveCount(6)
})

test('clicar no card abre /nft/:id', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('nft-card').first().click()

  await expect(page).toHaveURL(/\/nft\/nft-01$/)
  await expect(page.getByTestId('nft-id')).toHaveText('nft-01')
})

test.describe('cenários do MSW', () => {
  test('mostra mensagem de lista vazia', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock-scenario', 'empty'))
    await page.goto('/')

    await expect(page.getByTestId('nft-empty')).toHaveText('Nenhum NFT encontrado.')
  })

  test('mostra mensagem de erro e permite tentar de novo', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock-scenario', 'error'))
    await page.goto('/')

    // O TanStack Query tenta 3 vezes com backoff antes de expor o erro.
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os NFTs.', {
      timeout: 15_000,
    })

    await page.evaluate(() => localStorage.removeItem('mock-scenario'))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()

    await expect(page.getByTestId('nft-card')).toHaveCount(24)
  })
})
