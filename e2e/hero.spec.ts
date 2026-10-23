import { expect, test, type Page } from '@playwright/test'

// Destaques por preço entre os disponíveis (mock): Golden Beat #003 (5.00), Violet Nomad #022
// (4.20) e Neon Vessel #301 (3.10). Emerald Ape #009 (6.50) está esgotado e fica de fora.
const SLIDES = [
  { id: 'nft-23', name: 'Golden Beat #003', price: '5.00 ETH' },
  { id: 'nft-17', name: 'Violet Nomad #022', price: '4.20 ETH' },
  { id: 'nft-13', name: 'Neon Vessel #301', price: '3.10 ETH' },
]

function isDesktop(page: Page) {
  return (page.viewportSize()?.width ?? 0) >= 768
}

function hero(page: Page) {
  return page.getByRole('region', { name: 'Destaques' })
}

function slide(page: Page) {
  return page.getByTestId('hero-slide')
}

async function updateNft(page: Page, id: string, changes: { priceEth?: string; availableQuantity?: number }) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __mockControl?: { connections: () => unknown[] } }).__mockControl?.connections()
            .length ?? 0,
      ),
    )
    .toBe(1)

  await page.evaluate(
    ([nftId, patch]) =>
      (
        window as unknown as {
          __mockControl: { updateNft: (id: string, changes: unknown) => unknown }
        }
      ).__mockControl.updateNft(nftId as string, patch),
    [id, changes] as const,
  )
}

test('o hero é o título da página, com texto e botão EXPLORAR', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByText('Bem-vindo à Kurio')).toBeVisible()
  await expect(page.getByRole('link', { name: 'EXPLORAR' })).toBeVisible()

  if (isDesktop(page)) {
    await expect(page.getByTestId('hero-title')).toContainText('Seja dono do futuro')
    await expect(page.getByTestId('hero-title')).toContainText('da arte digital')
    await expect(page.getByText('Descubra NFTs selecionados de criadores emergentes e consagrados.')).toBeVisible()
  } else {
    // O nome acessível só tem a variante visível (a do desktop fica fora da árvore de acessibilidade).
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Seja dono da cultura digital')
    await expect(page.getByText('Descubra NFTs selecionados de criadores do mundo todo.')).toBeVisible()
  }
})

test('dimensões do Figma: 1200 × 450 no desktop e 366 × 190 no mobile', async ({ page }) => {
  await page.setViewportSize(isDesktop(page) ? { width: 1440, height: 900 } : { width: 414, height: 896 })
  await page.goto('/')
  await expect(slide(page)).toBeVisible()

  const box = (await hero(page).boundingBox())!

  if (isDesktop(page)) {
    expect(box.width).toBe(1200)
    expect(box.height).toBe(450)
  } else {
    expect(box.width).toBe(366)
    expect(box.height).toBe(190)
  }
})

test('o primeiro destaque é o mais caro entre os disponíveis, com nome e preço', async ({ page }) => {
  await page.goto('/')

  await expect(slide(page)).toBeVisible()
  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[0].name)
  await expect(slide(page).getByTestId('hero-price')).toHaveText(SLIDES[0].price)
  await expect(slide(page).getByRole('img')).toHaveAttribute('alt', new RegExp(SLIDES[0].name))
  await expect(slide(page)).toHaveAttribute('aria-label', '1 de 3')
})

test('hero e card "em destaque" mostram o mesmo NFT', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1280, 'o card fica na barra lateral (≥ 1280 px)')
  await page.goto('/')

  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[0].name)
  await expect(page.getByTestId('featured-nft')).toContainText(SLIDES[0].name)
})

test('carrossel: os indicadores trocam o destaque e informam a posição', async ({ page }) => {
  await page.goto('/')
  await expect(slide(page)).toBeVisible()

  const dots = page.getByRole('group', { name: 'Escolher destaque' }).getByRole('button')
  await expect(dots).toHaveCount(3)
  await expect(dots.first()).toHaveAttribute('aria-current', 'true')

  await dots.nth(1).click()
  await expect(slide(page)).toHaveAttribute('aria-label', '2 de 3')
  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[1].name)
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(dots.first()).not.toHaveAttribute('aria-current', 'true')

  // Também por teclado.
  await dots.nth(2).focus()
  await page.keyboard.press('Enter')
  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[2].name)
})

test('o destaque leva ao detalhe do NFT', async ({ page }) => {
  await page.goto('/')
  await slide(page).getByRole('link').click()

  await expect(page).toHaveURL(`/nft/${SLIDES[0].id}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(SLIDES[0].name)
})

test('EXPLORAR leva o foco e a tela ao catálogo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await page.getByRole('link', { name: 'EXPLORAR' }).click()

  await expect(page.locator('#mercado')).toBeFocused()
  await expect(page.locator('#mercado')).toBeInViewport()
  // A URL não ganha hash nem perde filtros.
  await expect(page).toHaveURL('/')
})

test('tempo real: quando o destaque esgota, o hero passa para o próximo mais caro', async ({ page }) => {
  await page.goto('/')
  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[0].name)

  await updateNft(page, SLIDES[0].id, { availableQuantity: 0 })

  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[1].name)
  await expect(slide(page).getByTestId('hero-price')).toHaveText(SLIDES[1].price)
})

test('tempo real: o preço do destaque exibido acompanha o evento', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('group', { name: 'Escolher destaque' }).getByRole('button').nth(1).click()
  await expect(slide(page).getByTestId('hero-name')).toHaveText(SLIDES[1].name)

  await updateNft(page, SLIDES[1].id, { priceEth: '4.50' })

  await expect(slide(page).getByTestId('hero-price')).toHaveText('4.50 ETH')
})

test('sem destaques (catálogo vazio) o hero segue com o texto, sem arte nem indicadores', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'empty'))
  await page.goto('/')

  await expect(page.getByTestId('hero-title')).toBeVisible()
  await expect(page.getByTestId('hero-loading')).toHaveCount(0)
  await expect(slide(page)).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Escolher destaque' })).toHaveCount(0)
})

test('falha ao carregar os destaques não derruba o hero', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'error'))
  await page.goto('/')

  await expect(page.getByTestId('hero-title')).toBeVisible()
  await expect(page.getByRole('link', { name: 'EXPLORAR' })).toBeVisible()
  await expect(slide(page)).toHaveCount(0)
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(slide(page)).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `largura ${width}`).toBe(0)
  }
})

test('a moldura da arte do hero tem sempre o mesmo fundo creme, seja qual for o destaque', async ({ page }) => {
  await page.goto('/')
  await expect(slide(page)).toBeVisible()

  const dots = page.getByRole('group', { name: 'Escolher destaque' }).getByRole('button')

  for (const index of [0, 1, 2]) {
    await dots.nth(index).click()
    await expect(slide(page)).toHaveAttribute('aria-label', `${index + 1} de 3`)
    await expect(slide(page).getByRole('link')).toHaveCSS('background-color', 'rgb(252, 242, 218)')
  }
})
