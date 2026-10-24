import { expect, test, type Page } from '@playwright/test'

// Promoções e "Diário da Cunhagem" da Início: conteúdo editorial vindo do MSW, com os textos do
// Figma. Nada aqui pode aparentar uma ação que não existe: os artigos não são links ("Ler mais"
// fica inerte, como "Em breve") e o "Explorar" das promoções leva ao catálogo, como o do hero.

function promotions(page: Page) {
  return page.getByTestId('promotions')
}

function blog(page: Page) {
  return page.getByTestId('blog')
}

test('promoções: dois cards com título, texto e botão Explorar', async ({ page }) => {
  await page.goto('/')

  const cards = page.getByTestId('promotion')
  await expect(cards).toHaveCount(2)

  await expect(cards.nth(0).getByRole('heading', { level: 3 })).toHaveText(
    'Lançamentos gênesis de edição limitada',
  )
  await expect(cards.nth(0)).toContainText('Colecione edições escassas diretamente dos criadores')
  await expect(cards.nth(1).getByRole('heading', { level: 3 })).toHaveText('Arte digital selecionada e muito mais')
  await expect(cards.nth(1)).toContainText('Explore novos artistas, coleções verificadas e obras digitais')

  for (const card of await cards.all()) {
    await expect(card.getByRole('link', { name: 'Explorar' })).toBeVisible()
    await expect(card.locator('img')).toHaveAttribute('alt', '')
  }
})

test('promoções: o Explorar leva o foco e a tela ao catálogo, sem mexer na URL', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('promotion')).toHaveCount(2)

  await page.getByTestId('promotion').first().getByRole('link', { name: 'Explorar' }).click()

  await expect(page.locator('#mercado')).toBeFocused()
  await expect(page.locator('#mercado')).toBeInViewport()
  await expect(page).toHaveURL('/')
})

test('promoções (Figma): cards de 586 × 250 no desktop, com a arte de 287 px à esquerda', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1264, 'duas colunas só a partir de 1264 px')
  await page.goto('/')
  await expect(page.getByTestId('promotion')).toHaveCount(2)

  const [first, second] = await Promise.all(
    [0, 1].map((index) => page.getByTestId('promotion').nth(index).boundingBox()),
  )

  expect(first!.width).toBe(586)
  expect(first!.height).toBe(250)
  expect(second!.x - (first!.x + first!.width)).toBe(28)
  expect((await page.getByTestId('promotion').first().locator('img').boundingBox())!.width).toBe(287)
})

test('blog: título, subtítulo e quatro artigos com data, tempo de leitura e imagem decorativa', async ({ page }) => {
  await page.goto('/')

  await expect(blog(page).getByRole('heading', { level: 2, name: 'Diário da Cunhagem' })).toBeVisible()
  await expect(
    blog(page).getByText('Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.'),
  ).toBeVisible()

  const posts = page.getByTestId('blog-post')
  await expect(posts).toHaveCount(4)
  await expect(posts.nth(0).getByRole('heading', { level: 3 })).toHaveText('Como funciona a propriedade de NFTs')
  await expect(posts.nth(0).locator('time')).toHaveText('12 de setembro')
  await expect(posts.nth(0)).toContainText('Leitura de 6 min')
  await expect(posts.nth(0)).toContainText('Aprenda a colecionar, negociar e verificar ativos digitais.')
  await expect(posts.nth(1).getByRole('heading', { level: 3 })).toHaveText('10 artistas digitais para acompanhar')
  await expect(posts.nth(2).getByRole('heading', { level: 3 })).toHaveText('Raridade, atributos e procedência')
  await expect(posts.nth(3).getByRole('heading', { level: 3 })).toHaveText('Como proteger sua carteira')
  await expect(posts.first().locator('img')).toHaveAttribute('alt', '')
})

test('os artigos não aparentam funcionar: sem links e com "Ler mais" inerte ("Em breve")', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('blog-post')).toHaveCount(4)

  await expect(blog(page).getByRole('link')).toHaveCount(0)

  const more = blog(page).getByText('Ler mais')
  await expect(more).toHaveCount(4)
  await expect(more.first()).toHaveAttribute('aria-disabled', 'true')
  await expect(more.first()).toHaveAttribute('title', 'Em breve')
})

test('blog (Figma): cards de 268 px com 24 px entre eles e imagem de 195 px no desktop', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1264, 'quatro colunas só a partir de 1208 px')
  await page.goto('/')
  await expect(page.getByTestId('blog-post')).toHaveCount(4)

  const boxes = await Promise.all(
    [0, 1, 2, 3].map((index) => page.getByTestId('blog-post').nth(index).boundingBox()),
  )

  for (const box of boxes) {
    expect(box!.width).toBe(268)
    expect(box!.height).toBe(369)
  }
  expect(boxes[1]!.x - (boxes[0]!.x + boxes[0]!.width)).toBe(24)
  expect((await page.getByTestId('blog-post').first().locator('img').boundingBox())!.height).toBe(195)
})

test('as seções ficam depois do catálogo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('blog-post')).toHaveCount(4)

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

  await expect(page.getByTestId('promotion')).toHaveCount(2)
  await expect(page.getByTestId('blog-post')).toHaveCount(4)
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByTestId('blog-post')).toHaveCount(4)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `em ${width}px`).toBe(0)
  }
})

test('blog: os quatro artigos ficam na mesma linha em 1024, 1280 e 1440 px', async ({ page }) => {
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByTestId('blog-post')).toHaveCount(4)

    const tops = await page.getByTestId('blog-post').evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().top)),
    )

    expect(new Set(tops).size, `linhas em ${width}px`).toBe(1)
  }
})
