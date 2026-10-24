import { expect, type Page } from '@playwright/test'

// Passos do pagamento (Figma: formulário único "Perfil do colecionador" + "Seus NFTs"). O que a
// conta já sabe vem preenchido; falta o tipo de carteira, o código de indicação e o nome ENS.

/** Abaixo de 1024 px o pagamento é o "Pagamento com carteira" (Figma mobile), sem formulário. */
export function isCompact(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 1024
}

/** Título que indica que o pagamento terminou de carregar. */
export function paymentHeading(page: Page) {
  return page.getByRole('heading', {
    name: isCompact(page) ? 'Pagamento com carteira' : 'Perfil do colecionador',
  })
}

export function main(page: Page) {
  return page.getByRole('main')
}

export function walletStatus(page: Page, walletId: string) {
  return page.getByTestId(`wallet-status-${walletId}`)
}

export const COLLECTOR_DEFAULTS = {
  walletType: 'MetaMask',
  referralCode: 'KURIO10',
  ensName: 'colecionador',
}

/** Preenche os campos obrigatórios que a conta não traz. */
export async function fillCollector(page: Page, values: Partial<typeof COLLECTOR_DEFAULTS> = {}) {
  const { walletType, referralCode, ensName } = { ...COLLECTOR_DEFAULTS, ...values }

  if (isCompact(page)) {
    // No mobile os dados vêm da carteira; só o tipo é escolhido na tela.
    await page.getByText(walletType, { exact: true }).click()

    return
  }

  await main(page).getByLabel('Tipo de carteira').selectOption(walletType)
  await main(page).getByLabel('Código de indicação').fill(referralCode)
  await main(page).getByLabel(/^Nome ENS/).fill(ensName)
}

/** Conecta a carteira escolhida (a principal da Ana, por padrão) e espera o status. */
export async function connectWallet(page: Page, walletId = 'wallet-ana-1') {
  // No mobile a carteira escolhida é conectada sozinha.
  if (!isCompact(page)) {
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
  }

  await expect(walletStatus(page, walletId)).toHaveText('Conectada')
}

/** Formulário completo e carteira conectada: só falta clicar em "Confirmar compra". */
export async function readyToPay(page: Page, values: Partial<typeof COLLECTOR_DEFAULTS> = {}) {
  await fillCollector(page, values)
  await connectWallet(page)
}

export function confirmButton(page: Page) {
  return page.getByRole('button', { name: 'Confirmar compra' })
}

export function ordersOf(page: Page, userId: string) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ id: string }>,
    `mock-orders:${userId}`,
  )
}
