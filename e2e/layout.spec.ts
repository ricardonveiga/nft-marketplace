import { expect, test, type Page } from '@playwright/test'

function isDesktop(page: Page) {
  return (page.viewportSize()?.width ?? 0) >= 768
}

test('desktop: header com menu, busca, carrinho e entrar', async ({ page }) => {
  test.skip(!isDesktop(page), 'somente desktop')
  await page.goto('/')

  const nav = page.getByRole('navigation', { name: 'Principal' })
  await expect(nav.getByRole('link', { name: 'Início' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Mercado' })).toBeVisible()
  await expect(nav.getByText('Criadores')).toBeVisible()
  await expect(nav.getByText('Aprenda')).toBeVisible()

  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Carrinho' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).toBeHidden()
})

test('mobile: busca no topo e barra de navegação inferior', async ({ page }) => {
  test.skip(isDesktop(page), 'somente mobile')
  await page.goto('/')

  await expect(page.getByRole('searchbox', { name: 'Explorar coleções' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Filtros' })).toBeVisible()

  const tabBar = page.getByRole('navigation', { name: 'Navegação inferior' })
  await expect(tabBar).toBeVisible()
  await expect(tabBar.getByRole('link', { name: 'Início' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeHidden()
})

test('header continua fixo no topo ao rolar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await page.evaluate(() => window.scrollTo(0, 800))

  const header = page.getByRole('banner')
  await expect(header).toBeVisible()
  expect((await header.boundingBox())?.y).toBe(0)
})

test('footer aparece em toda a página com links e redes sociais', async ({ page }) => {
  await page.goto('/')

  const footer = page.getByRole('contentinfo')
  await footer.scrollIntoViewIfNeeded()

  await expect(footer.getByRole('heading', { name: 'Redes sociais' })).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    'https://instagram.com',
  )
  await expect(footer.getByText('© 2026 Kurio. Propriedade digital para todos.')).toBeVisible()
})

test('newsletter não aparenta sucesso funcional', async ({ page }) => {
  await page.goto('/')

  const footer = page.getByRole('contentinfo')
  await footer.getByLabel('Seu e-mail').fill('pessoa@exemplo.com')
  await footer.getByRole('button', { name: 'Enviar' }).click()

  await expect(footer.getByRole('status')).toHaveText(
    'Inscrição indisponível nesta demonstração.',
  )
})

test('tablet (768 px): sem rolagem horizontal e com filtros na barra de abas', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)

  const enter = page.getByRole('link', { name: 'Entrar' })
  await expect(enter).toBeVisible()
  expect(((await enter.boundingBox())?.x ?? 0) + 100).toBeLessThanOrEqual(768)
  await expect(page.getByRole('button', { name: 'Filtros' })).toBeVisible()
})
