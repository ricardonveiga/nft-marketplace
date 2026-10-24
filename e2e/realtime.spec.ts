import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'
import { readyToPay } from './support/checkout'

const [ana, bruno] = mockUsers

// Tipos mínimos do painel de controle do mock (window.__mockControl).
type NftEvent = {
  eventId: string
  type: 'nft.updated'
  resource: { type: 'nft'; id: string }
  version: number
  occurredAt: string
  data: Record<string, unknown>
}

type Control = {
  updateNft: (id: string, changes: { priceEth?: string; availableQuantity?: number }) => NftEvent | null
  replay: (event: NftEvent) => void
  emit: (event: NftEvent) => void
  disconnect: () => void
  setOffline: (offline: boolean) => void
  connections: () => Array<{ userId: string | null }>
}

function control(page: Page) {
  return {
    updateNft: (id: string, changes: { priceEth?: string; availableQuantity?: number }) =>
      page.evaluate(
        ([nftId, patch]) => (window as unknown as { __mockControl: Control }).__mockControl.updateNft(nftId as string, patch as never),
        [id, changes] as const,
      ) as Promise<NftEvent>,
    replay: (event: NftEvent) =>
      page.evaluate((e) => (window as unknown as { __mockControl: Control }).__mockControl.replay(e), event),
    emit: (event: NftEvent) =>
      page.evaluate((e) => (window as unknown as { __mockControl: Control }).__mockControl.emit(e), event),
    setOffline: (offline: boolean) =>
      page.evaluate((value) => (window as unknown as { __mockControl: Control }).__mockControl.setOffline(value), offline),
    disconnect: () =>
      page.evaluate(() => (window as unknown as { __mockControl: Control }).__mockControl.disconnect()),
    // O painel só existe depois de o mock ligar: antes disso, não há conexões.
    connections: () =>
      page.evaluate(
        () => (window as unknown as { __mockControl?: Control }).__mockControl?.connections() ?? [],
      ),
  }
}

/** Espera o cliente Socket.IO real conectar ao servidor simulado. */
async function waitForSocket(page: Page) {
  await expect.poll(async () => (await control(page).connections()).length).toBe(1)
}

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

function card(page: Page, name: string) {
  return page.getByTestId('nft-card').filter({ hasText: name })
}

function countRequests(page: Page, urlPart: string) {
  const counter = { count: 0 }

  page.on('request', (request) => {
    if (request.method() === 'GET' && request.url().includes(urlPart)) {
      counter.count += 1
    }
  })

  return counter
}

test('o cliente Socket.IO real conecta ao servidor simulado', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  await waitForSocket(page)
  expect(await control(page).connections()).toEqual([{ userId: null }])
  await expect(page.getByTestId('connection-banner')).toHaveCount(0)
})

test('catálogo: o preço muda na tela sem recarregar e o REST concorda', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await waitForSocket(page)
  await expect(card(page, 'Emerald Ape #042')).toContainText('1.19 ETH')

  await control(page).updateNft('nft-01', { priceEth: '1.05' })

  await expect(card(page, 'Emerald Ape #042')).toContainText('1.05 ETH')
  await expect(card(page, 'Emerald Ape #042')).toContainText('Preço anterior: 1.19 ETH')

  // Os mocks mantêm uma única fonte de verdade: depois do refresh o REST devolve o mesmo.
  await page.reload()
  await expect(card(page, 'Emerald Ape #042')).toContainText('1.05 ETH')
})

test('catálogo: NFT esgota e volta a ficar disponível em tempo real', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await waitForSocket(page)
  await expect(card(page, 'Sage Nomad #009').getByText('Esgotado')).toHaveCount(0)

  await control(page).updateNft('nft-02', { availableQuantity: 0 })
  await expect(card(page, 'Sage Nomad #009').getByText('Esgotado')).toBeVisible()

  await control(page).updateNft('nft-02', { availableQuantity: 12 })
  await expect(card(page, 'Sage Nomad #009').getByText('Esgotado')).toHaveCount(0)
})

