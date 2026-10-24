import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'
import { fillCollector } from './support/checkout'

const [ana, bruno] = mockUsers

const NEW_ADDRESS = '0x1111111111111111111111111111111111111111'
// O endereço da carteira principal do Bruno, em minúsculas (duplicata).
const BRUNO_ADDRESS_LOWER = '0x3fd2a8c7b1e90d4a6c5b2e7f8a1c9d3e0b4a7c6d'

const VALID_WALLET = {
  displayName: 'Carla Mendes',
  label: 'Minha carteira',
  network: 'Ethereum',
  profileName: 'Carla',
  address: NEW_ADDRESS,
  walletType: 'MetaMask',
  referralCode: 'KURIO10',
  email: 'carla@exemplo.com',
  ensName: 'carla',
}

function main(page: Page) {
  return page.getByRole('main')
}

async function signIn(page: Page, user: { email: string; password: string }, redirect = '/carteiras') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await main(page).getByLabel('E-mail', { exact: true }).fill(user.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(user.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  // Só segue quando o login terminou; navegar antes aborta a requisição e a sessão não é gravada.
  await expect(page).not.toHaveURL(/\/login/)
}

async function registerCarla(page: Page) {
  await page.goto('/cadastro?redirect=%2Fcarteiras')
  await main(page).getByLabel('Nome de usuário', { exact: true }).fill('Carla Mendes')
  await main(page).getByLabel('E-mail', { exact: true }).fill('carla@exemplo.com')
  await main(page).getByLabel('Senha', { exact: true }).fill('senha1234')
  await main(page).getByLabel('Confirmar senha', { exact: true }).fill('senha1234')
  await main(page).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL('/carteiras')
}

function section(page: Page, role: 'principal' | 'secundária') {
  return page.getByRole('region', { name: `Carteira ${role}`, exact: true })
}

// Os rótulos obrigatórios levam um "*" depois do texto: o começo do rótulo basta.
function field(scope: Locator, label: string) {
  return scope.getByLabel(new RegExp(`^${label}`))
}

async function fillWallet(scope: Locator, values: Partial<typeof VALID_WALLET>) {
  const text: Array<[string, string | undefined]> = [
    ['Nome de exibição', values.displayName],
    ['Apelido da carteira', values.label],
    ['Nome do perfil', values.profileName],
    ['Endereço da carteira', values.address],
    ['Código de indicação', values.referralCode],
    ['E-mail', values.email],
    ['Nome ENS', values.ensName],
  ]

  for (const [label, value] of text) {
    if (value !== undefined) {
      await field(scope, label).fill(value)
    }
  }

  if (values.network !== undefined) {
    await field(scope, 'Rede').selectOption(values.network)
  }

  if (values.walletType !== undefined) {
    await field(scope, 'Tipo de carteira').selectOption(values.walletType)
  }
}

function saveWallet(scope: Locator) {
  return scope.getByRole('button', { name: 'Salvar carteira' })
}

test('visitante vai ao login e volta para as carteiras', async ({ page }) => {
  await page.goto('/carteiras')

  await expect(page).toHaveURL(/\/login\?redirect=%2Fcarteiras/)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/carteiras')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carteira principal')
})

test('mostra a carteira principal e a secundária com os dados cadastrados', async ({ page }) => {
  await signIn(page, ana)

  const primary = section(page, 'principal')
  await expect(field(primary, 'Apelido da carteira')).toHaveValue('Carteira principal')
  await expect(field(primary, 'Endereço da carteira')).toHaveValue('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')
  await expect(field(primary, 'Rede')).toHaveValue('Ethereum')
  await expect(field(primary, 'Tipo de carteira')).toHaveValue('MetaMask')
  await expect(field(primary, 'Nome ENS')).toHaveValue('ana-souza')
  await expect(primary.getByTestId('wallet-connection')).toHaveText('Desconectada')

  const secondary = section(page, 'secundária')
  await expect(field(secondary, 'Endereço da carteira')).toHaveValue('0x9aF3C1d5E2b84A07fB6C3e1D28a9B05c4e7F1a2B')
  await expect(field(secondary, 'Rede')).toHaveValue('Polygon')

  // Com as duas cadastradas, não há como adicionar uma terceira.
  await expect(page.getByTestId('wallet-empty-slot')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Adicionar/ })).toHaveCount(0)
})

