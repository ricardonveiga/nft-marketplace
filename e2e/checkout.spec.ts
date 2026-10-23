import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana, bruno] = mockUsers

// nft-03: Neon Vessel #552, 1.99 ETH. Com a taxa de rede (0.0045) o total é 1.9945 ETH.
const NEON = 'Neon Vessel #552'

function main(page: Page) {
  return page.getByRole('main')
}

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
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
}

function walletStatus(page: Page, walletId: string) {
  return page.getByTestId(`wallet-status-${walletId}`)
}

async function connectPrimaryWallet(page: Page) {
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Conectada')
}

/** Ana autenticada, com o Neon Vessel no carrinho, no formulário de pagamento. */
async function startCheckout(page: Page) {
  await signIn(page, ana)
  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
}

async function fillAndReview(page: Page) {
  await main(page).getByLabel('Telefone').fill('(11) 91234-5678')
  await connectPrimaryWallet(page)
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeVisible()
}

async function acceptTerms(page: Page) {
  await page.getByLabel('Li e aceito os termos de compra de NFTs.').check()
}

function ordersOf(page: Page, userId: string) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ id: string }>,
    `mock-orders:${userId}`,
  )
}

test('visitante vai do carrinho ao login e volta ao pagamento', async ({ page }) => {
  await addToCart(page, 'nft-03')
  await page.goto('/carrinho')
  await page.getByRole('link', { name: 'Finalizar compra' }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/pagamento')
  // Os itens do visitante foram para a conta e aparecem no resumo.
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.getByTestId('summary-total')).toHaveText('1.9945 ETH')
})

test('pagamento com carrinho vazio avisa e leva ao catálogo', async ({ page }) => {
  await signIn(page, ana)
  await page.goto('/pagamento')

  await expect(page.getByTestId('checkout-empty')).toContainText('Seu carrinho está vazio.')
})

test('o formulário vem preenchido com os dados da conta e mostra o resumo da API', async ({ page }) => {
  await startCheckout(page)

  await expect(main(page).getByLabel('Nome completo')).toHaveValue(ana.name)
  await expect(main(page).getByLabel('E-mail', { exact: true })).toHaveValue(ana.email)
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.99 ETH')
  await expect(page.getByTestId('summary-fee')).toHaveText('0.0045 ETH')
  await expect(page.getByTestId('summary-total')).toHaveText('1.9945 ETH')
})

test('validação: campos inválidos e carteira desconectada mostram erros e focam o primeiro', async ({ page }) => {
  await startCheckout(page)

  await main(page).getByLabel('Nome completo').fill('')
  await main(page).getByLabel('E-mail', { exact: true }).fill('sem-arroba')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()

  await expect(main(page).getByLabel('Nome completo')).toBeFocused()
  await expect(page.getByText('Informe seu nome.')).toBeVisible()
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByText('Informe seu telefone.')).toBeVisible()
  await expect(page.getByText('Conecte a carteira para continuar.')).toBeVisible()
  await expect(main(page).getByLabel('Nome completo')).toHaveAttribute('aria-invalid', 'true')

  await main(page).getByLabel('Telefone').fill('123')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('Informe um telefone válido com DDD.')).toBeVisible()
})

test('carteira: conectar, desconectar e escolher a rede entre as que ela aceita', async ({ page }) => {
  await startCheckout(page)

  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Desconectada')
  await expect(page.getByLabel('Rede de pagamento')).toHaveValue('Ethereum')
  await expect(page.getByLabel('Rede de pagamento').locator('option:not([disabled])')).toHaveText(['Ethereum', 'Polygon'])

  await connectPrimaryWallet(page)
  await expect(page.getByRole('status').filter({ hasText: 'Carteira principal conectada.' })).toBeVisible()

  await page.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Desconectada')
  await expect(page.getByRole('status').filter({ hasText: 'Carteira desconectada.' })).toBeVisible()

  // A conexão fica guardada: sobrevive ao refresh.
  await connectPrimaryWallet(page)
  await page.reload()
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Conectada')
})

