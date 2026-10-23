import { expect, test, type Page } from '@playwright/test'

// Sem rolagem horizontal em 390, 768 e 1440 px nas telas que não têm o teste no próprio spec
// (carrinho, login, cadastro e a página não encontrada).
const WIDTHS = [390, 768, 1440]

function main(page: Page) {
  return page.getByRole('main')
}

async function expectNoHorizontalScroll(page: Page, width: number) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )

  expect(overflow, `largura ${width}`).toBe(0)
}

test('carrinho: sem rolagem horizontal em 390, 768 e 1440 px (com itens e cupom)', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  await page.goto('/nft/nft-01')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/carrinho')
    await expect(page.getByTestId('cart-loading')).toHaveCount(0)
    await expect(page.getByLabel('Cupom de desconto')).toBeVisible()
    await expectNoHorizontalScroll(page, width)
  }

  // Também com o cupom aplicado (linha de desconto e botão de remover).
  await page.getByLabel('Cupom de desconto').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await expectNoHorizontalScroll(page, width)
  }
})

test('carrinho vazio: sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
    await expectNoHorizontalScroll(page, width)
  }
})

test('login: sem rolagem horizontal em 390, 768 e 1440 px (também com os erros de validação)', async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/login')
    await expect(main(page).getByLabel('E-mail', { exact: true })).toBeVisible()
    await expectNoHorizontalScroll(page, width)

    await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(main(page).getByText('Informe seu e-mail.')).toBeVisible()
    await expectNoHorizontalScroll(page, width)
  }
})

test('cadastro: sem rolagem horizontal em 390, 768 e 1440 px (também com os erros de validação)', async ({
  page,
}) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/cadastro')
    await expect(main(page).getByLabel('Nome completo', { exact: true })).toBeVisible()
    await expectNoHorizontalScroll(page, width)

    await main(page).getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(main(page).getByText('Informe seu nome.')).toBeVisible()
    await expectNoHorizontalScroll(page, width)
  }
})

test('página não encontrada: sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/uma/rota/que/nao-existe-mesmo')
    await expect(page.getByTestId('route-not-found')).toBeVisible()
    await expectNoHorizontalScroll(page, width)
  }
})