test('o texto de apoio e a secundária vazia seguem o Figma', async ({ page }) => {
  await signIn(page, bruno)

  await expect(
    page.getByText('Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.'),
  ).toBeVisible()
  await expect(section(page, 'principal').getByTestId('wallet-connection')).toBeVisible()
  await expect(section(page, 'secundária').getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  await expect(section(page, 'secundária').getByText('Igual à carteira principal')).toBeVisible()
})

test('"Igual à carteira principal" dispensa a secundária', async ({ page }) => {
  await signIn(page, bruno)
  const secondary = section(page, 'secundária')

  await secondary.getByText('Igual à carteira principal').click()

  await expect(secondary.getByText('A carteira secundária é a mesma da principal.')).toBeVisible()
  await expect(secondary.getByRole('button', { name: /^Adicionar/ })).toBeDisabled()
})

test('cadastrar a carteira secundária: validação, sucesso e persistência', async ({ page }) => {
  await signIn(page, bruno)
  const secondary = section(page, 'secundária')
  await secondary.getByRole('button', { name: /^Adicionar/ }).click()

  // Campos vazios: erros associados, foco no primeiro.
  await saveWallet(secondary).click()
  await expect(field(secondary, 'Nome de exibição')).toBeFocused()
  await expect(field(secondary, 'Nome de exibição')).toHaveAttribute('aria-invalid', 'true')
  await expect(secondary.getByText('Informe o nome de exibição.')).toBeVisible()
  await expect(secondary.getByText('Informe um apelido para a carteira.')).toBeVisible()
  await expect(secondary.getByText('Selecione uma rede.')).toBeVisible()
  await expect(secondary.getByText('Informe o endereço da carteira.')).toBeVisible()
  await expect(secondary.getByText('Selecione o tipo de carteira.')).toBeVisible()
  await expect(secondary.getByText('Informe o código de indicação.')).toBeVisible()
  await expect(secondary.getByText('Informe seu e-mail.')).toBeVisible()
  await expect(secondary.getByText('Informe o nome ENS.')).toBeVisible()

  await fillWallet(secondary, { ...VALID_WALLET, label: 'Reserva', address: '0x123' })
  await saveWallet(secondary).click()
  await expect(secondary.getByText('Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais.')).toBeVisible()

  await fillWallet(secondary, { network: 'Polygon' })
  await field(secondary, 'Endereço da carteira').fill(NEW_ADDRESS)
  await saveWallet(secondary).click()

  await expect(page.getByRole('status').filter({ hasText: 'Carteira cadastrada.' })).toBeAttached()
  await expect(field(secondary, 'Apelido da carteira')).toHaveValue('Reserva')
  await expect(field(secondary, 'Rede')).toHaveValue('Polygon')
  await expect(page.getByTestId('wallet-empty-slot')).toHaveCount(0)

  await page.reload()
  await expect(field(section(page, 'secundária'), 'Apelido da carteira')).toHaveValue('Reserva')
})

test('cancelar o cadastro da secundária volta ao estado vazio', async ({ page }) => {
  await signIn(page, bruno)
  const secondary = section(page, 'secundária')

  await secondary.getByRole('button', { name: /^Adicionar/ }).click()
  await expect(saveWallet(secondary)).toBeVisible()
  await secondary.getByRole('button', { name: 'Cancelar' }).click()

  await expect(saveWallet(secondary)).toHaveCount(0)
  await expect(secondary.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
})

test('conflito: endereço já cadastrado (sem diferenciar maiúsculas) fica no campo', async ({ page }) => {
  await signIn(page, bruno)
  const secondary = section(page, 'secundária')
  await secondary.getByRole('button', { name: /^Adicionar/ }).click()
  await fillWallet(secondary, { ...VALID_WALLET, label: 'Duplicada', address: BRUNO_ADDRESS_LOWER })
  await saveWallet(secondary).click()

  await expect(secondary.getByText('Esta carteira já está cadastrada.')).toBeVisible()
  await expect(field(secondary, 'Endereço da carteira')).toHaveAttribute('aria-invalid', 'true')
  await expect(field(secondary, 'Endereço da carteira')).toBeFocused()
})

test('a primeira carteira de uma conta nova vira a principal', async ({ page }) => {
  await registerCarla(page)
  const primary = section(page, 'principal')
  await expect(page.getByTestId('wallet-empty-slot')).toHaveCount(2)
  // Sem a principal, ainda não se oferece a secundária.
  await expect(section(page, 'secundária').getByRole('button', { name: /^Adicionar/ })).toBeDisabled()

  await primary.getByRole('button', { name: /^Adicionar/ }).click()
  await expect(field(primary, 'Nome de exibição')).toBeFocused()
  await fillWallet(primary, VALID_WALLET)
  await saveWallet(primary).click()

  await expect(page.getByRole('status').filter({ hasText: 'Carteira cadastrada.' })).toBeAttached()
  await expect(primary.getByTestId('wallet-connection')).toHaveText('Desconectada')
  await expect(section(page, 'secundária').getByRole('button', { name: /^Adicionar/ })).toBeEnabled()
})

test('editar a carteira, com validação', async ({ page }) => {
  await signIn(page, bruno)
  const primary = section(page, 'principal')

  await expect(field(primary, 'Apelido da carteira')).toHaveValue('Carteira principal')
  await field(primary, 'Apelido da carteira').fill('')
  await saveWallet(primary).click()
  await expect(primary.getByText('Informe um apelido para a carteira.')).toBeVisible()

  await field(primary, 'Apelido da carteira').fill('Cofre')
  await field(primary, 'Rede').selectOption('Solana')
  await saveWallet(primary).click()

  await expect(page.getByRole('status').filter({ hasText: 'Carteira atualizada.' })).toBeAttached()
  await page.reload()
  await expect(field(section(page, 'principal'), 'Apelido da carteira')).toHaveValue('Cofre')
  await expect(field(section(page, 'principal'), 'Rede')).toHaveValue('Solana')
})

test('trocar o endereço de uma carteira conectada encerra a conexão', async ({ page }) => {
  await signIn(page, ana)
  await page.evaluate(async () => {
    const wallets = await (
      await fetch('/api/wallets', { headers: { Authorization: `Bearer ${localStorage.getItem('kurio.session')}` } })
    ).json()

    await fetch(`/api/wallets/${wallets.wallets[0].id}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('kurio.session')}` },
    })
  })
  await page.reload()
  const primary = section(page, 'principal')
  await expect(primary.getByTestId('wallet-connection')).toHaveText('Conectada')

  await field(primary, 'Endereço da carteira').fill(NEW_ADDRESS)
  await saveWallet(primary).click()

  await expect(primary.getByTestId('wallet-connection')).toHaveText('Desconectada')
})

