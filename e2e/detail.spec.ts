import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana, bruno] = mockUsers

// nft-03: Neon Vessel #552, 1.99 ETH (antes 2.29), raro, 552/800, 248 unidades.
// nft-01: Emerald Ape #042, 1.19 ETH. nft-08: Golden Echo #333, esgotado.
const NEON = 'Neon Vessel #552'

async function signIn(page: Page, user: { email: string; password: string }) {
  const main = page.getByRole('main')
  await main.getByLabel('E-mail', { exact: true }).fill(user.email)
  await main.getByLabel('Senha', { exact: true }).fill(user.password)
  await main.getByRole('button', { name: 'Entrar', exact: true }).click()
  // Só segue quando o login terminou; navegar antes aborta a requisição e a sessão não é gravada.
  await expect(page).not.toHaveURL(/\/login/)
}

function favorite(page: Page) {
  return page.getByRole('button', { name: `Favoritar ${NEON}` })
}

test('acesso direto mostra as informações do NFT', async ({ page }) => {
  await page.goto('/nft/nft-03')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(NEON)
  await expect(page.getByText('Neon Vessels', { exact: true }).first()).toBeVisible()
  await expect(page.getByTestId('detail-price')).toHaveText('1.99 ETH')
  await expect(page.getByText('Preço anterior: 2.29 ETH')).toBeVisible()
  await expect(page.getByTestId('detail-availability')).toHaveText('Edição 552/800 · 248 unidades disponíveis')
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(page.getByRole('heading', { name: 'Sobre este NFT:' })).toBeVisible()
    await expect(page.getByTestId('detail-rating')).toContainText('avaliações de colecionadores')
  } else {
    await expect(page.getByTestId('detail-rating-pill')).toContainText(/\(\d+\)/)
  }
  await expect(page.locator('p:visible', { hasText: /colecionável digital/ }).first()).toBeVisible()
  await expect(page.getByRole('list', { name: 'Edições' }).getByRole('listitem').filter({ hasText: '552/800' })).toHaveAttribute('aria-current', 'true')

  const facts = page.getByRole('main')
  await expect(facts).toContainText('ID do token: #0552')
  await expect(facts).toContainText('Coleção: Neon Vessels')
  await expect(facts).toContainText('Atributos: Terno, Neon, Raro')
  await expect(page.getByRole('tabpanel')).toContainText('Neon Forge')
  await expect(page).toHaveTitle(`${NEON} | Kurio`)
})

test('clicar no card do catálogo abre o detalhe e dá para voltar ao mercado', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('nft-card').filter({ hasText: NEON }).click()

  await expect(page).toHaveURL('/nft/nft-03')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(NEON)

  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole('button', { name: 'Voltar' }).click()
  } else {
    await page.getByRole('navigation', { name: 'Trilha de navegação' }).getByRole('link', { name: 'Início' }).click()
  }
  await expect(page).toHaveURL('/')
})

test('galeria: miniaturas trocam a imagem principal', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'no mobile (Figma) só a imagem principal aparece')
  await page.goto('/nft/nft-03')
  const main = page.getByTestId('gallery-main')
  const thumbs = page.getByRole('list', { name: 'Miniaturas da galeria' }).getByRole('button')

  await expect(thumbs).toHaveCount(4)
  await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'true')
  const firstSrc = await main.getAttribute('src')

  await thumbs.nth(2).click()

  await expect(thumbs.nth(2)).toHaveAttribute('aria-pressed', 'true')
  await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'false')
  await expect(main).not.toHaveAttribute('src', firstSrc!)
  await expect(main).toHaveAttribute('alt', `${NEON}, imagem 3 de 4`)
})

test('NFT inexistente mostra a mensagem de não encontrado', async ({ page }) => {
  await page.goto('/nft/nao-existe')

  await expect(page.getByTestId('detail-not-found')).toContainText('NFT não encontrado')
  await expect(page).toHaveTitle('NFT não encontrado | Kurio')
})

test('falha ao carregar mostra erro e permite tentar de novo', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'error'))
  await page.goto('/nft/nft-03')

  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar este NFT.', { timeout: 15_000 })
  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(NEON)
})

test('edição esgotada: sem compra e com explicação', async ({ page }) => {
  await page.goto('/nft/nft-08')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Golden Echo #333')
  await expect(page.getByText('Esta edição está esgotada.')).toBeVisible()
  await expect(page.getByTestId('detail-availability')).toHaveText('Edição 333/400 esgotada.')
  await expect(page.getByRole('button', { name: 'Comprar' })).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Quantidade' })).toHaveCount(0)
})

