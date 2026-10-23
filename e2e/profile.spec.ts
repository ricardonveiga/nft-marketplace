import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana, bruno] = mockUsers

// PNG de 1 × 1 pixel (vermelho): pequeno, mas uma imagem de verdade para o navegador decodificar.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function main(page: Page) {
  return page.getByRole('main')
}

async function signIn(
  page: Page,
  credentials: { email: string; password: string },
  redirect = '/perfil',
  { expectSuccess = true } = {},
) {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await main(page).getByLabel('E-mail', { exact: true }).fill(credentials.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(credentials.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  // Sem esperar, o teste digitaria no "E-mail" do próprio login (a tela de perfil tem um igual).
  if (expectSuccess) {
    await expect(page).toHaveURL(redirect)

    if (redirect === '/perfil') {
      // A URL muda antes de a tela trocar: espera o conteúdo do próprio perfil.
      await expect(page.getByRole('heading', { name: 'Dados pessoais' })).toBeVisible()
    }
  }
}

async function signOut(page: Page, name: string) {
  await page.getByRole('button', { name: `Conta de ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: `Conta de ${name}` })).toBeHidden()
}

function field(page: Page, label: string) {
  return main(page).getByLabel(label, { exact: true })
}

function saveProfile(page: Page) {
  return page.getByRole('button', { name: 'Salvar alterações' })
}

test('visitante vai ao login e volta ao perfil', async ({ page }) => {
  await page.goto('/perfil')

  await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/perfil')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Perfil do colecionador')
})

test('mostra os dados da conta e o menu da conta leva ao perfil', async ({ page }) => {
  await signIn(page, ana, '/')
  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Meu perfil' }).click()

  await expect(page).toHaveURL('/perfil')
  await expect(field(page, 'Nome completo')).toHaveValue(ana.name)
  await expect(field(page, 'E-mail')).toHaveValue(ana.email)
  await expect(field(page, 'Telefone (opcional)')).toHaveValue('')
  await expect(page.getByTestId('profile-name')).toHaveText(ana.name)
  await expect(page.getByTestId('profile-avatar-fallback')).toContainText('AS')
})

test('salvar só habilita quando algo muda', async ({ page }) => {
  await signIn(page, ana)
  await expect(saveProfile(page)).toBeDisabled()

  await field(page, 'Nome completo').fill('Ana S. Souza')
  await expect(saveProfile(page)).toBeEnabled()

  await field(page, 'Nome completo').fill(ana.name)
  await expect(saveProfile(page)).toBeDisabled()
})

test('editar nome e telefone atualiza a página, o header e persiste', async ({ page }) => {
  await signIn(page, ana)

  await field(page, 'Nome completo').fill('Ana Maria Souza')
  await field(page, 'Telefone (opcional)').fill('11 91234-5678')
  await saveProfile(page).click()

  await expect(page.getByRole('status').filter({ hasText: 'Dados atualizados.' })).toBeVisible()
  await expect(page.getByTestId('profile-name')).toHaveText('Ana Maria Souza')
  await expect(page.getByRole('button', { name: 'Conta de Ana Maria Souza' })).toBeVisible()
  // O telefone é guardado só com dígitos e exibido formatado.
  await expect(field(page, 'Telefone (opcional)')).toHaveValue('(11) 91234-5678')

  await page.reload()
  await expect(field(page, 'Nome completo')).toHaveValue('Ana Maria Souza')
  await expect(field(page, 'Telefone (opcional)')).toHaveValue('(11) 91234-5678')
})

test('validação: nome, e-mail e telefone com erros associados e foco no primeiro', async ({ page }) => {
  await signIn(page, ana)

  await field(page, 'Nome completo').fill('')
  await field(page, 'E-mail').fill('sem-arroba')
  await field(page, 'Telefone (opcional)').fill('123')
  await saveProfile(page).click()

  await expect(field(page, 'Nome completo')).toBeFocused()
  await expect(field(page, 'Nome completo')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Informe seu nome.')).toBeVisible()
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByText('Informe um telefone válido com DDD.')).toBeVisible()

  const describedBy = await field(page, 'Nome completo').getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Informe seu nome.')
})

test('o telefone é opcional: pode ser removido', async ({ page }) => {
  await signIn(page, ana)
  await field(page, 'Telefone (opcional)').fill('11912345678')
  await saveProfile(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'Dados atualizados.' })).toBeVisible()

  await field(page, 'Telefone (opcional)').fill('')
  await saveProfile(page).click()
  await expect(field(page, 'Telefone (opcional)')).toHaveValue('')
  await page.reload()
  await expect(field(page, 'Telefone (opcional)')).toHaveValue('')
})

test('conflito: e-mail de outra conta fica no campo e nada é salvo', async ({ page }) => {
  await signIn(page, ana)

  await field(page, 'E-mail').fill(bruno.email)
  await saveProfile(page).click()

  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
  await expect(field(page, 'E-mail')).toBeFocused()
  await expect(field(page, 'E-mail')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByTestId('profile-email')).toHaveText(ana.email)
})

test('trocar o e-mail vale para o próximo login', async ({ page }) => {
  await signIn(page, ana)
  await field(page, 'E-mail').fill('ana.nova@kurio.test')
  await saveProfile(page).click()
  await expect(page.getByTestId('profile-email')).toHaveText('ana.nova@kurio.test')

  await signOut(page, ana.name)
  await signIn(page, { email: ana.email, password: ana.password }, '/perfil', { expectSuccess: false })
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

  await signIn(page, { email: 'ana.nova@kurio.test', password: ana.password })
  await expect(page).toHaveURL('/perfil')
})

test('alterar a senha: erros de validação', async ({ page }) => {
  await signIn(page, ana)
  const submit = page.getByRole('button', { name: 'Alterar senha', exact: true })

  await submit.click()
  await expect(field(page, 'Senha atual')).toBeFocused()
  await expect(page.getByText('Informe sua senha atual.')).toBeVisible()
  await expect(page.getByText('Crie uma nova senha.')).toBeVisible()
  await expect(page.getByText('Confirme a nova senha.')).toBeVisible()

  await field(page, 'Senha atual').fill(ana.password)
  await field(page, 'Nova senha').fill('curta1')
  await field(page, 'Confirmar nova senha').fill('outra')
  await submit.click()
  await expect(page.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible()
  await expect(page.getByText('As senhas não conferem.')).toBeVisible()

  await field(page, 'Nova senha').fill('somenteletras')
  await field(page, 'Confirmar nova senha').fill('somenteletras')
  await submit.click()
  await expect(page.getByText('Use letras e números na senha.')).toBeVisible()

  await field(page, 'Nova senha').fill(ana.password)
  await field(page, 'Confirmar nova senha').fill(ana.password)
  await submit.click()
  await expect(page.getByText('A nova senha deve ser diferente da atual.')).toBeVisible()
})

test('alterar a senha: a senha atual errada fica no campo', async ({ page }) => {
  await signIn(page, ana)

  await field(page, 'Senha atual').fill('errada123')
  await field(page, 'Nova senha').fill('nova12345')
  await field(page, 'Confirmar nova senha').fill('nova12345')
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()

  await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
  await expect(field(page, 'Senha atual')).toBeFocused()
  await expect(field(page, 'Senha atual')).toHaveAttribute('aria-invalid', 'true')
})

test('alterar a senha: campos são limpos e a nova senha vale no próximo login', async ({ page }) => {
  await signIn(page, ana)

  await field(page, 'Senha atual').fill(ana.password)
  await field(page, 'Nova senha').fill('nova12345')
  await field(page, 'Confirmar nova senha').fill('nova12345')
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()
  await expect(field(page, 'Senha atual')).toHaveValue('')
  await expect(field(page, 'Nova senha')).toHaveValue('')

  await signOut(page, ana.name)
  await signIn(page, ana, '/perfil', { expectSuccess: false })
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

  await signIn(page, { email: ana.email, password: 'nova12345' })
  await expect(page).toHaveURL('/perfil')
})

test('mostrar e ocultar as senhas são botões independentes', async ({ page }) => {
  await signIn(page, ana)
  await field(page, 'Senha atual').fill('segredo123')

  await page.getByRole('button', { name: 'Mostrar senha atual' }).click()

  await expect(field(page, 'Senha atual')).toHaveAttribute('type', 'text')
  await expect(field(page, 'Nova senha')).toHaveAttribute('type', 'password')
})

test('foto: enviar, aparecer no perfil e no menu, persistir e remover', async ({ page }) => {
  await signIn(page, ana)
  await expect(page.getByTestId('profile-avatar-fallback')).toBeVisible()

  await page.getByLabel('Alterar foto').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG_1X1 })

  const avatar = page.getByTestId('profile-avatar')
  await expect(avatar).toBeVisible()
  await expect(avatar).toHaveAttribute('alt', `Foto de perfil de ${ana.name}`)
  // A imagem é reduzida no navegador: o que fica guardado é um data URL pequeno.
  const src = await avatar.getAttribute('src')
  expect(src).toMatch(/^data:image\/(webp|png);base64,/)
  expect(src!.length).toBeLessThan(100_000)
  await expect(page.getByRole('status').filter({ hasText: 'Foto atualizada.' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` }).locator('img').first()).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('profile-avatar')).toBeVisible()

  await page.getByRole('button', { name: 'Remover foto' }).click()
  await expect(page.getByTestId('profile-avatar-fallback')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Foto removida.' })).toBeVisible()
})