test('definir a secundária como principal troca os papéis', async ({ page }) => {
  await signIn(page, ana)

  await section(page, 'secundária').getByRole('button', { name: /^Definir como principal/ }).click()

  await expect(field(section(page, 'principal'), 'Endereço da carteira')).toHaveValue(
    '0x9aF3C1d5E2b84A07fB6C3e1D28a9B05c4e7F1a2B',
  )
  await expect(field(section(page, 'secundária'), 'Endereço da carteira')).toHaveValue(
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  )
  await expect(page.getByRole('status').filter({ hasText: 'agora é a carteira principal.' })).toBeAttached()

  await page.reload()
  await expect(field(section(page, 'principal'), 'Endereço da carteira')).toHaveValue(
    '0x9aF3C1d5E2b84A07fB6C3e1D28a9B05c4e7F1a2B',
  )
})

test('remover pede confirmação; cancelar mantém a carteira', async ({ page }) => {
  await signIn(page, ana)
  const secondary = section(page, 'secundária')

  await secondary.getByRole('button', { name: /^Remover/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Remover Carteira secundária?')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(saveWallet(secondary)).toBeVisible()

  await secondary.getByRole('button', { name: /^Remover/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click()

  await expect(saveWallet(section(page, 'secundária'))).toHaveCount(0)
  await expect(page.getByTestId('wallet-empty-slot')).toHaveCount(1)
  await expect(page.getByRole('status').filter({ hasText: 'removida.' })).toBeAttached()
})

test('remover a principal promove a secundária', async ({ page }) => {
  await signIn(page, ana)

  await section(page, 'principal').getByRole('button', { name: /^Remover/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText('passará a ser a principal')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click()

  await expect(field(section(page, 'principal'), 'Endereço da carteira')).toHaveValue(
    '0x9aF3C1d5E2b84A07fB6C3e1D28a9B05c4e7F1a2B',
  )
  await expect(saveWallet(section(page, 'secundária'))).toHaveCount(0)
})

test('a API recusa uma terceira carteira e dados inválidos, mesmo fora da interface', async ({ page }) => {
  await signIn(page, ana)
  await expect(section(page, 'principal')).toBeVisible()

  const result = await page.evaluate(async (valid) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('kurio.session')}`,
    }
    const post = async (body: unknown) => {
      const response = await fetch('/api/wallets', { method: 'POST', headers, body: JSON.stringify(body) })

      return { status: response.status, body: await response.json() }
    }
    const { network, ensName, ...rest } = valid

    return {
      third: await post({
        ...rest,
        label: 'Terceira',
        address: `0x${'2'.repeat(40)}`,
        networks: [network],
        ensName: `${ensName}.eth`,
      }),
      invalid: await post({ label: '', address: 'xyz', networks: [] }),
    }
  }, VALID_WALLET)

  expect(result.third.status).toBe(409)
  expect(result.third.body.code).toBe('wallet_limit')
  expect(result.invalid.status).toBe(422)
  expect(Object.keys(result.invalid.body.errors).sort()).toEqual([
    'address',
    'displayName',
    'email',
    'ensName',
    'label',
    'network',
    'profileName',
    'referralCode',
    'walletType',
  ])
})

test('conta nova cadastra a carteira pelo pagamento e conclui a compra', async ({ page }) => {
  await registerCarla(page)
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  await page.goto('/pagamento')
  await expect(page.getByText('Você ainda não tem carteiras cadastradas.')).toBeVisible()
  await page.getByRole('link', { name: 'Cadastrar carteira' }).click()

  await expect(page).toHaveURL(/\/carteiras\?redirect=%2Fpagamento/)
  const primary = section(page, 'principal')
  await fillWallet(primary, VALID_WALLET)
  await saveWallet(primary).click()

  // O caminho de volta ao pagamento aparece sozinho.
  await page.getByRole('link', { name: 'Voltar ao pagamento' }).click()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByRole('radio', { name: /Minha carteira/ })).toBeChecked()

  await fillCollector(page)
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByTestId(/wallet-status-wallet-/)).toHaveText('Conectada')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
})

test('o menu da conta leva às carteiras', async ({ page }) => {
  await signIn(page, ana, '/')
  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Minhas carteiras' }).click()

  await expect(page).toHaveURL('/carteiras')
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  await signIn(page, ana)
  await expect(section(page, 'principal')).toBeVisible()

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/carteiras')
    await expect(section(page, 'principal')).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `largura ${width}`).toBe(0)
  }
})

test('carteiras (Figma): colunas de 417 px, campos de 40 px e botão de 131 × 40 no desktop', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1264, 'duas colunas só a partir de 1264 px')
  await registerCarla(page)
  const primary = section(page, 'principal')

  const name = (await field(primary, 'Nome de exibição').boundingBox())!
  const nickname = (await field(primary, 'Apelido da carteira').boundingBox())!
  const save = (await saveWallet(primary).boundingBox())!

  expect(name.width).toBe(417)
  expect(name.height).toBe(40)
  expect(nickname.x - (name.x + name.width)).toBe(28)
  expect(save.width).toBe(131)
  expect(save.height).toBe(40)
})