test('carteira que recusa a conexão mostra o erro e continua desconectada', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await startCheckout(page)

  await page.getByLabel('Usar outra carteira?').check()
  await page.getByRole('radio', { name: /Carteira secundária/ }).check()
  await expect(page.getByLabel('Rede de pagamento').locator('option:not([disabled])')).toHaveText(['Polygon', 'Solana'])
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'A conexão foi recusada na carteira' })).toBeVisible()
  await expect(walletStatus(page, 'wallet-ana-2')).toHaveText('Desconectada')
})

test('usuário sem carteiras cadastradas é avisado e não consegue seguir', async ({ page }) => {
  await page.goto('/cadastro')
  await main(page).getByLabel('Nome completo', { exact: true }).fill('Carla Mendes')
  await main(page).getByLabel('E-mail', { exact: true }).fill('carla@exemplo.com')
  await main(page).getByLabel('Senha', { exact: true }).fill('senha1234')
  await main(page).getByLabel('Confirmar senha', { exact: true }).fill('senha1234')
  await main(page).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL('/')

  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')

  await expect(page.getByText('Você ainda não tem carteiras cadastradas.')).toBeVisible()
  await main(page).getByLabel('Telefone').fill('11912345678')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('Selecione uma carteira.')).toBeVisible()
})

test('revisão mostra os dados, permite voltar e editar e guarda o rascunho', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)

  const review = page.getByTestId('review-details')
  await expect(review).toContainText(ana.name)
  await expect(review).toContainText(ana.email)
  await expect(review).toContainText('(11) 91234-5678')
  await expect(review).toContainText('Carteira principal')
  await expect(review).toContainText('0x71C7…976F')
  await expect(review).toContainText('Ethereum')
  await expect(page.getByRole('listitem').filter({ hasText: 'Etapas' })).toHaveCount(0)
  await expect(page.getByRole('list', { name: 'Etapas do pagamento' }).getByRole('listitem').nth(1)).toHaveAttribute('aria-current', 'step')

  await page.getByRole('button', { name: 'Voltar e editar' }).click()
  await expect(main(page).getByLabel('Telefone')).toHaveValue('(11) 91234-5678')

  // O rascunho também sobrevive ao refresh (a conexão da carteira vem do servidor).
  await page.reload()
  await expect(main(page).getByLabel('Telefone')).toHaveValue('(11) 91234-5678')
})

test('confirmar exige aceitar os termos', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByText('Aceite os termos de compra para continuar.')).toBeVisible()
  await expect(page).toHaveURL('/pagamento')
  expect(await ordersOf(page, 'user-ana')).toHaveLength(0)
})

test('pagamento confirmado: pedido pendente vira confirmado, carrinho esvazia e o pedido persiste', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pedido confirmado')
  await expect(page.getByTestId('order-id')).toHaveText('KUR-000001')
  await expect(page.getByTestId('order-transaction')).toHaveText(/^0x[0-9a-f]{64}$/)
  await expect(page.getByTestId('order-item')).toContainText(NEON)
  await expect(page.getByTestId('order-subtotal')).toHaveText('1.99 ETH')
  await expect(page.getByTestId('order-total')).toHaveText('1.9945 ETH')

  // O carrinho foi esvaziado e o contador do header zerou.
  await expect(page.getByRole('link', { name: 'Carrinho', exact: true })).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-empty')).toBeVisible()

  // O pedido é recuperável depois de refresh.
  await page.goto('/pedido/KUR-000001')
  await expect(page.getByTestId('order-confirmed')).toBeVisible()
})

test('clique repetido em confirmar cria um único pedido', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)

  // Três cliques no mesmo instante, antes de o React atualizar qualquer coisa.
  await page.getByRole('button', { name: 'Confirmar compra' }).evaluate((button: HTMLElement) => {
    button.click()
    button.click()
    button.click()
  })

  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  expect(await ordersOf(page, 'user-ana')).toHaveLength(1)
})

test('timeout depois da criação: reenviar recupera o mesmo pedido, sem duplicar', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)

  // O pedido é criado, mas a resposta nunca chega (uma vez só).
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'order-timeout'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'Não recebemos a resposta do servidor' })).toBeVisible()
  await expect(page).toHaveURL('/pagamento')
  expect(await ordersOf(page, 'user-ana')).toHaveLength(1)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  expect(await ordersOf(page, 'user-ana')).toHaveLength(1)
})