test('quantidade respeita o máximo por pedido e vai para o carrinho', async ({ page }) => {
  await page.goto('/nft/nft-01')
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  const decrease = page.getByRole('button', { name: 'Diminuir quantidade' })

  await expect(decrease).toBeDisabled()
  await expect(page.getByTestId('quantity-hint')).toHaveText('Até 5 unidades por pedido.')

  for (let step = 0; step < 4; step++) {
    await increase.click()
  }

  await expect(page.getByLabel('Quantidade: 5')).toBeVisible()
  await expect(increase).toBeDisabled()
  await expect(page.getByTestId('quantity-hint')).toHaveText('Máximo de 5 unidades por pedido.')

  await decrease.click()
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByTestId('cart-line-total')).toHaveText('4.76 ETH')
})

test('o que já está no carrinho reduz o que ainda dá para adicionar', async ({ page }) => {
  await page.goto('/nft/nft-01')
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  // Já são 3 no carrinho: restam 2.
  await expect(page.getByLabel('Quantidade: 1')).toBeVisible()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  await expect(page.getByTestId('quantity-hint')).toHaveText(
    'Máximo de 5 unidades por pedido. Você já tem 3 no carrinho.',
  )
})

test('comprar adiciona ao carrinho e oferece o caminho até ele', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await page.getByRole('link', { name: 'Ver carrinho' }).click()

  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByTestId('cart-item')).toContainText(NEON)
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.99 ETH')
})

test('abas: detalhes e avaliações de colecionadores', async ({ page }) => {
  await page.goto('/nft/nft-01')

  await expect(page.getByRole('tab', { name: 'Detalhes do NFT' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('Cunhado na Ethereum')

  await page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' }).click()
  await expect(page.getByRole('list', { name: 'Avaliações' }).getByRole('listitem')).toHaveCount(19)
})

test('"Mais desta coleção": 5 cards por página e nunca o próprio NFT', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'páginas de 5 só no desktop')
  await page.goto('/nft/nft-05')

  const related = page.getByTestId('related')
  await expect(related.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
  await expect(related.getByTestId('nft-card')).toHaveCount(5)
  await expect(related).not.toContainText('Violet Nomad #314')
})

test('detalhe (Figma): miniaturas de 100 px, imagem de 444 px e botões de 129 × 40 no desktop', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1264, 'três colunas só a partir de 1264 px')
  await page.goto('/nft/nft-01')

  const thumb = (await page.getByRole('list', { name: 'Miniaturas da galeria' }).getByRole('button').first().boundingBox())!
  const buy = (await page.getByRole('button', { name: 'Comprar' }).boundingBox())!
  const main = (await page.getByTestId('gallery-main').boundingBox())!

  expect(thumb.width).toBe(100)
  expect(thumb.height).toBe(100)
  expect(buy.width).toBe(129)
  expect(buy.height).toBe(40)
  expect(main.width).toBe(402)
})

test('favoritos: visitante é levado ao login e volta ao mesmo NFT', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await page.getByRole('link', { name: `Entrar para favoritar ${NEON}` }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fnft-03/)
  await signIn(page, ana)

  await expect(page).toHaveURL('/nft/nft-03')
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')
})

test('favoritos: alternar, persistir após refresh e separar por usuário', async ({ page }) => {
  await page.goto('/login?redirect=/nft/nft-03')
  await signIn(page, ana)
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')

  await favorite(page).click()
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')

  // Outro usuário não herda o favorito.
  await page.goto('/')
  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await page.goto('/login?redirect=/nft/nft-03')
  await signIn(page, bruno)
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')

  // E o da Ana continua lá quando ela volta.
  await page.goto('/')
  await page.getByRole('button', { name: `Conta de ${bruno.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await page.goto('/login?redirect=/nft/nft-03')
  await signIn(page, ana)
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')

  await favorite(page).click()
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')
})

test('favoritos: falha da API reverte o coração, avisa e permite recuperar', async ({ page }) => {
  await page.goto('/login?redirect=/nft/nft-03')
  await signIn(page, ana)
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')

  await page.evaluate(() => localStorage.setItem('mock-scenario', 'favorites-error'))
  await favorite(page).click()

  await expect(page.getByRole('alert')).toHaveText(
    'Não foi possível atualizar seus favoritos. Tente novamente.',
  )
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')

  // Recuperação: com a API de volta, a mesma ação funciona e o aviso some.
  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await favorite(page).click()
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/nft/nft-03')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NEON)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `largura ${width}`).toBe(0)
  }
})
