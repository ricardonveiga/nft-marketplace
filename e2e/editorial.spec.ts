import { expect, test, type Page } from '@playwright/test'

// Promoções e "Diário da Cunhagem" da Início: conteúdo editorial vindo do MSW. Nada aqui pode
// aparentar uma ação que não existe, então os cards não são links.

function promotions(page: Page) {
  return page.getByTestId('promotions')
}

function blog(page: Page) {
  return page.getByTestId('blog')
}

test('promoções: título, cards e cupons como texto', async ({ page }) => {
  await page.goto('/')

  await expect(promotions(page).getByRole('heading', { level: 2, name: 'Promoções' })).toBeVisible()
  await expect(page.getByTestId('promotion')).toHaveCount(3)
  await expect(page.getByTestId('promotion').first().getByRole('heading', { level: 3 })).toHaveText('10% no seu pedido')
  await expect(page.getByTestId('promotion-coupon')).toHaveText(['KURIO10', 'GENESIS15'])
})

test('o cupom de uma promoção funciona de verdade no carrinho', async ({ page }) => {
  await page.goto('/')
  const code = (await page.getByTestId('promotion-coupon').first().textContent()) ?? ''

  await page.goto('/nft/nft-01')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  await page.goto('/carrinho')

  await page.getByLabel('Cupom de desconto').fill(code)
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('summary-discount')).toBeVisible()
  await expect(page.getByText('10% de desconto no pedido')).toBeVisible()
})

test('blog: título, três artigos com data, tempo de leitura e imagem decorativa', async ({ page }) => {
  await page.goto('/')

  await expect(blog(page).getByRole('heading', { level: 2, name: 'Diário da Cunhagem' })).toBeVisible()
  const posts = page.getByTestId('blog-post')
  await expect(posts).toHaveCount(3)
  await expect(posts.first().getByRole('heading', { level: 3 })).toContainText('Sua primeira cunhagem')
  await expect(posts.first().locator('time')).toHaveText('15 de outubro de 2026')
  await expect(posts.first()).toContainText('5 min de leitura')
  await expect(posts.first().locator('img')).toHaveAttribute('alt', '')
})

test('os links não aparentam funcionar: sem links e com "Em breve" nos artigos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('blog-post')).toHaveCount(3)

  await expect(promotions(page).getByRole('link')).toHaveCount(0)
  await expect(blog(page).getByRole('link')).toHaveCount(0)

  const soon = blog(page).getByText('Ler artigo (em breve)')
  await expect(soon).toHaveCount(3)
  await expect(soon.first()).toHaveAttribute('aria-disabled', 'true')
  await expect(soon.first()).toHaveAttribute('title', 'Em breve')
})

test('as seções ficam depois do catálogo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('blog-post')).toHaveCount(3)

  const catalog = await page.getByRole('region', { name: 'Catálogo de NFTs' }).boundingBox()
  const promo = await promotions(page).boundingBox()
  const diary = await blog(page).boundingBox()

  expect(promo!.y).toBeGreaterThan(catalog!.y + catalog!.height - 1)
  expect(diary!.y).toBeGreaterThan(promo!.y + promo!.height - 1)
})

test('cenário vazio: as seções somem e o resto da página segue normal', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'empty'))
  await page.goto('/')

  await expect(page.getByTestId('nft-empty')).toBeVisible()
  await expect(promotions(page)).toHaveCount(0)
  await expect(blog(page)).toHaveCount(0)
})

test('erro: cada seção mostra o aviso com "Tentar novamente" e se recupera', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'error'))
  await page.goto('/')

  await expect(promotions(page).getByRole('alert')).toContainText('Não foi possível carregar as promoções.')
  await expect(blog(page).getByRole('alert')).toContainText('Não foi possível carregar os artigos.')

  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await promotions(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await blog(page).getByRole('button', { name: 'Tentar novamente' }).click()

  await expect(page.getByTestId('promotion')).toHaveCount(3)
  await expect(page.getByTestId('blog-post')).toHaveCount(3)
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByTestId('blog-post')).toHaveCount(3)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `em ${width}px`).toBe(0)
  }
})
