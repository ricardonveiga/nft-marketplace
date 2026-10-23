import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana] = mockUsers

const ANA_PRIMARY_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const MARKETPLACE_ADDRESS = '0x5Ec1a7E0b0fF3Ac91D2e4b6F8c3A7d95E10b2C4F'

function main(page: Page) {
  return page.getByRole('main')
}

async function signIn(page: Page, redirect = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  // Só segue quando o login terminou; navegar antes aborta a requisição e a sessão não é gravada.
  await expect(page).not.toHaveURL(/\/login/)
}

async function addToCart(page: Page, nftId: string, times = 1) {
  await page.goto(`/nft/${nftId}`)

  for (let attempt = 0; attempt < times; attempt++) {
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  }
}

/** Do formulário de pagamento até o clique em "Confirmar pagamento". */
async function payOrder(page: Page) {
  await page.goto('/pagamento')
  await main(page).getByLabel('Telefone').fill('(11) 91234-5678')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByTestId('wallet-status-wallet-ana-1')).toHaveText('Conectada')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByLabel('Li e aceito os termos de compra de NFTs.').check()
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click()
}

/** Cria e confirma um pedido simples (Neon Vessel #552) e devolve a referência da transação. */
async function placeSimpleOrder(page: Page) {
  await signIn(page)
  await addToCart(page, 'nft-03')
  await payOrder(page)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  return (await page.getByTestId('order-transaction').textContent())!
}

test('recibo confirmado mostra número, datas, itens, valores, pagamento e colecionador', async ({ page }) => {
  const hash = await placeSimpleOrder(page)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pedido confirmado')
  await expect(page.getByText('Obrigado, Ana! Seu pagamento foi confirmado na rede Ethereum.')).toBeVisible()
  await expect(page.getByTestId('order-id')).toHaveText('KUR-000001')
  await expect(page.getByTestId('order-created')).toContainText('(UTC)')
  await expect(page.getByTestId('order-settled')).toContainText('(UTC)')

  await expect(page.getByTestId('order-item')).toContainText('Neon Vessel #552')
  await expect(page.getByTestId('order-item')).toContainText('Neon Vessels · Edição 552/800')
  await expect(page.getByTestId('order-item')).toContainText('1 × 1.99 ETH')
  await expect(page.getByTestId('order-subtotal')).toHaveText('1.99 ETH')
  await expect(page.getByTestId('order-fee')).toHaveText('0.0045 ETH')
  await expect(page.getByTestId('order-total')).toHaveText('1.9945 ETH')

  await expect(page.getByTestId('order-wallet')).toContainText('Carteira principal · 0x71C7…976F')
  await expect(page.getByTestId('order-network')).toHaveText('Ethereum')
  await expect(page.getByTestId('order-collector-name')).toHaveText(ana.name)
  await expect(page.getByTestId('order-collector-email')).toHaveText(ana.email)
  await expect(page.getByTestId('order-collector-phone')).toHaveText('(11) 91234-5678')

  expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
  await expect(page).toHaveTitle('Pedido KUR-000001 | Kurio')
})

test('pedido com vários itens e cupom: quantidades, desconto e total', async ({ page }) => {
  await signIn(page)
  await addToCart(page, 'nft-03')
  await addToCart(page, 'nft-01', 2)
  await page.goto('/carrinho')
  await page.getByLabel('Cupom de desconto').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('summary-discount')).toBeVisible()

  await payOrder(page)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  await expect(page.getByTestId('order-item')).toHaveCount(2)
  await expect(page.getByTestId('order-item').filter({ hasText: 'Emerald Ape #042' })).toContainText('2 × 1.19 ETH')
  await expect(page.getByTestId('order-item').filter({ hasText: 'Emerald Ape #042' }).getByTestId('order-item-total')).toHaveText('2.38 ETH')
  await expect(page.getByText('Desconto (KURIO10)')).toBeVisible()
  // 1.99 + 2.38 = 4.37; desconto de 10% = 0.437; taxa 0.0045; total 3.9375.
  await expect(page.getByTestId('order-subtotal')).toHaveText('4.37 ETH')
  await expect(page.getByTestId('order-discount')).toHaveText('-0.437 ETH')
  await expect(page.getByTestId('order-total')).toHaveText('3.9375 ETH')
})

test('o recibo é um retrato: mudanças posteriores no catálogo não o alteram', async ({ page }) => {
  await placeSimpleOrder(page)

  // Depois da compra, o preço do NFT sobe e outro NFT esgota.
  await page.evaluate(() => {
    const control = (
      window as unknown as {
        __mockControl: { updateNft: (id: string, changes: unknown) => unknown }
      }
    ).__mockControl

    control.updateNft('nft-03', { priceEth: '9.99' })
    control.updateNft('nft-03', { availableQuantity: 0 })
  })

  await page.reload()

  await expect(page.getByTestId('order-item')).toContainText('1 × 1.99 ETH')
  await expect(page.getByTestId('order-subtotal')).toHaveText('1.99 ETH')
  await expect(page.getByTestId('order-total')).toHaveText('1.9945 ETH')

  // Já o NFT, no catálogo, reflete a mudança (o link do item leva ao detalhe atual).
  await page.getByTestId('order-item').getByRole('link', { name: 'Neon Vessel #552' }).click()
  await expect(page.getByTestId('detail-price')).toHaveText('9.99 ETH')
})

