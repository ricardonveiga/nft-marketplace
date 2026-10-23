import { expect, test, type Page } from '@playwright/test'

function isDesktop(page: Page) {
  return (page.viewportSize()?.width ?? 0) >= 768
}

test('mostra skeletons e depois o grid de cards', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(page.getByTestId('nft-grid-loading')).toHaveCount(0)

  const first = page.getByTestId('nft-card').first()
  await expect(first.getByRole('heading', { level: 3 })).toHaveText('Emerald Ape #042')
  await expect(first).toContainText('1.19 ETH')
  await expect(first.getByRole('img')).toBeVisible()
})

test('mostra preço anterior quando o NFT está com desconto', async ({ page }) => {
  await page.goto('/')

  const discounted = page.getByTestId('nft-card').filter({ hasText: 'Neon Vessel #552' })
  await expect(discounted).toContainText('1.99 ETH')
  await expect(discounted).toContainText('Preço anterior: 2.29 ETH')
})

test('marca NFT esgotado com texto', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await expect(page.getByText('Esgotado')).toHaveCount(1)
})

test('clicar no card abre /nft/:id', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('nft-card').first().click()

  await expect(page).toHaveURL(/\/nft\/nft-01$/)
  await expect(page.getByTestId('nft-id')).toHaveText('nft-01')
})

test('desktop: 3 colunas com cards de 258 px e espaçamento do Figma', async ({ page }) => {
  test.skip(!isDesktop(page), 'somente desktop')
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  const boxes = await Promise.all(
    [0, 1, 2, 3].map((index) => page.getByTestId('nft-card').nth(index).boundingBox()),
  )
  const [a, b, c, d] = boxes.map((box) => box!)

  expect(a.width).toBe(258)
  expect(b.x - (a.x + a.width)).toBe(34)
  expect(c.x - (b.x + b.width)).toBe(34)
  expect(a.y).toBe(b.y)
  expect(d.x).toBe(a.x)
  expect(d.y).toBeGreaterThan(a.y + a.height)
  // Figma: 72 px entre as linhas.
  expect(d.y - (a.y + a.height)).toBe(72)

  const artwork = page.getByTestId('nft-card').first().getByRole('img')
  expect((await artwork.boundingBox())?.width).toBe(250)
})

test('mobile: 2 colunas com a segunda deslocada para baixo', async ({ page }) => {
  test.skip(isDesktop(page), 'somente mobile')
  // Largura do frame Mobile / Início do Figma.
  await page.setViewportSize({ width: 414, height: 896 })
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  const first = (await page.getByTestId('nft-card').nth(0).boundingBox())!
  const second = (await page.getByTestId('nft-card').nth(1).boundingBox())!

  expect(first.width).toBe(175)
  expect(second.x - (first.x + first.width)).toBe(16)
  expect(second.y - first.y).toBe(32)

  // RARO aparece só no mobile, no card Neon Vessel #552.
  await expect(
    page.getByTestId('nft-card').filter({ hasText: 'Neon Vessel #552' }).getByText('RARO'),
  ).toBeVisible()
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

    await expect(page.getByTestId('nft-card')).toHaveCount(9)
  })
})
