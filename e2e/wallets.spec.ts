import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

const [ana, bruno] = mockUsers

const NEW_ADDRESS = '0x1111111111111111111111111111111111111111'
// O endereço da carteira principal do Bruno, em minúsculas (duplicata).
const BRUNO_ADDRESS_LOWER = '0x3fd2a8c7b1e90d4a6c5b2e7f8a1c9d3e0b4a7c6d'

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
  await main(page).getByLabel('Nome completo', { exact: true }).fill('Carla Mendes')
  await main(page).getByLabel('E-mail', { exact: true }).fill('carla@exemplo.com')
  await main(page).getByLabel('Senha', { exact: true }).fill('senha1234')
  await main(page).getByLabel('Confirmar senha', { exact: true }).fill('senha1234')
  await main(page).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL('/carteiras')
}

function walletCard(page: Page, role: 'principal' | 'secundária') {
  return page
    .getByTestId('wallet-card')
    .filter({ has: page.getByRole('heading', { name: `Carteira ${role}`, exact: true }) })
}

function emptySlot(page: Page, role: 'principal' | 'secundária') {
  return page
    .getByTestId('wallet-empty-slot')
    .filter({ has: page.getByRole('heading', { name: `Carteira ${role}`, exact: true }) })
}

function dialog(page: Page) {
  return page.getByRole('dialog')
}

async function fillWallet(dialogLocator: Locator, values: { label?: string; address?: string; networks?: string[] }) {
  if (values.label !== undefined) {
    await dialogLocator.getByLabel('Apelido').fill(values.label)
  }

  if (values.address !== undefined) {
    await dialogLocator.getByLabel('Endereço da carteira').fill(values.address)
  }

  for (const network of values.networks ?? []) {
    await dialogLocator.getByRole('checkbox', { name: network }).check()
  }
}

async function saveWallet(page: Page) {
  await dialog(page).getByRole('button', { name: 'Salvar' }).click()
}

test('visitante vai ao login e volta para as carteiras', async ({ page }) => {
  await page.goto('/carteiras')

  await expect(page).toHaveURL(/\/login\?redirect=%2Fcarteiras/)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/carteiras')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carteiras')
})

test('mostra a carteira principal e a secundária com os dados cadastrados', async ({ page }) => {
  await signIn(page, ana)

  const primary = walletCard(page, 'principal')
  await expect(primary.getByTestId('wallet-label')).toHaveText('Carteira principal')
  await expect(primary.getByTestId('wallet-address')).toHaveText('0x71C7…976F')
  await expect(primary.getByTestId('wallet-networks')).toHaveText('Ethereum, Polygon')
  await expect(primary.getByTestId('wallet-connection')).toHaveText('Desconectada')

  const secondary = walletCard(page, 'secundária')
  await expect(secondary.getByTestId('wallet-address')).toHaveText('0x9aF3…1a2B')
  await expect(secondary.getByTestId('wallet-networks')).toHaveText('Polygon, Solana')

  // Com as duas cadastradas, não há como adicionar uma terceira.
  await expect(page.getByTestId('wallet-empty-slot')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Adicionar carteira/ })).toHaveCount(0)
})

test('quem tem só uma carteira vê o espaço para a secundária', async ({ page }) => {
  await signIn(page, bruno)

  await expect(walletCard(page, 'principal')).toBeVisible()
  await expect(emptySlot(page, 'secundária')).toBeVisible()
  await expect(walletCard(page, 'secundária')).toHaveCount(0)
})