test('timeout seguido de refresh também não duplica o pedido', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'order-timeout'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Não recebemos a resposta' })).toBeVisible()

  // Recarrega a página e tenta de novo: a mesma chave (guardada na sessão) recupera o pedido.
  await page.reload()
  await expect(walletStatus(page, 'wallet-ana-1')).toHaveText('Conectada')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await acceptTerms(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  expect(await ordersOf(page, 'user-ana')).toHaveLength(1)
})

test('valores que mudam antes de confirmar exigem nova confirmação', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)

  // Outra aba/dispositivo altera o carrinho depois da revisão.
  await page.evaluate(async () => {
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kurio.session')}`,
        'X-Guest-Cart': localStorage.getItem('kurio.guest-cart') ?? '',
      },
      body: JSON.stringify({ nftId: 'nft-02' }),
    })
  })

  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'Os valores do seu pedido mudaram' })).toBeVisible()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByTestId('summary-total')).toHaveText('3.6845 ETH')
  await expect(page.getByLabel('Li e aceito os termos de compra de NFTs.')).not.toBeChecked()
  expect(await ordersOf(page, 'user-ana')).toHaveLength(0)

  // Só confirma de novo depois de o usuário aceitar os novos valores.
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Aceite os termos de compra para continuar.')).toBeVisible()
  await acceptTerms(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-total')).toHaveText('3.6845 ETH', { timeout: 10_000 })
})

test('carteira desconectada depois da revisão volta ao formulário com o erro', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)

  await page.evaluate(async () => {
    await fetch('/api/wallets/connection', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kurio.session')}` },
    })
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.getByText('Conecte a carteira para concluir o pagamento.')).toBeVisible()
  expect(await ordersOf(page, 'user-ana')).toHaveLength(0)
})

test('pagamento recusado mantém o carrinho e permite tentar de novo com outro pedido', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'payment-declined'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-declined')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pagamento recusado')
  await expect(page.getByTestId('order-declined')).toContainText('Seu carrinho foi mantido.')

  // Com a rede de volta, uma nova tentativa gera um novo pedido (chave nova).
  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await page.getByRole('link', { name: 'Tentar novamente' }).click()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByTestId('summary-total')).toHaveText('1.9945 ETH')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await acceptTerms(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/pedido\/KUR-000002$/)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
})

test('itens indisponíveis bloqueiam a revisão', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'mock-cart:user:user-ana',
      JSON.stringify({ items: [{ nftId: 'nft-08', quantity: 1 }], version: 1 }),
    ),
  )
  await signIn(page, ana)
  await page.goto('/pagamento')

  await expect(page.getByRole('alert').filter({ hasText: 'Há itens indisponíveis no carrinho.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled()
})

test('sessão expirada na hora de pagar leva ao login e volta ao pagamento sem perder o rascunho', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)

  await page.evaluate(() => localStorage.setItem('mock-scenario', 'session-expired'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/login\?.*reason=expired/)
  await expect(page).toHaveURL(/redirect=%2Fpagamento/)

  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/pagamento')
  await expect(main(page).getByLabel('Telefone')).toHaveValue('(11) 91234-5678')
  await expect(page.getByTestId('summary-total')).toHaveText('1.9945 ETH')
})

test('o pedido de um usuário não aparece para outro', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await signIn(page, bruno, '/pedido/KUR-000001')

  await expect(page.getByTestId('order-not-found')).toBeVisible()
})

test('pedido inexistente mostra não encontrado', async ({ page }) => {
  await signIn(page, ana, '/pedido/KUR-999999')

  await expect(page.getByTestId('order-not-found')).toBeVisible()
})

test('sem rolagem horizontal no pagamento e na confirmação em 390, 768 e 1440 px', async ({ page }) => {
  await startCheckout(page)
  await fillAndReview(page)
  await acceptTerms(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/pedido/KUR-000001', '/pagamento']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${path} em ${width}px`).toBe(0)
    }
  }
})

