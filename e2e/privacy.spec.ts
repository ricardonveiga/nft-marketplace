import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

// Dados privados nunca passam de um usuário para outro na mesma aba, nem na tela nem no
// armazenamento do navegador (sessionStorage e localStorage fora do "servidor" simulado).
const [ana, bruno] = mockUsers

const SECRETS = {
  name: 'Ana Segredo Pessoal',
  username: 'ana_segredo',
  ensName: 'anasegredo',
  referralCode: 'SEGREDO99',
  notes: 'Observação privada da Ana.',
}

function main(page: Page) {
  return page.getByRole('main')
}

async function signIn(page: Page, user: { email: string; password?: string }) {
  await page.goto('/login')
  await main(page).getByLabel('E-mail', { exact: true }).fill(user.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(user.password!)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Conta de / })).toBeVisible()
}

async function signOut(page: Page, name: string) {
  await page.getByRole('button', { name: `Conta de ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: `Conta de ${name}` })).toBeHidden()
}

async function addNeonToCart(page: Page) {
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
}

/** Tudo o que o cliente guarda no navegador, em texto, para procurar vestígios. */
function browserStorage(page: Page) {
  return page.evaluate(() =>
    JSON.stringify({ session: { ...sessionStorage }, local: { ...localStorage } }),
  )
}

async function fillAnaDraft(page: Page) {
  await addNeonToCart(page)
  await page.goto('/pagamento')
  await main(page).getByLabel('Nome de exibição').fill(SECRETS.name)
  await main(page).getByLabel('Nome de usuário').fill(SECRETS.username)
  await main(page).getByLabel(/^Nome ENS/).fill(SECRETS.ensName)
  await main(page).getByLabel('Código de indicação').fill(SECRETS.referralCode)
  await main(page).getByLabel('Observação do colecionador (opcional)').fill(SECRETS.notes)
  // O rascunho é gravado a cada mudança; a conexão da carteira não é preciso aqui.
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('kurio.checkout-draft'))).toContain(
    SECRETS.notes,
  )
}

test('logout e troca de usuário: o rascunho do pagamento da Ana não aparece para o Bruno', async ({ page }) => {
  // Largura em que os campos opcionais existem (a partir de 768 px).
  await page.setViewportSize({ width: 1280, height: 900 })

  await signIn(page, ana)
  await fillAnaDraft(page)

  await signOut(page, ana.name)

  // Sair apaga o rascunho e a chave de idempotência do armazenamento da aba.
  expect(await page.evaluate(() => sessionStorage.getItem('kurio.checkout-draft'))).toBeNull()
  expect(await page.evaluate(() => sessionStorage.getItem('kurio.checkout-key'))).toBeNull()

  await signIn(page, bruno)
  await addNeonToCart(page)
  await page.goto('/pagamento')

  // O formulário do Bruno vem com os dados do Bruno; o que a conta não sabe, vazio.
  await expect(main(page).getByLabel('Nome de exibição')).toHaveValue(bruno.name)
  await expect(main(page).getByLabel(/^E-mail/)).toHaveValue(bruno.email)
  await expect(main(page).getByLabel('Nome de usuário')).toHaveValue(bruno.email.split('@')[0])
  await expect(main(page).getByLabel(/^Nome ENS/)).toHaveValue('')
  await expect(main(page).getByLabel('Código de indicação')).toHaveValue('')
  await expect(main(page).getByLabel('Observação do colecionador (opcional)')).toHaveValue('')

  // Nada da Ana na tela (inclui o e-mail e as carteiras dela) nem no armazenamento.
  await expect(main(page)).not.toContainText(SECRETS.name)
  await expect(main(page)).not.toContainText(ana.email)
  // Endereços das carteiras da Ana (a do Bruno também se chama "Carteira principal").
  await expect(main(page)).not.toContainText('0x71C7656E')
  await expect(main(page)).not.toContainText('0x9aF3C1d5')
  const storage = await browserStorage(page)

  for (const secret of [...Object.values(SECRETS), ana.email, 'wallet-ana', '0x71C7656E']) {
    expect(storage).not.toContain(secret)
  }
})

test('troca de usuário sem logout (rascunho esquecido na aba): o Bruno não o vê e ele é descartado', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })

  // Estado que sobra quando a aba da Ana é abandonada antes de o logout rodar.
  await page.addInitScript((secrets) => {
    if (sessionStorage.getItem('seeded')) {
      return
    }

    sessionStorage.setItem('seeded', '1')
    sessionStorage.setItem(
      'kurio.checkout-draft',
      JSON.stringify({
        userId: 'user-ana',
        values: { name: secrets.name, email: 'ana@kurio.test', referralCode: secrets.referralCode },
        walletId: 'wallet-ana-1',
        network: 'Ethereum',
      }),
    )
    sessionStorage.setItem(
      'kurio.checkout-key',
      JSON.stringify({ userId: 'user-ana', fingerprint: `{"name":"${secrets.name}"}`, key: 'chave-da-ana' }),
    )
  }, SECRETS)

  await signIn(page, bruno)
  await addNeonToCart(page)
  await page.goto('/pagamento')

  await expect(main(page).getByLabel('Nome de exibição')).toHaveValue(bruno.name)
  await expect(main(page).getByLabel(/^E-mail/)).toHaveValue(bruno.email)
  await expect(main(page).getByLabel('Código de indicação')).toHaveValue('')

  const storage = await browserStorage(page)

  expect(storage).not.toContain(SECRETS.name)
  expect(storage).not.toContain(SECRETS.referralCode)
  expect(storage).not.toContain('chave-da-ana')
})

test('o mesmo usuário com a sessão expirada no pagamento continua com o próprio rascunho', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })

  await signIn(page, ana)
  await addNeonToCart(page)
  await page.goto('/pagamento')
  await main(page).getByLabel('Nome de exibição').fill(SECRETS.name)
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('kurio.checkout-draft'))).toContain(
    SECRETS.name,
  )

  // A sessão expira durante a navegação: a próxima chamada à API leva ao login.
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'session-expired'))
  await page.getByRole('link', { name: /^Carrinho/ }).click()
  await expect(page).toHaveURL(/\/login\?.*reason=expired/)

  await page.evaluate(() => localStorage.removeItem('mock-scenario'))
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password!)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)

  // O rascunho é do mesmo usuário, então continua lá.
  await page.goto('/pagamento')
  await expect(main(page).getByLabel('Nome de exibição')).toHaveValue(SECRETS.name)
})