test('cadastrar a carteira secundária: validação, sucesso e persistência', async ({ page }) => {
  await signIn(page, bruno)
  await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()

  // Campos vazios: erros associados, foco no primeiro.
  await saveWallet(page)
  await expect(dialog(page).getByLabel('Apelido')).toBeFocused()
  await expect(dialog(page).getByLabel('Apelido')).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog(page).getByText('Informe um apelido para a carteira.')).toBeVisible()
  await expect(dialog(page).getByText('Informe o endereço da carteira.')).toBeVisible()
  await expect(dialog(page).getByText('Selecione ao menos uma rede.')).toBeVisible()

  await fillWallet(dialog(page), { label: 'Reserva', address: '0x123' })
  await saveWallet(page)
  await expect(dialog(page).getByText('Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais.')).toBeVisible()

  await fillWallet(dialog(page), { address: NEW_ADDRESS, networks: ['Polygon', 'Solana'] })
  await saveWallet(page)

  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: 'Carteira cadastrada.' })).toBeAttached()
  const secondary = walletCard(page, 'secundária')
  await expect(secondary.getByTestId('wallet-label')).toHaveText('Reserva')
  await expect(secondary.getByTestId('wallet-address')).toHaveText('0x1111…1111')
  await expect(secondary.getByTestId('wallet-networks')).toHaveText('Polygon, Solana')
  await expect(page.getByTestId('wallet-empty-slot')).toHaveCount(0)

  await page.reload()
  await expect(walletCard(page, 'secundária').getByTestId('wallet-label')).toHaveText('Reserva')
})

test('conflito: endereço já cadastrado (sem diferenciar maiúsculas) fica no campo', async ({ page }) => {
  await signIn(page, bruno)
  await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
  await fillWallet(dialog(page), { label: 'Duplicada', address: BRUNO_ADDRESS_LOWER, networks: ['Ethereum'] })
  await saveWallet(page)

  await expect(dialog(page).getByText('Esta carteira já está cadastrada.')).toBeVisible()
  await expect(dialog(page).getByLabel('Endereço da carteira')).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog(page).getByLabel('Endereço da carteira')).toBeFocused()
  await expect(walletCard(page, 'secundária')).toHaveCount(0)
})

test('a primeira carteira de uma conta nova vira a principal', async ({ page }) => {
  await registerCarla(page)
  await expect(emptySlot(page, 'principal')).toBeVisible()
  // Sem a principal, ainda não se oferece a secundária.
  await expect(emptySlot(page, 'secundária')).toHaveCount(0)

  await page.getByRole('button', { name: 'Adicionar carteira principal' }).click()
  await fillWallet(dialog(page), { label: 'Minha carteira', address: NEW_ADDRESS, networks: ['Ethereum'] })
  await saveWallet(page)

  await expect(walletCard(page, 'principal').getByTestId('wallet-label')).toHaveText('Minha carteira')
  await expect(emptySlot(page, 'secundária')).toBeVisible()
})

test('editar apelido e redes, com validação', async ({ page }) => {
  await signIn(page, bruno)
  const card = walletCard(page, 'principal')

  await card.getByRole('button', { name: /^Editar/ }).click()
  await expect(dialog(page).getByLabel('Apelido')).toHaveValue('Carteira principal')
  await expect(dialog(page).getByRole('checkbox', { name: 'Solana' })).toBeChecked()

  await dialog(page).getByLabel('Apelido').fill('')
  await saveWallet(page)
  await expect(dialog(page).getByText('Informe um apelido para a carteira.')).toBeVisible()

  await fillWallet(dialog(page), { label: 'Cofre' })
  await dialog(page).getByRole('checkbox', { name: 'Solana' }).uncheck()
  await saveWallet(page)

  await expect(dialog(page)).toHaveCount(0)
  await expect(card.getByTestId('wallet-label')).toHaveText('Cofre')
  await expect(card.getByTestId('wallet-networks')).toHaveText('Ethereum, Polygon')
  await expect(page.getByRole('status').filter({ hasText: 'Carteira atualizada.' })).toBeAttached()
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
  await expect(walletCard(page, 'principal').getByTestId('wallet-connection')).toHaveText('Conectada')

  await walletCard(page, 'principal').getByRole('button', { name: /^Editar/ }).click()
  await dialog(page).getByLabel('Endereço da carteira').fill(NEW_ADDRESS)
  await saveWallet(page)

  await expect(walletCard(page, 'principal').getByTestId('wallet-connection')).toHaveText('Desconectada')
})

test('definir a secundária como principal troca os papéis', async ({ page }) => {
  await signIn(page, ana)

  await walletCard(page, 'secundária').getByRole('button', { name: /^Definir como principal/ }).click()

  await expect(walletCard(page, 'principal').getByTestId('wallet-address')).toHaveText('0x9aF3…1a2B')
  await expect(walletCard(page, 'secundária').getByTestId('wallet-address')).toHaveText('0x71C7…976F')
  await expect(page.getByRole('status').filter({ hasText: 'agora é a carteira principal.' })).toBeAttached()

  await page.reload()
  await expect(walletCard(page, 'principal').getByTestId('wallet-address')).toHaveText('0x9aF3…1a2B')
})

