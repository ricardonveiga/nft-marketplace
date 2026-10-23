import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana] = mockUsers
const newUser = { name: 'Carla Mendes', email: 'carla@exemplo.com', password: 'senha1234' }

// Os campos ficam no <main>; o footer também tem um campo de e-mail (newsletter).
function field(page: Page, label: string) {
  return page.getByRole('main').getByLabel(label, { exact: true })
}

async function fillRegister(
  page: Page,
  values: { name: string; email: string; password: string; confirm?: string },
) {
  await field(page, 'Nome completo').fill(values.name)
  await field(page, 'E-mail').fill(values.email)
  await field(page, 'Senha').fill(values.password)
  await field(page, 'Confirmar senha').fill(values.confirm ?? values.password)
}

async function submit(page: Page) {
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
}

function accountMenu(page: Page, name: string) {
  return page.getByRole('button', { name: `Conta de ${name}` })
}

test('cadastro válido abre a sessão, volta para a Início e persiste após refresh', async ({ page }) => {
  await page.goto('/cadastro')
  await fillRegister(page, newUser)
  await submit(page)

  await expect(page).toHaveURL('/')
  await expect(accountMenu(page, newUser.name)).toBeVisible()

  await page.reload()
  await expect(accountMenu(page, newUser.name)).toBeVisible()
})

test('a conta criada consegue entrar de novo depois de sair', async ({ page }) => {
  await page.goto('/cadastro')
  await fillRegister(page, newUser)
  await submit(page)
  await expect(accountMenu(page, newUser.name)).toBeVisible()

  await accountMenu(page, newUser.name).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(accountMenu(page, newUser.name)).toBeHidden()

  await page.goto('/login')
  await field(page, 'E-mail').fill(newUser.email)
  await field(page, 'Senha').fill(newUser.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(accountMenu(page, newUser.name)).toBeVisible()
})

test('validação: campos vazios mostram os erros associados e focam o primeiro', async ({ page }) => {
  await page.goto('/cadastro')
  await submit(page)

  const name = field(page, 'Nome completo')
  await expect(name).toBeFocused()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Informe seu nome.')).toBeVisible()
  await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
  await expect(page.getByText('Crie uma senha.')).toBeVisible()
  await expect(page.getByText('Confirme sua senha.')).toBeVisible()

  // A mensagem fica associada ao campo (leitores de tela).
  const describedBy = await name.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Informe seu nome.')
  await expect(page).toHaveURL(/\/cadastro/)
})

test('validação: regras de e-mail e de senha', async ({ page }) => {
  await page.goto('/cadastro')

  await fillRegister(page, { name: 'Carla', email: 'sem-arroba', password: 'curta1' })
  await submit(page)
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible()

  await field(page, 'Senha').fill('somenteletras')
  await field(page, 'Confirmar senha').fill('somenteletras')
  await submit(page)
  await expect(page.getByText('Use letras e números na senha.')).toBeVisible()
})

test('validação: confirmação diferente da senha', async ({ page }) => {
  await page.goto('/cadastro')
  await fillRegister(page, { ...newUser, confirm: 'outra1234' })
  await submit(page)

  await expect(page.getByText('As senhas não conferem.')).toBeVisible()
  await expect(field(page, 'Confirmar senha')).toBeFocused()
  await expect(page).toHaveURL(/\/cadastro/)
})

test('erro desaparece do campo quando o usuário volta a digitar', async ({ page }) => {
  await page.goto('/cadastro')
  await submit(page)
  await expect(page.getByText('Informe seu nome.')).toBeVisible()

  await field(page, 'Nome completo').fill('Carla')

  await expect(page.getByText('Informe seu nome.')).toBeHidden()
  await expect(field(page, 'Nome completo')).not.toHaveAttribute('aria-invalid', 'true')
})

test('conflito: e-mail já cadastrado vai para o campo e não abre sessão', async ({ page }) => {
  await page.goto('/cadastro')
  await fillRegister(page, { name: 'Outra Ana', email: ana.email, password: 'senha1234' })
  await submit(page)

  const email = field(page, 'E-mail')
  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()
  await expect(page).toHaveURL(/\/cadastro/)
  await expect(accountMenu(page, 'Outra Ana')).toBeHidden()
})

test('conflito também vale sem diferenciar maiúsculas', async ({ page }) => {
  await page.goto('/cadastro')
  await fillRegister(page, { name: 'Outra Ana', email: ana.email.toUpperCase(), password: 'senha1234' })
  await submit(page)

  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
})

test('retorno ao fluxo anterior: cadastra e volta para o NFT de origem', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fnft-03/)

  // O destino é preservado ao alternar entre as abas do modal.
  await page.getByRole('main').getByRole('link', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/cadastro\?redirect=%2Fnft%2Fnft-03/)

  await fillRegister(page, newUser)
  await submit(page)

  await expect(page).toHaveURL('/nft/nft-03')
  await expect(accountMenu(page, newUser.name)).toBeVisible()
})

test('abas do modal: Criar conta ↔ Entrar', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('link', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/cadastro/)
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

test('redirect malicioso no cadastro é ignorado', async ({ page }) => {
  await page.goto('/cadastro?redirect=//evil.example.com')
  await fillRegister(page, newUser)
  await submit(page)

  await expect(page).toHaveURL('/')
})

test('quem já está autenticado e abre o cadastro é levado ao destino', async ({ page }) => {
  await page.goto('/cadastro')
  await fillRegister(page, newUser)
  await submit(page)
  await expect(accountMenu(page, newUser.name)).toBeVisible()

  await page.goto('/cadastro?redirect=/nft/nft-04')

  await expect(page).toHaveURL('/nft/nft-04')
})

test('mostrar e ocultar a senha e a confirmação são botões independentes', async ({ page }) => {
  await page.goto('/cadastro')
  await field(page, 'Senha').fill('segredo123')
  await field(page, 'Confirmar senha').fill('segredo123')

  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(field(page, 'Senha')).toHaveAttribute('type', 'text')
  await expect(field(page, 'Confirmar senha')).toHaveAttribute('type', 'password')

  await page.getByRole('button', { name: 'Mostrar confirmação de senha' }).click()
  await expect(field(page, 'Confirmar senha')).toHaveAttribute('type', 'text')
})
