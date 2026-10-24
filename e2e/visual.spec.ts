import { expect, test, type Page } from '@playwright/test'
import { paymentHeading } from './support/checkout'
import { mockUsers } from '../src/mocks/fixtures/users'

// Regressão visual de Início, detalhe, carrinho e pagamento (desktop e mobile, um conjunto de
// baselines por projeto em e2e/__screenshots__/). Os dados são os das fixtures (estáveis), o
// relógio do mock é fixo e as animações são desligadas; a tela só é fotografada depois de as
// imagens (inclusive as preguiçosas) e as fontes carregarem.
//
//   npm run test:visual           confere contra as baselines
//   npm run test:visual:update    regera as baselines (depois de uma mudança visual intencional)

const [ana] = mockUsers

async function settle(page: Page) {
  // Rola até o fim e volta: as imagens com loading="lazy" só carregam quando chegam perto da tela.
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((resolve) => setTimeout(resolve, 150))
    window.scrollTo(0, 0)
  })
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((image) =>
        image.complete
          ? undefined
          : new Promise((resolve) => {
              image.onload = image.onerror = () => resolve(undefined)
            }),
      ),
    ),
  )
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
}

async function signIn(page: Page, redirect: string) {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  const main = page.getByRole('main')
  await main.getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main.getByLabel('Senha', { exact: true }).fill(ana.password)
  await main.getByRole('button', { name: 'Entrar', exact: true }).click()
  // Só segue quando o login terminou; navegar antes aborta a requisição e a sessão não é gravada.
  await expect(page).not.toHaveURL(/\/login/)
}

const seededCart = {
  items: [
    { nftId: 'nft-03', quantity: 1 },
    { nftId: 'nft-01', quantity: 2 },
  ],
  couponCode: 'KURIO10',
  version: 3,
}

test('Início', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await expect(page.getByTestId('hero-slide')).toBeVisible()
  await settle(page)

  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
})

test('Detalhe do NFT', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await expect(page.getByTestId('detail-price')).toBeVisible()
  await settle(page)

  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
})

test('Carrinho', async ({ page }) => {
  await page.addInitScript((cart) => {
    localStorage.setItem('kurio.guest-cart', 'visual')
    localStorage.setItem('mock-cart:guest:visual', JSON.stringify(cart))
  }, seededCart)
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-item')).toHaveCount(2)
  await expect(page.getByTestId('summary-total')).toBeVisible()
  await settle(page)

  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
})

test('Pagamento', async ({ page }) => {
  await page.addInitScript((cart) => {
    localStorage.setItem('mock-cart:user:user-ana', JSON.stringify(cart))
  }, seededCart)
  await signIn(page, '/pagamento')
  await expect(paymentHeading(page)).toBeVisible()
  await settle(page)

  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
})

test('Perfil do colecionador', async ({ page }) => {
  await signIn(page, '/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue('Ana Souza')
  await settle(page)

  await expect(page).toHaveScreenshot('perfil.png', { fullPage: true })
})

test('Carteiras', async ({ page }) => {
  await signIn(page, '/carteiras')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  await expect(page.getByLabel(/^Apelido da carteira/).first()).toHaveValue('Carteira principal')
  await settle(page)

  await expect(page).toHaveScreenshot('carteiras.png', { fullPage: true })
})
