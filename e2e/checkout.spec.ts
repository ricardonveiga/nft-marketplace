import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'
import {
  confirmButton,
  connectWallet,
  isCompact,
  fillCollector,
  paymentHeading,
  main,
  ordersOf,
  readyToPay,
  walletStatus,
} from './support/checkout'

const [ana, bruno] = mockUsers

// nft-03: Neon Vessel #552, 1.99 ETH. Com a taxa de rede (0.0045) o total é 1.9945 ETH.
const NEON = 'Neon Vessel #552'

async function signIn(page: Page, user: { email: string; password: string }, redirect = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await main(page).getByLabel('E-mail', { exact: true }).fill(user.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(user.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  // Só segue quando o login terminou; navegar antes aborta a requisição e a sessão não é gravada.
  await expect(page).not.toHaveURL(/\/login/)
}

async function addToCart(page: Page, nftId: string) {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
}

/** Ana autenticada, com o Neon Vessel no carrinho, no formulário de pagamento. */
async function startCheckout(page: Page) {
  await signIn(page, ana)
  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')
  await expect(paymentHeading(page)).toBeVisible()
}

test('visitante vai do carrinho ao login e volta ao pagamento', async ({ page }) => {
  await addToCart(page, 'nft-03')
  await page.goto('/carrinho')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/pagamento')
  await expect(paymentHeading(page)).toBeVisible()
  await expect(page.getByTestId('summary-total')).toHaveText('1.9945 ETH')
})

test('pagamento com carrinho vazio avisa e leva ao catálogo', async ({ page }) => {
  await signIn(page, ana)
  await page.goto('/pagamento')

  await expect(page.getByTestId('checkout-empty')).toContainText('Seu carrinho está vazio.')
})

test('o formulário vem preenchido com os dados da conta e mostra o resumo da API', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)

  await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toContainText(
    'Início/Mercado/Pagamento',
  )
  await expect(main(page).getByLabel('Nome de exibição')).toHaveValue(ana.name)
  await expect(main(page).getByLabel('Nome do perfil')).toHaveValue(ana.name)
  await expect(main(page).getByLabel(/^E-mail/)).toHaveValue(ana.email)
  await expect(main(page).getByLabel('Nome de usuário')).toHaveValue(ana.email.split('@')[0])

  await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: NEON })).toContainText('ID do token: #0552')
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.99 ETH')
  await expect(page.getByTestId('summary-discount')).toHaveText('(-) 00.00')
  await expect(page.getByTestId('summary-fee')).toHaveText('0.0045 ETH')
  await expect(page.getByTestId('summary-total')).toHaveText('1.9945 ETH')
})

test('validação: obrigatórios vazios e carteira desconectada mostram erros e focam o primeiro', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)

  await main(page).getByLabel('Nome de exibição').fill('')
  await main(page).getByLabel(/^E-mail/).fill('sem-arroba')
  await confirmButton(page).click()

  await expect(main(page).getByLabel('Nome de exibição')).toBeFocused()
  await expect(main(page).getByLabel('Nome de exibição')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Selecione o tipo de carteira.')).toBeVisible()
  await expect(page.getByText('Informe o código de indicação.')).toBeVisible()
  await expect(page.getByText('Informe o nome ENS.')).toBeVisible()
  expect(await ordersOf(page, 'user-ana')).toHaveLength(0)
})

test('validação: formatos inválidos dos campos', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)

  await main(page).getByLabel('Nome de usuário').fill('a')
  await main(page).getByLabel('Nome do perfil').fill('')
  await main(page).getByLabel('Código de indicação').fill('!!')
  await main(page).getByLabel(/^Nome ENS/).fill('nome inválido')
  await confirmButton(page).click()

  await expect(page.getByText('Informe o nome do perfil.')).toBeVisible()
  await expect(page.getByText('O código tem de 4 a 12 letras ou números.')).toBeVisible()
  await expect(page.getByText('Use letras, números e hífens no nome ENS.')).toBeVisible()
})

test('carteira: conectar e desconectar', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)

  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Desconectada')
  await connectWallet(page)

  await page.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Desconectada')
  await expect(page.getByRole('status').filter({ hasText: 'Carteira desconectada.' })).toBeVisible()

  // A conexão fica guardada: sobrevive ao refresh.
  await connectWallet(page)
  await page.reload()
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Conectada')
})

test('usuário sem carteiras cadastradas é avisado', async ({ page }) => {
  await page.goto('/cadastro')
  await main(page).getByLabel('Nome de usuário', { exact: true }).fill('Carla Mendes')
  await main(page).getByLabel('E-mail', { exact: true }).fill('carla@exemplo.com')
  await main(page).getByLabel('Senha', { exact: true }).fill('senha1234')
  await main(page).getByLabel('Confirmar senha', { exact: true }).fill('senha1234')
  await main(page).getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(page).toHaveURL('/')

  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')

  await expect(page.getByText('Você ainda não tem carteiras cadastradas.')).toBeVisible()
  await fillCollector(page)
  await confirmButton(page).click()
  await expect(page.getByText('Você ainda não tem carteiras cadastradas.')).toBeVisible()
})

