import { expect, test, type Page } from '@playwright/test'
import { nfts } from '../src/mocks/fixtures/nfts'

// O card fica na barra lateral, que só existe a partir de 1280 px.
function hasSidebar(page: Page) {
  return (page.viewportSize()?.width ?? 0) >= 1280
}

// Critério documentado: o NFT mais caro entre os disponíveis.
const expected = nfts
  .filter((nft) => nft.availability === 'disponivel')
  .reduce((best, nft) => (Number(nft.priceEth) > Number(best.priceEth) ? nft : best))

test('card de destaque mostra o NFT mais caro entre os disponíveis', async ({ page }) => {
  test.skip(!hasSidebar(page), 'barra lateral só a partir de 1280 px')
  await page.goto('/')

  const card = page.getByTestId('featured-nft')
  await expect(card.getByRole('heading', { name: 'NFT em destaque' })).toBeVisible()
  await expect(card.getByText('Oferta limitada')).toBeVisible()
  // Como no Figma, sem texto sobre a foto: nome e preço só para leitores de tela.
  await expect(card.getByRole('link')).toContainText(`${expected.name}, ${expected.priceEth} ETH`)
  await expect(card.getByText(`${expected.name}, ${expected.priceEth} ETH`)).toHaveClass(/sr-only/)
  await expect(card.getByRole('img')).toHaveAttribute('alt', new RegExp(expected.name))
})

test('o destaque ignora NFTs esgotados, mesmo os mais caros', async ({ page }) => {
  test.skip(!hasSidebar(page), 'barra lateral só a partir de 1280 px')
  // Dado do mock que torna o teste significativo: o NFT mais caro do catálogo está esgotado.
  const mostExpensive = [...nfts].sort((a, b) => Number(b.priceEth) - Number(a.priceEth))[0]
  expect(mostExpensive.availability).toBe('esgotado')
  expect(expected.id).not.toBe(mostExpensive.id)

  await page.goto('/')
  await expect(page.getByTestId('featured-nft').getByRole('link')).toHaveAttribute(
    'href',
    `/nft/${expected.id}`,
  )
})

test('clicar no destaque abre o detalhe do NFT', async ({ page }) => {
  test.skip(!hasSidebar(page), 'barra lateral só a partir de 1280 px')
  await page.goto('/')

  await page.getByTestId('featured-nft').getByRole('link').click()

  await expect(page).toHaveURL(`/nft/${expected.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(expected.name)
})

test('card tem 310 px de largura e fica logo abaixo dos filtros', async ({ page }) => {
  test.skip(!hasSidebar(page), 'barra lateral só a partir de 1280 px')
  await page.goto('/')
  await expect(page.getByTestId('featured-nft').getByRole('img')).toBeVisible()

  const filters = (await page.getByRole('complementary', { name: 'Filtros' }).boundingBox())!
  const card = (await page.getByTestId('featured-nft').boundingBox())!

  expect(card.width).toBe(310)
  expect(card.x).toBe(filters.x)
  // Figma: 24 px entre o painel de filtros e o banner.
  expect(card.y - (filters.y + filters.height)).toBe(24)
})

test('sem destaque (catálogo vazio) o card não aparece e a página segue funcionando', async ({ page }) => {
  test.skip(!hasSidebar(page), 'barra lateral só a partir de 1280 px')
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'empty'))
  await page.goto('/')

  await expect(page.getByTestId('nft-empty')).toBeVisible()
  await expect(page.getByTestId('featured-nft')).toHaveCount(0)
})

test('abaixo de 1280 px o card de destaque não é exibido', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await expect(page.getByTestId('featured-nft')).toBeHidden()
})
