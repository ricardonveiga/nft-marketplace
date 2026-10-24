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
  await field(page, 'Nome de usuário').fill(values.name)
  await field(page, 'E-mail').fill(values.email)
  await field(page, 'Senha').fill(values.password)
  await field(page, 'Confirmar senha').fill(values.confirm ?? values.password)
}

async function submit(page: Page) {
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
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

  const name = field(page, 'Nome de usuário')
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

  await field(page, 'Nome de usuário').fill('Carla')

  await expect(page.getByText('Informe seu nome.')).toBeHidden()
  await expect(field(page, 'Nome de usuário')).not.toHaveAttribute('aria-invalid', 'true')
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
  // No mobile (Figma) a tela do NFT não tem o cabeçalho: o caminho até o login é o coração.
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole('link', { name: /^Entrar para favoritar/ }).click()
  } else {
    await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  }
  await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fnft-03/)

  // O destino é preservado ao alternar entre as abas do modal.
  await page.getByRole('main').getByRole('link', { name: /^(Criar conta|Crie uma conta)$/ }).click()
  await expect(page).toHaveURL(/\/cadastro\?redirect=%2Fnft%2Fnft-03/)

  await fillRegister(page, newUser)
  await submit(page)

  await expect(page).toHaveURL('/nft/nft-03')
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.goto('/')
  }
  await expect(accountMenu(page, newUser.name)).toBeVisible()
})

test('abas do modal: Criar conta ↔ Entrar', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('link', { name: /^(Criar conta|Crie uma conta)$/ }).click()
  await expect(page).toHaveURL(/\/cadastro/)
  await expect(page.getByRole('heading', { name: /^Criar (conta|perfil)/ })).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: /^(Entrar|Entre)$/ }).click()
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

test('só a senha tem o olho de mostrar e ocultar; a confirmação não (como no Figma)', async ({ page }) => {
  await page.goto('/cadastro')
  await field(page, 'Senha').fill('segredo123')
  await field(page, 'Confirmar senha').fill('segredo123')

  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(field(page, 'Senha')).toHaveAttribute('type', 'text')
  await expect(field(page, 'Confirmar senha')).toHaveAttribute('type', 'password')
  await expect(page.getByRole('button', { name: /confirmação/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Ocultar senha' }).click()
  await expect(field(page, 'Senha')).toHaveAttribute('type', 'password')
})

test('cadastro (Figma): textos, campos e login social inerte', async ({ page }) => {
  await page.goto('/cadastro')

  await expect(page.getByRole('heading', { level: 1, name: /^Criar (conta|perfil)/ })).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: /^(Entrar|Entre)$/ })).toBeVisible()

  if ((page.viewportSize()?.width ?? 0) >= 768) {
    await expect(
      page.getByText('Crie seu perfil de colecionador e conecte uma carteira quando quiser.'),
    ).toBeVisible()
  }

  for (const [label, placeholder] of [
    ['Nome de usuário', 'Nome de usuário'],
    ['E-mail', 'Digite seu e-mail'],
    ['Senha', 'Senha'],
    ['Confirmar senha', 'Confirmar senha'],
  ]) {
    await expect(field(page, label)).toHaveAttribute('placeholder', placeholder)
  }

  // Sem a dica de senha (o Figma não a mostra); a regra aparece no erro de validação.
  await expect(page.getByText('Mínimo de 8 caracteres')).toHaveCount(0)

  await expect(page.getByRole('separator')).toContainText('Ou continue com')
  for (const name of ['Continuar com Google', 'Continuar com Facebook']) {
    const button = page.getByRole('button', { name })
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await button.click({ force: true })
    await expect(page).toHaveURL(/\/cadastro/)
  }

  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const box = (await page.locator('div.border-primary.bg-card').boundingBox())!

    expect(box.width).toBe(500)
    expect(box.height).toBe(656)
    expect(box.y).toBe(158)
  }
})

test('cadastro e login (Figma mobile): campos de 50 px, botão de 60 px e sem o modal', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'só no mobile')

  for (const path of ['/cadastro', '/login']) {
    await page.goto(path)
    const field = (await page.getByRole('main').getByLabel('E-mail', { exact: true }).boundingBox())!
    const submit = (await page.getByRole('main').getByRole('button', { name: /^(Entrar|Criar perfil)$/ }).boundingBox())!

    expect(field.width).toBe((page.viewportSize()?.width ?? 0) - 56)
    expect(field.height).toBe(50)
    expect(submit.height).toBe(60)
  }

  await expect(page.getByRole('main').getByRole('link', { name: 'Entre', exact: true })).toHaveCount(0)
  await page.goto('/cadastro')
  await expect(page.getByRole('button', { name: 'Criar perfil' })).toBeVisible()
})
