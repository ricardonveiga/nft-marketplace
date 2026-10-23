import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana, bruno] = mockUsers

// Os campos do login ficam no <main>; o footer também tem um campo de e-mail (newsletter).
function emailField(page: Page) {
  return page.getByRole('main').getByLabel('E-mail', { exact: true })
}

function passwordField(page: Page) {
  return page.getByRole('main').getByLabel('Senha', { exact: true })
}

async function fillCredentials(page: Page, email: string, password: string) {
  await emailField(page).fill(email)
  await passwordField(page).fill(password)
}

async function submit(page: Page) {
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function signIn(page: Page, user: { email: string; password: string }) {
  await fillCredentials(page, user.email, user.password)
  await submit(page)
}

// No desktop o menu da conta fica no header; no mobile, na barra inferior.
function accountMenu(page: Page, name: string) {
  return page.getByRole('button', { name: `Conta de ${name}` })
}

async function signOut(page: Page, name: string) {
  await accountMenu(page, name).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
}

test('login válido volta para a Início e mantém a sessão após refresh', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, ana)

  await expect(page).toHaveURL('/')
  await expect(accountMenu(page, ana.name)).toBeVisible()

  await page.reload()
  await expect(accountMenu(page, ana.name)).toBeVisible()
})

test('validação: campos vazios mostram erros associados e focam o primeiro', async ({ page }) => {
  await page.goto('/login')
  await submit(page)

  const email = emailField(page)
  const password = passwordField(page)

  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()
  await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
  await expect(password).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Informe sua senha.')).toBeVisible()

  // A mensagem é associada ao campo (leitores de tela).
  const describedBy = await email.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Informe seu e-mail.')
  await expect(page).toHaveURL(/\/login/)
})

test('validação: e-mail inválido', async ({ page }) => {
  await page.goto('/login')
  await fillCredentials(page, 'isso-nao-e-email', 'qualquer')
  await submit(page)

  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(emailField(page)).toBeFocused()
})

test('credenciais erradas mostram o erro e preservam o que foi digitado', async ({ page }) => {
  await page.goto('/login')
  await fillCredentials(page, ana.email, 'senha-errada')
  await submit(page)

  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await expect(page).toHaveURL(/\/login/)
  await expect(emailField(page)).toHaveValue(ana.email)
})

test('mostrar e ocultar senha', async ({ page }) => {
  await page.goto('/login')
  const password = passwordField(page)
  await password.fill('segredo')

  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(page.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
})

test('retorno ao fluxo anterior: volta para o NFT de onde o usuário veio', async ({ page }) => {
  await page.goto('/nft/nft-03')
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fnft-03/)
  await signIn(page, ana)

  await expect(page).toHaveURL('/nft/nft-03')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Neon Vessel #552')
})

test('retorno preserva os filtros do catálogo', async ({ page }) => {
  await page.goto('/?category=Fotografia&sort=price-desc')
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await signIn(page, ana)

  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page).toHaveURL(/sort=price-desc/)
})

test('redirect externo ou malicioso é ignorado', async ({ page }) => {
  await page.goto('/login?redirect=//evil.example.com')
  await signIn(page, ana)

  await expect(page).toHaveURL('/')
})

test('fechar o login volta para a página de origem', async ({ page }) => {
  await page.goto('/login?redirect=/nft/nft-02')
  await page.getByRole('button', { name: 'Fechar e voltar' }).click()

  await expect(page).toHaveURL('/nft/nft-02')
})

test('quem já está autenticado e abre o login é levado ao destino', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, ana)
  await expect(accountMenu(page, ana.name)).toBeVisible()

  await page.goto('/login?redirect=/nft/nft-04')

  await expect(page).toHaveURL('/nft/nft-04')
})

test('logout encerra a sessão e ela não volta após refresh', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, ana)
  await expect(accountMenu(page, ana.name)).toBeVisible()

  await signOut(page, ana.name)
  await expect(accountMenu(page, ana.name)).toBeHidden()

  await page.reload()
  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await expect(accountMenu(page, ana.name)).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('kurio.session'))).toBeNull()
})

test('troca de usuário: segundo usuário entra sem resquícios do primeiro', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, ana)
  await expect(accountMenu(page, ana.name)).toBeVisible()
  await signOut(page, ana.name)

  await page.goto('/login')
  await signIn(page, bruno)

  await expect(accountMenu(page, bruno.name)).toBeVisible()
  await expect(accountMenu(page, ana.name)).toBeHidden()
})

test('sessão expirada durante a navegação leva ao login e retoma o fluxo', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, ana)
  await expect(accountMenu(page, ana.name)).toBeVisible()
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  // A API passa a dizer que a sessão expirou; a navegação seguinte reconfirma a sessão.
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'session-expired'))
  await page.getByTestId('nft-card').first().click()

  await expect(page).toHaveURL(/\/login\?.*reason=expired/)
  await expect(page).toHaveURL(/redirect=%2Fnft%2Fnft-01/)
  await expect(page.getByRole('main').getByRole('status')).toContainText('Sua sessão expirou')
  await expect(accountMenu(page, ana.name)).toBeHidden()

  // Com a API de volta, entrar leva de volta ao NFT que estava aberto.
  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await signIn(page, ana)

  await expect(page).toHaveURL('/nft/nft-01')
})

test('token vencido no carregamento é descartado sem interromper a navegação', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('kurio.session', `kurio.user-ana.${Date.now() - 1000}`),
  )
  await page.goto('/')

  await expect(page.getByTestId('nft-grid')).toBeVisible()
  await expect(page).toHaveURL('/')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kurio.session'))).toBeNull()
})