test('detalhe: preço e disponibilidade ao vivo, com aviso acessível', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await expect(page.getByTestId('detail-price')).toHaveText('1.99 ETH')
  await waitForSocket(page)

  await control(page).updateNft('nft-03', { priceEth: '2.50' })

  await expect(page.getByTestId('detail-price')).toHaveText('2.50 ETH')
  await expect(
    page.getByTestId('realtime-notices').getByText('Neon Vessel #552: o preço mudou de 1.99 ETH para 2.50 ETH.'),
  ).toBeVisible()

  await control(page).updateNft('nft-03', { availableQuantity: 0 })

  await expect(page.getByText('Esta edição está esgotada.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toHaveCount(0)
  await expect(page.getByTestId('realtime-notices').getByText('Neon Vessel #552 esgotou.')).toBeVisible()
})

test('carrinho: valores recalculados pela API e item que esgota é sinalizado', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await page.goto('/carrinho')
  await expect(page.getByTestId('summary-total')).toHaveText('1.1945 ETH')
  await waitForSocket(page)

  await control(page).updateNft('nft-01', { priceEth: '1.05' })

  await expect(page.getByTestId('cart-line-total')).toHaveText('1.05 ETH')
  await expect(page.getByTestId('summary-subtotal')).toHaveText('1.05 ETH')
  await expect(page.getByTestId('summary-total')).toHaveText('1.0545 ETH')
  await expect(page.getByTestId('realtime-notice')).toContainText('o preço mudou de 1.19 ETH para 1.05 ETH')

  await control(page).updateNft('nft-01', { availableQuantity: 0 })

  await expect(page.getByTestId('cart-item')).toContainText('Este NFT esgotou. Remova-o para continuar.')
  await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeDisabled()
})

test('pagamento: mudança de preço durante a revisão exige nova confirmação', async ({ page }) => {
  await signIn(page, ana)
  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')
  await readyToPay(page)
  await waitForSocket(page)

  await control(page).updateNft('nft-03', { priceEth: '2.10' })

  // A tela avisa sozinha, sem o usuário tentar enviar.
  await expect(page.getByRole('alert').filter({ hasText: 'Os valores do pedido mudaram' })).toBeVisible()
  await expect(page.getByTestId('summary-total')).toHaveText('2.1045 ETH')
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()

  await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-total')).toHaveText('2.1045 ETH', { timeout: 10_000 })
})

async function reviewAndConfirm(page: Page) {
  await signIn(page, ana)
  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')
  await readyToPay(page)
  await waitForSocket(page)
}

test('order.updated: o pedido pendente é confirmado pelo socket, sem polling', async ({ page }) => {
  await reviewAndConfirm(page)
  const orderReads = countRequests(page, '/api/orders/')

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  // Uma leitura (a abertura da página) basta: o desfecho veio pelo evento.
  expect(orderReads.count).toBeLessThanOrEqual(1)
  await expect(page.getByTestId('realtime-notices')).toContainText('Pagamento do pedido KUR-000001 confirmado.')
  // O carrinho foi esvaziado e o contador do header zerou.
  await expect(page.getByRole('link', { name: 'Carrinho', exact: true })).toBeVisible()
})

test('order.updated: a recusa também chega pelo socket', async ({ page }) => {
  await reviewAndConfirm(page)
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'payment-declined'))
  const orderReads = countRequests(page, '/api/orders/')

  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-declined')).toBeVisible({ timeout: 10_000 })
  expect(orderReads.count).toBeLessThanOrEqual(1)
  await expect(page.getByTestId('realtime-notices')).toContainText('Pagamento do pedido KUR-000001 recusado.')
})