test('perfil do colecionador: campos opcionais validam, vão na revisão e ficam no recibo', async ({ page }) => {
  // Os campos opcionais existem a partir de 768 px (o frame mobile do Figma não os tem).
  await page.setViewportSize({ width: 1024, height: 900 })
  await startCheckout(page)
  await main(page).getByLabel('Telefone').fill('(11) 91234-5678')
  await connectPrimaryWallet(page)

  await main(page).getByLabel('Nome de usuário (opcional)').fill('a')
  await main(page).getByLabel('Nome ENS (opcional)').fill('ana')
  await main(page).getByLabel('Código de indicação (opcional)').fill('!!')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()

  await expect(main(page).getByLabel('Nome de usuário (opcional)')).toBeFocused()
  await expect(page.getByText('Use de 3 a 30 letras, números, ponto ou sublinhado.')).toBeVisible()
  await expect(page.getByText('Informe um nome ENS válido, como nome.eth.')).toBeVisible()
  await expect(page.getByText('O código tem de 4 a 12 letras ou números.')).toBeVisible()

  await main(page).getByLabel('Nome de usuário (opcional)').fill('ana_souza')
  await main(page).getByLabel('Nome ENS (opcional)').fill('ana.eth')
  await main(page).getByLabel('Código de indicação (opcional)').fill('KURIO2026')
  await main(page).getByLabel('Observação (opcional)').fill('Entregar na carteira principal.')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()

  await expect(page.getByTestId('review-details')).toContainText('@ana_souza')
  await page.getByLabel('Li e aceito os termos de compra de NFTs.').check()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('order-collector-username')).toHaveText('ana_souza')
  await expect(page.getByTestId('order-collector-ens')).toHaveText('ana.eth')
  await expect(page.getByTestId('order-collector-referral')).toHaveText('KURIO2026')
  await expect(page.getByTestId('order-collector-notes')).toHaveText('Entregar na carteira principal.')
})

test('"Usar outra carteira?": a principal vem sozinha, a outra aparece ao marcar e some ao desmarcar', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await startCheckout(page)

  const details = page.getByTestId('checkout-wallet-details')
  await expect(page.getByRole('radio')).toHaveCount(1)
  await expect(details).toContainText('Principal')
  await expect(details).toContainText('0x')

  await page.getByLabel('Usar outra carteira?').check()
  await expect(page.getByRole('radio')).toHaveCount(2)
  await page.getByRole('radio', { name: /Carteira secundária/ }).check()
  await expect(details).toContainText('Secundária')

  await page.getByLabel('Usar outra carteira?').uncheck()
  await expect(page.getByRole('radio')).toHaveCount(1)
  await expect(page.getByRole('radio', { name: /Carteira principal/ })).toBeChecked()
  await expect(details).toContainText('Principal')
})

test('mobile (abaixo de 768 px): sem campos opcionais, e o valor digitado antes não é enviado', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await startCheckout(page)
  await main(page).getByLabel('Telefone').fill('(11) 91234-5678')
  await connectPrimaryWallet(page)
  // Valor inválido de propósito: escondido, não pode travar o envio.
  await main(page).getByLabel('Nome de usuário (opcional)').fill('a')

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(main(page).getByLabel('Nome de usuário (opcional)')).toHaveCount(0)
  await expect(main(page).getByLabel('Nome ENS (opcional)')).toHaveCount(0)
  await expect(main(page).getByLabel('Código de indicação (opcional)')).toHaveCount(0)
  await expect(main(page).getByLabel('Observação (opcional)')).toHaveCount(0)

  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByLabel('Li e aceito os termos de compra de NFTs.').check()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('order-collector-username')).toHaveCount(0)
})

test('mobile (abaixo de 768 px): todas as carteiras aparecem, sem "Usar outra carteira?" nem tipo/endereço', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startCheckout(page)

  await expect(page.getByRole('radio')).toHaveCount(2)
  await expect(page.getByLabel('Usar outra carteira?')).toHaveCount(0)
  await expect(page.getByTestId('checkout-wallet-details')).toHaveCount(0)
})