test('remover pede confirmação; cancelar mantém a carteira', async ({ page }) => {
  await signIn(page, ana)
  const secondary = walletCard(page, 'secundária')

  await secondary.getByRole('button', { name: /^Remover/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Remover Carteira secundária?')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(secondary).toBeVisible()

  await secondary.getByRole('button', { name: /^Remover/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click()

  await expect(walletCard(page, 'secundária')).toHaveCount(0)
  await expect(emptySlot(page, 'secundária')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'removida.' })).toBeAttached()
})

test('remover a principal promove a secundária', async ({ page }) => {
  await signIn(page, ana)

  await walletCard(page, 'principal').getByRole('button', { name: /^Remover/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText('passará a ser a principal')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click()

  await expect(walletCard(page, 'principal').getByTestId('wallet-address')).toHaveText('0x9aF3…1a2B')
  await expect(walletCard(page, 'secundária')).toHaveCount(0)
})

test('a API recusa uma terceira carteira e dados inválidos, mesmo fora da interface', async ({ page }) => {
  await signIn(page, ana)
  await expect(walletCard(page, 'principal')).toBeVisible()

  const result = await page.evaluate(async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('kurio.session')}`,
    }
    const post = async (body: unknown) => {
      const response = await fetch('/api/wallets', { method: 'POST', headers, body: JSON.stringify(body) })

      return { status: response.status, body: await response.json() }
    }

    return {
      third: await post({ label: 'Terceira', address: `0x${'2'.repeat(40)}`, networks: ['Ethereum'] }),
      invalid: await post({ label: '', address: 'xyz', networks: [] }),
    }
  })

  expect(result.third.status).toBe(409)
  expect(result.third.body.code).toBe('wallet_limit')
  expect(result.invalid.status).toBe(422)
  expect(Object.keys(result.invalid.body.errors).sort()).toEqual(['address', 'label', 'networks'])
})

test('conta nova cadastra a carteira pelo pagamento e conclui a compra', async ({ page }) => {
  await registerCarla(page)
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  await page.goto('/pagamento')
  await expect(page.getByText('Você ainda não tem carteiras cadastradas.')).toBeVisible()
  await page.getByRole('link', { name: 'Cadastrar carteira' }).click()

  await expect(page).toHaveURL(/\/carteiras\?redirect=%2Fpagamento/)
  await page.getByRole('button', { name: 'Adicionar carteira principal' }).click()
  await fillWallet(dialog(page), { label: 'Minha carteira', address: NEW_ADDRESS, networks: ['Ethereum'] })
  await saveWallet(page)

  // O caminho de volta ao pagamento aparece sozinho.
  await page.getByRole('link', { name: 'Voltar ao pagamento' }).click()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByRole('radio', { name: /Minha carteira/ })).toBeChecked()

  await main(page).getByLabel('Telefone').fill('(11) 91234-5678')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByTestId(/wallet-status-wallet-/)).toHaveText('Conectada')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByLabel('Li e aceito os termos de compra de NFTs.').check()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 10_000 })
})

test('o menu da conta leva às carteiras', async ({ page }) => {
  await signIn(page, ana, '/')
  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Minhas carteiras' }).click()

  await expect(page).toHaveURL('/carteiras')
})

test('diálogo: foco entra ao abrir, Esc fecha e o foco volta ao botão', async ({ page }) => {
  await signIn(page, bruno)
  const opener = page.getByRole('button', { name: 'Adicionar carteira secundária' })

  await opener.click()
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page).locator(':focus')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(dialog(page)).toHaveCount(0)
  await expect(opener).toBeFocused()

  // Reabrir começa em branco, sem sobras da tentativa anterior.
  await opener.click()
  await expect(dialog(page).getByLabel('Apelido')).toHaveValue('')
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  await signIn(page, ana)
  await expect(walletCard(page, 'principal')).toBeVisible()

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/carteiras')
    await expect(walletCard(page, 'principal')).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `largura ${width}`).toBe(0)
  }
})
