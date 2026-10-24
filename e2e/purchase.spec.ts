import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'
import { isCompact, readyToPay } from './support/checkout'

const [ana] = mockUsers

function main(page: Page) {
  return page.getByRole('main')
}

// Neon Vessel #552 (nft-03): 1.99 ETH. Com o cupom KURIO10 (10%) o desconto é 0.199 ETH; somando
// a taxa de rede (0.0045) o total é 1.7955 ETH. Os valores vêm da API simulada, não do cliente.
test('compra completa: do catálogo ao recibo confirmado, com cupom', async ({ page }) => {
  // 1. Catálogo (Início), como visitante: escolhe o NFT pelo card.
  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await page.getByTestId('nft-card').filter({ hasText: 'Neon Vessel #552' }).click()

  // 2. Detalhe: confere o NFT e adiciona ao carrinho.
  await expect(page).toHaveURL(/\/nft\/nft-03$/)
  await expect(page.getByTestId('detail-price')).toContainText('1.99')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  // 3. Carrinho: o item está lá e um cupom válido gera o desconto calculado pela API.
  await page.getByRole('link', { name: /^(Carrinho|Ir para o carrinho)/ }).first().click()
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByText('Neon Vessel #552').first()).toBeVisible()
  await page.getByLabel('Cupom de desconto').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()

  // 4. Pagamento: visitante vai ao login e volta ao pagamento com o carrinho (e o cupom) da conta.
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password!)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/pagamento')

  if (!isCompact(page)) {
    // No mobile (Figma) o pagamento mostra só o total.
    await expect(page.getByTestId('summary-subtotal')).toHaveText('1.99 ETH')
    await expect(page.getByTestId('summary-discount')).toHaveText('(-) 0.199')
    await expect(page.getByTestId('summary-fee')).toHaveText('0.0045 ETH')
  }
  await expect(page.getByTestId('summary-total')).toHaveText('1.7955 ETH')

  // 5. Dados do colecionador, carteira conectada e revisão.
  await readyToPay(page)

  // 6. Confirma: o pedido nasce pendente e só vira confirmado pela resposta da simulação.
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/KUR-\d+/)
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })

  // 7. Recibo confirmado: identificação da transação, item, valores e pagamento.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pedido confirmado')
  await expect(page.getByTestId('order-transaction')).toHaveText(/^0x[0-9a-f]{64}$/)
  await expect(page.getByTestId('order-subtotal')).toHaveText('1.99 ETH')
  await expect(page.getByTestId('order-discount')).toContainText('0.199 ETH')
  await expect(page.getByTestId('order-fee')).toHaveText('0.0045 ETH')
  await expect(page.getByTestId('order-total')).toHaveText('1.7955 ETH')
  await expect(page.getByTestId('order-network')).toHaveText('Ethereum')
  await expect(page.getByTestId('order-item')).toContainText('Neon Vessel #552')

  // 8. O carrinho foi esvaziado pela compra.
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})