test('evento duplicado não repete avisos nem releituras', async ({ page }) => {
  await addToCart(page, 'nft-01')
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-item')).toBeVisible()
  await waitForSocket(page)
  const cartReads = countRequests(page, '/api/cart')

  const event = await control(page).updateNft('nft-01', { priceEth: '1.05' })
  await expect(page.getByTestId('summary-total')).toHaveText('1.0545 ETH')
  const readsAfterFirst = cartReads.count
  expect(readsAfterFirst).toBeGreaterThan(0)

  await control(page).replay(event)
  await control(page).replay(event)
  await page.waitForTimeout(600)

  expect(cartReads.count).toBe(readsAfterFirst)
  await expect(page.getByTestId('realtime-notice')).toHaveCount(1)
})

test('evento antigo ou fora de ordem não regride um estado mais recente', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await expect(page.getByTestId('detail-price')).toHaveText('1.99 ETH')
  await waitForSocket(page)

  const event = await control(page).updateNft('nft-03', { priceEth: '1.80' })
  await expect(page.getByTestId('detail-price')).toHaveText('1.80 ETH')

  // Chega primeiro uma versão mais nova (v+2) e só depois a v+1, que ficou para trás.
  await control(page).emit({
    ...event,
    eventId: 'sintetico-novo',
    version: event.version + 2,
    data: { ...event.data, priceEth: '3.33' },
  })
  await expect(page.getByTestId('detail-price')).toHaveText('3.33 ETH')

  await control(page).emit({
    ...event,
    eventId: 'sintetico-antigo',
    version: event.version + 1,
    data: { ...event.data, priceEth: '4.44' },
  })
  // E um evento claramente antigo (a própria versão original, com outro eventId).
  await control(page).emit({
    ...event,
    eventId: 'sintetico-velho',
    data: { ...event.data, priceEth: '5.55' },
  })
  await page.waitForTimeout(600)

  await expect(page.getByTestId('detail-price')).toHaveText('3.33 ETH')
})

test('desconexão: aviso, reconexão sozinha e releitura do que foi perdido', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await waitForSocket(page)
  await expect(card(page, 'Emerald Ape #042')).toContainText('1.19 ETH')

  await control(page).setOffline(true)
  await expect(page.getByTestId('connection-banner')).toContainText('Sem conexão em tempo real')

  // Mudança que acontece com o servidor fora do ar: nenhum evento é entregue.
  await control(page).updateNft('nft-01', { priceEth: '0.90' })
  await page.waitForTimeout(500)
  await expect(card(page, 'Emerald Ape #042')).toContainText('1.19 ETH')

  // Ao voltar, o cliente reconecta sozinho e relê o que perdeu.
  await control(page).setOffline(false)
  await expect(page.getByTestId('connection-banner')).toHaveCount(0, { timeout: 10_000 })
  await expect(card(page, 'Emerald Ape #042')).toContainText('0.90 ETH')
  await waitForSocket(page)
})

test('queda breve: o cliente reconecta e continua recebendo eventos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await waitForSocket(page)

  await control(page).disconnect()
  await expect(page.getByTestId('connection-banner')).toHaveCount(0, { timeout: 10_000 })
  await waitForSocket(page)

  await control(page).updateNft('nft-01', { priceEth: '1.10' })
  await expect(card(page, 'Emerald Ape #042')).toContainText('1.10 ETH')
})

test('pedido pendente é retomado depois de uma queda de conexão', async ({ page }) => {
  await reviewAndConfirm(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/KUR-000001$/)
  // O servidor cai antes de decidir o pedido: o evento de desfecho se perde.
  await control(page).setOffline(true)
  await page.waitForTimeout(1500)
  await control(page).setOffline(false)

  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('connection-banner')).toHaveCount(0, { timeout: 10_000 })
})

test('a assinatura de pedidos acompanha o usuário: entra, sai e troca', async ({ page }) => {
  await page.goto('/')
  await waitForSocket(page)
  expect(await control(page).connections()).toEqual([{ userId: null }])

  await signIn(page, ana)
  await expect.poll(async () => (await control(page).connections())[0]?.userId).toBe('user-ana')

  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect.poll(async () => (await control(page).connections())[0]?.userId).toBeNull()

  await signIn(page, bruno)
  await expect.poll(async () => (await control(page).connections())[0]?.userId).toBe('user-bruno')
})
