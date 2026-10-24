import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

// `__mockControl.resetAll()` devolve TUDO ao estado inicial conhecido (CHALLENGE, seção 6).
const [ana] = mockUsers
const carla = { name: 'Carla Mendes', email: 'carla@exemplo.com', password: 'senha1234' }
const NEON = 'Neon Vessel #552'

function main(page: Page) {
  return page.getByRole('main')
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await main(page).getByLabel('E-mail', { exact: true }).fill(email)
  await main(page).getByLabel('Senha', { exact: true }).fill(password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function signOut(page: Page, name: string) {
  await page.getByRole('button', { name: `Conta de ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: `Conta de ${name}` })).toBeHidden()
}

test('resetAll restaura catálogo, contas, carrinho, favoritos, perfil, cenário e sessão', async ({ page }) => {
  // Cenário longo (cadastro, favorito, carrinho, cupom, perfil, reset e novo login): o limite padrão
  // de 30 s fica curto quando a suíte roda em paralelo.
  test.setTimeout(90_000)

  // Mexe em tudo: conta nova...
  await page.goto('/cadastro')
  await main(page).getByLabel('Nome de usuário', { exact: true }).fill(carla.name)
  await main(page).getByLabel('E-mail', { exact: true }).fill(carla.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(carla.password)
  await main(page).getByLabel('Confirmar senha', { exact: true }).fill(carla.password)
  await main(page).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByRole('button', { name: `Conta de ${carla.name}` })).toBeVisible()
  await signOut(page, carla.name)

  // ...favorito, carrinho com cupom e telefone da Ana...
  await signIn(page, ana.email, ana.password!)
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeVisible()
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: `Favoritar ${NEON}` }).click()
  await expect(page.getByRole('button', { name: `Favoritar ${NEON}` })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  await page.goto('/carrinho')
  await page.getByLabel('Cupom de desconto').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()
  await page.goto('/perfil')
  // Só preenche depois de o formulário receber os dados da conta (senão o campo é reiniciado).
  await expect(main(page).getByLabel('Nome completo', { exact: true })).toHaveValue(ana.name)
  await main(page).getByLabel('Telefone (opcional)', { exact: true }).fill('11 91234-5678')
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled()
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Dados atualizados.' })).toBeVisible()

  // ...preço do catálogo e um cenário de falha ativo.
  await page.evaluate(() => {
    window.__mockControl?.updateNft('nft-03', { priceEth: '9.99' })
    localStorage.setItem('mock-scenario', 'slow')
  })
  await page.goto('/nft/nft-03')
  await expect(page.getByTestId('detail-price')).toContainText('9.99')

  const guestCartBefore = await page.evaluate(() => localStorage.getItem('kurio.guest-cart'))

  // O reset: tudo de uma vez (a página recarrega sozinha).
  await Promise.all([
    page.waitForEvent('load'),
    page.evaluate(() => window.__mockControl?.resetAll()),
  ])

  // Nada guardado: nem o estado do mock, nem a sessão, nem o carrinho do visitante antigo. (Ao abrir
  // o app o cliente cria um id novo de carrinho de visitante; ele pode já existir aqui, mas é outro.)
  const stored = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter(
      (key) => (key.startsWith('mock-') || key.startsWith('kurio.')) && key !== 'kurio.guest-cart',
    ),
    guestCart: localStorage.getItem('kurio.guest-cart'),
    session: Object.keys(sessionStorage),
  }))
  expect(stored.local).toEqual([])
  expect(stored.session).toEqual([])
  expect(guestCartBefore).not.toBeNull()
  expect(stored.guestCart).not.toBe(guestCartBefore)

  // Catálogo e cenário voltaram (o cenário `slow` não está mais nas chaves acima): preço original.
  await page.goto('/nft/nft-03')
  await expect(page.getByTestId('detail-price')).toContainText('1.99')
  await expect(page.getByTestId('detail-price')).not.toContainText('9.99')

  // Sem sessão e a conta criada deixou de existir.
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
  await signIn(page, carla.email, carla.password)
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()

  // A Ana volta ao zero: sem favorito, sem item no carrinho e sem telefone.
  await signIn(page, ana.email, ana.password!)
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeVisible()
  await page.goto('/nft/nft-03')
  await expect(page.getByRole('button', { name: `Favoritar ${NEON}` })).toHaveAttribute('aria-pressed', 'false')
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await page.goto('/perfil')
  await expect(main(page).getByLabel('Telefone (opcional)', { exact: true })).toHaveValue('')
})