test('copiar a referência da transação', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const hash = await placeSimpleOrder(page)

  await page.getByRole('button', { name: 'Copiar referência' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Referência copiada.' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(hash)
})

test('o link da referência leva ao explorador simulado com os dados da transação', async ({ page }) => {
  const hash = await placeSimpleOrder(page)
  const settled = await page.getByTestId('order-settled').textContent()

  await page.getByRole('link', { name: 'Ver no explorador (simulado)' }).click()

  await expect(page).toHaveURL(`/explorador/${hash}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explorador de blocos')
  await expect(page.getByText('Simulado: esta página imita um explorador de blocos')).toBeVisible()
  await expect(page.getByTestId('tx-hash')).toHaveText(hash)
  await expect(page.getByTestId('tx-status')).toHaveText('Confirmada')
  await expect(page.getByTestId('tx-network')).toHaveText('Ethereum')
  await expect(page.getByTestId('tx-block')).toHaveText(/^#\d{8}$/)
  await expect(page.getByTestId('tx-time')).toHaveText(settled!)
  await expect(page.getByTestId('tx-from')).toHaveText(ANA_PRIMARY_ADDRESS)
  await expect(page.getByTestId('tx-to')).toHaveText(MARKETPLACE_ADDRESS)
  await expect(page.getByTestId('tx-value')).toHaveText('1.9945 ETH')
  await expect(page.getByTestId('tx-fee')).toHaveText('0.0045 ETH')
})

test('o explorador é público e não expõe dados do colecionador', async ({ page }) => {
  const hash = await placeSimpleOrder(page)
  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeHidden()

  await page.goto(`/explorador/${hash}`)

  await expect(page.getByTestId('tx-hash')).toHaveText(hash)
  const text = await main(page).innerText()
  expect(text).not.toContain(ana.email)
  expect(text).not.toContain(ana.name)
  expect(text).not.toContain('KUR-000001')
})

test('referência desconhecida no explorador mostra não encontrada', async ({ page }) => {
  await page.goto(`/explorador/0x${'0'.repeat(64)}`)

  await expect(page.getByTestId('tx-not-found')).toContainText('Transação não encontrada')
})

test('imprimir: o botão chama a impressão e a versão impressa esconde a casca do site', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { printCalls: number }).printCalls = 0
    window.print = () => {
      ;(window as unknown as { printCalls: number }).printCalls += 1
    }
  })
  await placeSimpleOrder(page)

  await page.getByRole('button', { name: 'Imprimir recibo' }).click()
  expect(await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls)).toBe(1)

  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('banner')).toBeHidden()
  await expect(page.getByRole('contentinfo')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Imprimir recibo' })).toBeHidden()
  await expect(page.getByTestId('order-total')).toBeVisible()
  await expect(page.getByTestId('order-transaction')).toBeVisible()
})

test('pagamento recusado: sem referência de transação, com itens do retrato e saída para tentar de novo', async ({ page }) => {
  await signIn(page)
  await addToCart(page, 'nft-03')
  await page.goto('/pagamento')
  await main(page).getByLabel('Telefone').fill('(11) 91234-5678')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByTestId('wallet-status-wallet-ana-1')).toHaveText('Conectada')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByLabel('Li e aceito os termos de compra de NFTs.').check()
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'payment-declined'))
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click()

  await expect(page.getByTestId('order-declined')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pagamento recusado')
  await expect(page.getByTestId('order-item')).toContainText('Neon Vessel #552')
  await expect(page.getByTestId('order-total')).toHaveText('1.9945 ETH')
  await expect(page.getByTestId('order-transaction')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Ver no explorador (simulado)' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Imprimir recibo' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Tentar novamente' })).toBeVisible()
})

test('o recibo tem estrutura de títulos e imagens com texto alternativo', async ({ page }) => {
  await placeSimpleOrder(page)

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  for (const name of ['Itens', 'Transação', 'Valores', 'Pagamento', 'Colecionador']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
  }
  await expect(page.getByTestId('order-item').getByRole('img')).toHaveAttribute(
    'alt',
    'Neon Vessel #552, da coleção Neon Vessels',
  )
})

test('sem rolagem horizontal no recibo e no explorador em 390, 768 e 1440 px', async ({ page }) => {
  const hash = await placeSimpleOrder(page)

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })

    for (const path of ['/pedido/KUR-000001', `/explorador/${hash}`]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${path} em ${width}px`).toBe(0)
    }
  }
})
