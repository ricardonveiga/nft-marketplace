import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

// Os mocks nunca guardam senha em claro: só o hash SHA-256 (64 caracteres hexadecimais).
const [ana] = mockUsers
const carla = { name: 'Carla Mendes', email: 'carla@exemplo.com', password: 'senha1234' }
const HASH = /^[0-9a-f]{64}$/

function field(page: Page, label: string) {
  return page.getByRole('main').getByLabel(label, { exact: true })
}

function storedSecrets(page: Page) {
  // Tudo o que o mock guarda sobre contas e perfis.
  return page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter((key) => key === 'mock-users' || key.startsWith('mock-profile:'))
        .map((key) => [key, localStorage.getItem(key)]),
    ) as Record<string, string>,
  )
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await field(page, 'E-mail').fill(email)
  await field(page, 'Senha').fill(password)
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
}

test('cadastro guarda só o hash da senha e o login continua funcionando', async ({ page }) => {
  await page.goto('/cadastro')
  await field(page, 'Nome de usuário').fill(carla.name)
  await field(page, 'E-mail').fill(carla.email)
  await field(page, 'Senha').fill(carla.password)
  await field(page, 'Confirmar senha').fill(carla.password)
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(page.getByRole('button', { name: `Conta de ${carla.name}` })).toBeVisible()

  const secrets = await storedSecrets(page)
  const users = JSON.parse(secrets['mock-users']) as Array<Record<string, string>>

  expect(users).toHaveLength(1)
  expect(users[0].passwordHash).toMatch(HASH)
  expect(users[0]).not.toHaveProperty('password')
  expect(JSON.stringify(secrets)).not.toContain(carla.password)

  // Sai e entra de novo: a senha certa passa, a errada não.
  await page.evaluate(() => localStorage.removeItem('kurio.session'))
  await signIn(page, carla.email, 'errada123')
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await signIn(page, carla.email, carla.password)
  await expect(page.getByRole('button', { name: `Conta de ${carla.name}` })).toBeVisible()
})

test('trocar a senha no perfil guarda só o hash e a nova senha passa a valer', async ({ page }) => {
  const novaSenha = 'novaSenha77'

  await signIn(page, ana.email, ana.password!)
  // Só navega depois de o login terminar: sair antes aborta a requisição e a sessão não é gravada.
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeVisible()
  await page.goto('/perfil')
  await field(page, 'Senha atual').fill(ana.password!)
  await field(page, 'Nova senha').fill(novaSenha)
  await field(page, 'Confirmar nova senha').fill(novaSenha)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: /senha/i }).first()).toBeVisible()

  const secrets = await storedSecrets(page)
  const profile = JSON.parse(secrets['mock-profile:user-ana']) as Record<string, string>

  expect(profile.passwordHash).toMatch(HASH)
  expect(profile).not.toHaveProperty('password')
  expect(JSON.stringify(secrets)).not.toContain(novaSenha)

  await page.evaluate(() => localStorage.removeItem('kurio.session'))
  await signIn(page, ana.email, ana.password!)
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await signIn(page, ana.email, novaSenha)
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeVisible()
})

test('senhas em claro de versões antigas são trocadas por hash e o login segue valendo', async ({ page }) => {
  // Estado deixado por uma versão anterior: conta cadastrada e senha trocada, ambas em claro.
  await page.addInitScript(() => {
    localStorage.setItem(
      'mock-users',
      JSON.stringify([{ id: 'user-3', name: 'Carla Antiga', email: 'antiga@exemplo.com', password: 'legado1234' }]),
    )
    localStorage.setItem('mock-profile:user-ana', JSON.stringify({ name: 'Ana Souza', password: 'legadoAna99' }))
  })

  await page.goto('/')
  await expect(page.getByTestId('nft-grid')).toBeVisible()

  const secrets = await storedSecrets(page)

  expect(JSON.stringify(secrets)).not.toContain('legado1234')
  expect(JSON.stringify(secrets)).not.toContain('legadoAna99')
  expect(JSON.parse(secrets['mock-users'])[0].passwordHash).toMatch(HASH)
  expect(JSON.parse(secrets['mock-profile:user-ana']).passwordHash).toMatch(HASH)

  await signIn(page, 'antiga@exemplo.com', 'legado1234')
  await expect(page.getByRole('button', { name: 'Conta de Carla Antiga' })).toBeVisible()
})

test('as credenciais de demonstração continuam funcionando', async ({ page }) => {
  await signIn(page, ana.email, ana.password!)
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeVisible()
})
