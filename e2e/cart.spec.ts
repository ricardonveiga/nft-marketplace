import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana, bruno] = mockUsers

// nft-01: Emerald Ape #042, 1.19 ETH (limite de 5 por pedido); nft-02: Sage Nomad #009, 1.69 ETH;
// nft-08: Golden Echo #333, esgotado.
const EMERALD = 'Emerald Ape #042'
const SAGE = 'Sage Nomad #009'

async function addToCart(page: Page, nftId: string) {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
}

function cartLink(page: Page, label: string | RegExp = /^Carrinho/) {
  return page.getByRole('link', typeof label === 'string' ? { name: label, exact: true } : { name: label })
}

async function openCart(page: Page) {
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-loading')).toHaveCount(0)
}

function row(page: Page, name: string) {
  return page.getByTestId('cart-item').filter({ hasText: name })
}

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto('/login')
  const main = page.getByRole('main')
  await main.getByLabel('E-mail', { exact: true }).fill(user.email)
  await main.getByLabel('Senha', { exact: true }).fill(user.password)
  await main.getByRole('button', { name: 'Entrar', exact: true }).click()
  // Só segue quando o login terminou; navegar antes aborta a requisição e a sessão não é gravada.
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page).not.toHaveURL(/\/login/)
}

async function signOut(page: Page, name: string) {
  await page.getByRole('button', { name: `Conta de ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: `Conta de ${name}` })).toBeHidden()
}

test('carrinho vazio mostra a mensagem e leva de volta ao catálogo', async ({ page }) => {
  await openCart(page)

  await expect(page.getByTestId('cart-empty')).toContainText('Seu carrinho está vazio.')
  await page.getByRole('link', { name: 'Explorar NFTs' }).click()
  await expect(page).toHaveURL('/')
})

test('adicionar pelo detalhe atualiza o contador e mostra os valores calculados pela API', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await expect(cartLink(page, 'Carrinho, 1 item')).toBeVisible()

  await openCart(page)

  await expect(row(page, EMERALD)).toBeVisible()
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.19 ETH')
  await expect(page.getByTestId('summary-fee')).toHaveText('0.0045 ETH')
  await expect(page.getByTestId('summary-total')).toHaveText('1.1945 ETH')
})

test('adicionar o mesmo NFT de novo soma as quantidades', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await addToCart(page, 'nft-01')

  await openCart(page)

  await expect(row(page, EMERALD).getByTestId('cart-line-total')).toHaveText('2.38 ETH')
  await expect(cartLink(page, 'Carrinho, 2 itens')).toBeVisible()
})

test('quantidade: aumentar, diminuir e respeitar o limite do pedido', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await openCart(page)

  const item = row(page, EMERALD)
  const increase = item.getByRole('button', { name: `Aumentar quantidade de ${EMERALD}` })
  const decrease = item.getByRole('button', { name: `Diminuir quantidade de ${EMERALD}` })

  await expect(decrease).toBeDisabled()

  for (const expected of [2, 3, 4, 5]) {
    await increase.click()
    await expect(item.getByRole('group')).toContainText(String(expected))
  }

  await expect(increase).toBeDisabled()
  await expect(item).toContainText('Máximo de 5 unidades por pedido.')
  await expect(page.getByTestId('summary-subtotal')).toHaveText('5.95 ETH')
  await expect(page.getByTestId('summary-total')).toHaveText('5.9545 ETH')

  await decrease.click()
  await expect(item.getByTestId('cart-line-total')).toHaveText('4.76 ETH')
  await expect(increase).toBeEnabled()
})

test('mudança de quantidade é anunciada para leitores de tela', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await openCart(page)

  await row(page, EMERALD).getByRole('button', { name: `Aumentar quantidade de ${EMERALD}` }).click()

  await expect(
    page.getByRole('main').getByRole('status').filter({ hasText: 'alterada para 2' }),
  ).toHaveText(`Quantidade de ${EMERALD} alterada para 2.`)
})

test('limite por pedido: a tela de detalhe trava ao chegar no máximo', async ({ page }) => {
  await page.goto('/nft/nft-01')
  const add = page.getByRole('button', { name: 'Comprar' })

  for (let attempt = 0; attempt < 5; attempt++) {
    await add.click()
    await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  }

  await expect(add).toBeDisabled()
  await expect(page.getByTestId('quantity-hint')).toContainText('Você já tem o máximo permitido')
})

test('a API recusa passar do limite e de NFT esgotado, mesmo fora da interface', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  const result = await page.evaluate(async () => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Guest-Cart': localStorage.getItem('kurio.guest-cart') ?? '',
    }
    const post = async (body: unknown) => {
      const response = await fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify(body) })

      return { status: response.status, body: await response.json() }
    }

    return {
      overLimit: await post({ nftId: 'nft-01', quantity: 6 }),
      soldOut: await post({ nftId: 'nft-08' }),
      fractional: await post({ nftId: 'nft-01', quantity: 1.5 }),
      unknown: await post({ nftId: 'nao-existe' }),
    }
  })

  expect(result.overLimit.status).toBe(409)
  expect(result.overLimit.body.code).toBe('quantity_limit')
  expect(result.soldOut.status).toBe(409)
  expect(result.soldOut.body.code).toBe('sold_out')
  expect(result.fractional.status).toBe(422)
  expect(result.unknown.status).toBe(404)
})

test('NFT esgotado não tem como entrar no carrinho pela tela', async ({ page }) => {
  await page.goto('/nft/nft-08')

  await expect(page.getByText('Esta edição está esgotada.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar' })).toHaveCount(0)
  await expect(cartLink(page, 'Carrinho')).toBeVisible()
})

test('remover o item esvazia o carrinho e zera o contador', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await openCart(page)

  await row(page, EMERALD).getByRole('button', { name: `Remover ${EMERALD} do carrinho` }).click()

  await expect(page.getByTestId('cart-empty')).toBeVisible()
  await expect(cartLink(page, 'Carrinho')).toBeVisible()
})

test('o carrinho persiste após refresh', async ({ page }) => {
  await addToCart(page, 'nft-02')
  await openCart(page)
  await expect(row(page, SAGE)).toBeVisible()

  await page.reload()

  await expect(row(page, SAGE)).toBeVisible()
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.69 ETH')
})

test('cupom válido calcula o desconto na API (aceita minúsculas) e pode ser removido', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await addToCart(page, 'nft-01')
  await openCart(page)

  await page.getByLabel('Cupom de desconto').fill('kurio10')
  await page.getByRole('button', { name: 'Aplicar' }).click()

  await expect(page.getByTestId('summary-discount')).toHaveText('(-) 0.238')
  await expect(page.getByTestId('summary-subtotal')).toHaveText('2.38 ETH')
  await expect(page.getByTestId('summary-total')).toHaveText('2.1465 ETH')
  await expect(page.getByText('10% de desconto no pedido')).toBeVisible()

  await page.getByRole('button', { name: 'Remover cupom KURIO10' }).click()

  await expect(page.getByTestId('summary-discount')).toHaveText('(-) 00.00')
  await expect(page.getByTestId('summary-total')).toHaveText('2.3845 ETH')
})

test('cupom inválido, expirado e vazio mostram erro associado ao campo', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await openCart(page)

  const field = page.getByLabel('Cupom de desconto')
  const apply = page.getByRole('button', { name: 'Aplicar' })

  await apply.click()
  await expect(page.getByText('Informe o código do cupom.')).toBeVisible()

  await field.fill('NAOEXISTE')
  await apply.click()
  await expect(page.getByText('Cupom inválido.')).toBeVisible()
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await field.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Cupom inválido.')

  await field.fill('EXPIRADO20')
  await apply.click()
  await expect(page.getByText('Este cupom expirou.')).toBeVisible()

  // Nada foi aplicado: o total segue sem desconto.
  await expect(page.getByTestId('summary-discount')).toHaveText('(-) 00.00')
  await expect(page.getByTestId('summary-total')).toHaveText('1.1945 ETH')
})

test('itens do visitante são preservados ao entrar na conta', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await expect(cartLink(page, 'Carrinho, 1 item')).toBeVisible()

  await signIn(page, ana)

  await expect(cartLink(page, 'Carrinho, 1 item')).toBeVisible()
  await openCart(page)
  await expect(row(page, EMERALD)).toBeVisible()
})

test('troca de usuário: o carrinho de cada conta é separado e persiste entre sessões', async ({ page }) => {
  await signIn(page, ana)
  await addToCart(page, 'nft-02')
  await expect(cartLink(page, 'Carrinho, 1 item')).toBeVisible()

  await signOut(page, ana.name)
  // Sem conta, o carrinho é o do visitante (vazio): nada da Ana aparece.
  await expect(cartLink(page, 'Carrinho')).toBeVisible()

  await signIn(page, bruno)
  await openCart(page)
  await expect(page.getByTestId('cart-empty')).toBeVisible()
  await expect(row(page, SAGE)).toHaveCount(0)

  await signOut(page, bruno.name)
  await signIn(page, ana)
  await openCart(page)
  await expect(row(page, SAGE)).toBeVisible()
})

test('itens que ficaram indisponíveis são sinalizados e bloqueiam a finalização', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kurio.guest-cart', 'teste')
    localStorage.setItem(
      'mock-cart:guest:teste',
      JSON.stringify({
        items: [
          { nftId: 'nft-08', quantity: 1 },
          { nftId: 'nft-01', quantity: 9 },
          { nftId: 'nft-02', quantity: 1 },
        ],
        version: 1,
      }),
    )
  })
  await openCart(page)

  await expect(row(page, 'Golden Echo #333')).toContainText('Este NFT esgotou. Remova-o para continuar.')
  await expect(row(page, EMERALD)).toContainText('Só restam 5 unidades.')
  // Só o item comprável entra nos valores.
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.69 ETH')
  await expect(page.getByRole('alert').filter({ hasText: 'Resolva os itens indisponíveis' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()

  await row(page, 'Golden Echo #333').getByRole('button', { name: /Remover/ }).click()
  await row(page, EMERALD).getByRole('button', { name: /Remover/ }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'Resolva os itens indisponíveis' })).toHaveCount(0)
})

test('sessão expirada ao abrir o carrinho leva ao login e volta ao carrinho', async ({ page }) => {
  await signIn(page, ana)
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await page.evaluate(() => localStorage.setItem('mock-scenario', 'session-expired'))
  await cartLink(page).click()

  await expect(page).toHaveURL(/\/login\?.*reason=expired/)
  await expect(page).toHaveURL(/redirect=%2Fcarrinho/)

  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  const main = page.getByRole('main')
  await main.getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main.getByLabel('Senha', { exact: true }).fill(ana.password)
  await main.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/carrinho')
})

test('falha ao carregar o carrinho mostra erro e permite tentar de novo', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'error'))
  await page.goto('/carrinho')

  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o carrinho.', {
    timeout: 15_000,
  })
  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()

  await expect(page.getByTestId('cart-empty')).toBeVisible()
})

test('sugestões: 5 cards por página, com pontos para trocar de página', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'páginas de 5 só no desktop')
  await addToCart(page, 'nft-01')
  await openCart(page)

  const suggestions = page.getByTestId('recommended')
  await expect(suggestions.getByRole('heading', { name: 'Colecionadores também viram' })).toBeVisible()
  await expect(suggestions.getByTestId('nft-card')).toHaveCount(5)
  await expect(suggestions.getByTestId('nft-card').first()).toContainText('Cosmic Bloom #118')

  await suggestions.getByRole('button', { name: 'Página 2 de 3' }).click()
  await expect(suggestions.getByTestId('nft-card')).toHaveCount(5)
  await expect(suggestions.getByTestId('nft-card').first()).not.toContainText('Cosmic Bloom #118')
  await expect(suggestions.getByRole('button', { name: 'Página 2 de 3' })).toHaveAttribute('aria-current', 'true')
})

test('carrinho (Figma): tabela de 782 px, resumo de 332 px e botão de 332 × 40 no desktop', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1264, 'duas colunas só a partir de 1264 px')
  await addToCart(page, 'nft-01')
  await openCart(page)

  await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toContainText('Início/Mercado/Carrinho')
  const rowBox = (await row(page, EMERALD).boundingBox())!
  const button = (await page.getByRole('link', { name: 'Conectar e finalizar' }).boundingBox())!

  expect(rowBox.width).toBe(782)
  expect(rowBox.height).toBe(70)
  expect(button.width).toBe(332)
  expect(button.height).toBe(40)
  await expect(row(page, EMERALD)).toContainText('ID do token: #0042')
})