test('foto: arquivo de tipo inválido e arquivo grande demais são recusados com aviso', async ({ page }) => {
  await signIn(page, ana)
  const input = page.getByLabel('Alterar foto')

  await input.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('não sou imagem') })
  await expect(page.getByRole('alert')).toHaveText('Use uma imagem PNG, JPEG ou WebP.')

  await input.setInputFiles({
    name: 'enorme.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole('alert')).toHaveText('A imagem deve ter até 2 MB.')

  // Imagem corrompida (tipo certo, conteúdo inválido).
  await input.setInputFiles({ name: 'quebrada.png', mimeType: 'image/png', buffer: Buffer.from('quebrada') })
  await expect(page.getByRole('alert')).toContainText('Não foi possível ler esta imagem')
  await expect(page.getByTestId('profile-avatar-fallback')).toBeVisible()
})

test('o telefone do perfil já vem preenchido no pagamento', async ({ page }) => {
  await signIn(page, ana)
  await field(page, 'Telefone (opcional)').fill('(11) 91234-5678')
  await saveProfile(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'Dados atualizados.' })).toBeVisible()

  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  await page.goto('/pagamento')

  await expect(main(page).getByLabel('Telefone', { exact: true })).toHaveValue('(11) 91234-5678')
})

test('as alterações de uma conta não aparecem em outra', async ({ page }) => {
  await signIn(page, ana)
  await field(page, 'Nome completo').fill('Ana Alterada')
  await saveProfile(page).click()
  await expect(page.getByTestId('profile-name')).toHaveText('Ana Alterada')
  await signOut(page, 'Ana Alterada')

  await signIn(page, bruno)
  await expect(page.getByTestId('profile-name')).toHaveText(bruno.name)
  await expect(field(page, 'Nome completo')).toHaveValue(bruno.name)
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  await signIn(page, ana)
  await expect(page.getByRole('heading', { name: 'Dados pessoais' })).toBeVisible()

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/perfil')
    await expect(page.getByRole('heading', { name: 'Dados pessoais' })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `largura ${width}`).toBe(0)
  }
})

test('menu lateral "Meu perfil": navega entre perfil e carteiras e deixa o resto como "Em breve"', async ({ page }) => {
  await signIn(page, ana)

  const menu = main(page).getByRole('navigation', { name: 'Meu perfil' })
  await expect(menu.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')

  for (const label of ['Atividade', 'Lista de interesse', 'Ofertas', 'Arquivos baixados', 'Suporte']) {
    await expect(menu.getByText(label, { exact: true })).toHaveAttribute('aria-disabled', 'true')
    await expect(menu.getByRole('link', { name: label })).toHaveCount(0)
  }

  await menu.getByRole('link', { name: 'Carteiras' }).click()
  await expect(page).toHaveURL('/carteiras')
  await expect(menu.getByRole('link', { name: 'Carteiras' })).toHaveAttribute('aria-current', 'page')

  await menu.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeHidden()
})