test('o rascunho sobrevive ao refresh (a conexão da carteira vem do servidor)', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)
  await readyToPay(page, { referralCode: 'RASCUNHO1', ensName: 'rascunho' })
  await main(page).getByLabel('Observação do colecionador (opcional)').fill('Anotação do rascunho.')

  await page.reload()

  await expect(main(page).getByLabel('Tipo de carteira')).toHaveValue('MetaMask')
  await expect(main(page).getByLabel('Código de indicação')).toHaveValue('RASCUNHO1')
  await expect(main(page).getByLabel(/^Nome ENS/)).toHaveValue('rascunho')
  await expect(main(page).getByLabel('Observação do colecionador (opcional)')).toHaveValue('Anotação do rascunho.')
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Conectada')
})

test('pagamento confirmado: pedido pendente vira confirmado, carrinho esvazia e o pedido persiste', async ({ page }) => {
  await startCheckout(page)
  await readyToPay(page)
  await confirmButton(page).click()

  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('order-id')).toHaveText('KUR-000001')
  await expect(page.getByTestId('order-item')).toContainText(NEON)
  await expect(page.getByTestId('order-total')).toHaveText('1.9945 ETH')

  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-empty')).toBeVisible()

  await page.goto('/pedido/KUR-000001')
  await expect(page.getByTestId('order-confirmed')).toBeVisible()
})

test('o recibo guarda o perfil do colecionador, inclusive os campos opcionais', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)
  await readyToPay(page, { referralCode: 'KURIO2026', ensName: 'ana-souza', walletType: 'Coinbase Wallet' })
  await main(page).getByLabel('Observação do colecionador (opcional)').fill('Entregar na carteira principal.')
  await confirmButton(page).click()

  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('order-collector-name')).toHaveText(ana.name)
  await expect(page.getByTestId('order-collector-email')).toHaveText(ana.email)
  await expect(page.getByTestId('order-collector-wallet-type')).toHaveText('Coinbase Wallet')
  await expect(page.getByTestId('order-collector-ens')).toHaveText('ana-souza.eth')
  await expect(page.getByTestId('order-collector-referral')).toHaveText('KURIO2026')
  await expect(page.getByTestId('order-collector-notes')).toHaveText('Entregar na carteira principal.')
})

test('clique repetido em confirmar cria um único pedido', async ({ page }) => {
  await startCheckout(page)
  await readyToPay(page)

  await confirmButton(page).evaluate((button: HTMLElement) => {
    button.click()
    button.click()
    button.click()
  })

  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  expect(await ordersOf(page, 'user-ana')).toHaveLength(1)
})

test('carteira desconectada antes de confirmar não cria o pedido', async ({ page }) => {
  test.skip(isCompact(page), 'o formulário do desktop não existe no mobile (Figma)')
  await startCheckout(page)
  await fillCollector(page)
  await confirmButton(page).click()

  await expect(paymentHeading(page)).toBeVisible()
  await expect(page).toHaveURL('/pagamento')
  expect(await ordersOf(page, 'user-ana')).toHaveLength(0)
})

test('o pedido de um usuário não aparece para outro', async ({ page }) => {
  await startCheckout(page)
  await readyToPay(page)
  await confirmButton(page).click()
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  await page.goto('/')
  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await signIn(page, bruno, '/pedido/KUR-000001')

  await expect(page.getByTestId('order-not-found')).toBeVisible()
})

test('pedido inexistente mostra não encontrado', async ({ page }) => {
  await signIn(page, ana, '/pedido/KUR-999999')

  await expect(page.getByTestId('order-not-found')).toBeVisible()
})

test('pagamento (Figma): campos de 370 × 40 e botão de 405 × 45 no desktop', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1264, 'duas colunas só a partir de 1264 px')
  await startCheckout(page)

  const field = (await main(page).getByLabel('Nome de exibição').boundingBox())!
  const second = (await main(page).getByLabel('Nome de usuário').boundingBox())!
  const button = (await confirmButton(page).boundingBox())!

  expect(field.width).toBe(370)
  expect(field.height).toBe(40)
  expect(second.x - (field.x + field.width)).toBe(24)
  expect(button.width).toBe(405)
  expect(button.height).toBe(45)
})

test('pagamento mobile (Figma): carteiras em cartões de 93 px, tipos de 65 px e botão de 60 px', async ({ page }) => {
  test.skip(!isCompact(page), 'só no mobile')
  await startCheckout(page)

  const card = (await page.locator('#checkout-wallet li').first().boundingBox())!
  const type = (await page.getByText('MetaMask', { exact: true }).locator('xpath=ancestor::label').boundingBox())!
  const button = (await confirmButton(page).boundingBox())!

  expect(card.height).toBe(93)
  expect(type.height).toBe(65)
  expect(button.height).toBe(60)
  // A carteira escolhida é conectada sozinha e os dados do colecionador vêm dela.
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Conectada')
  await confirmButton(page).click()
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  expect((await ordersOf(page, 'user-ana'))).toHaveLength(1)
})
