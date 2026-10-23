import { expect, test, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

// Cenários de falha do MSW (CHALLENGE, seção 6): latência, timeout, queda de conexão,
// 403, falha transitória e erro geral. Cada cenário é ligado pelo localStorage, como em
// qualquer outro teste, e vale para a API inteira.

const [ana] = mockUsers

type Scenario =
  | 'slow'
  | 'variable-latency'
  | 'request-timeout'
  | 'network-error'
  | 'forbidden'
  | 'transient-failure'
  | 'error'

const main = (page: Page) => page.getByRole('main')

/** Liga o cenário antes de a página carregar (vale já nas primeiras requisições). */
async function startWith(page: Page, scenario: Scenario) {
  await page.addInitScript((value) => localStorage.setItem('mock-scenario', value), scenario)
}

/** Troca o cenário com a página já aberta (para entrar na conta antes de falhar). */
async function switchTo(page: Page, scenario: Scenario | null) {
  await page.evaluate((value) => {
    if (value) {
      localStorage.setItem('mock-scenario', value)
    } else {
      localStorage.removeItem('mock-scenario')
    }
    window.__mockControl?.resetScenario()
  }, scenario)
}

async function signIn(page: Page, redirect = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

test.describe('latência', () => {
  test('lentidão: o esqueleto aparece e a lista só chega depois do atraso', async ({ page }) => {
    await startWith(page, 'slow')
    await page.goto('/')

    await expect(page.getByTestId('nft-grid-loading')).toBeVisible()
    const startedAt = Date.now()
    await expect(page.getByTestId('nft-grid')).toBeVisible({ timeout: 10_000 })

    // O atraso do cenário é de 1,2 s: a lista não pode ter chegado antes disso.
    expect(Date.now() - startedAt).toBeGreaterThan(900)
    await expect(page.getByTestId('nft-card')).toHaveCount(9)
  })

  test('latência variável: a resposta antiga chega depois e não sobrescreve a nova', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('nft-grid')).toBeVisible()

    const arrivals: string[] = []
    page.on('response', (response) => {
      const url = new URL(response.url())

      if (url.pathname === '/api/nfts') {
        arrivals.push(url.searchParams.get('page') ?? '1')
      }
    })

    // A 1ª requisição depois do reset leva 900 ms; a 2ª, 60 ms.
    await switchTo(page, 'variable-latency')
    await page.getByRole('link', { name: 'Página 2' }).click()
    await page.getByRole('link', { name: 'Página 3' }).click()

    // A página 3 (pedida por último) chega primeiro; a 2 chega depois, já fora de hora.
    await expect.poll(() => arrivals, { timeout: 10_000 }).toEqual(['3', '2'])

    await expect(page).toHaveURL(/page=3/)
    await expect(page.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')

    // Com as duas respostas já recebidas, a tela continua mostrando a página 3 (9 itens, 27 no total).
    await expect(page.getByTestId('nft-grid')).toHaveAttribute('aria-busy', 'false')
    await expect(page.getByTestId('nft-card')).toHaveCount(9)
    const lastPage = await page.getByTestId('nft-card').first().textContent()

    await page.waitForTimeout(1200)
    await expect(page.getByTestId('nft-card').first()).toHaveText(lastPage ?? '')
    await expect(page.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('falhas de conexão', () => {
  test('timeout: qualquer endpoint sem resposta falha dentro do prazo e a tela se recupera', async ({ page }) => {
    await startWith(page, 'request-timeout')
    await page.goto('/')

    // Timeout de 3 s (Playwright) e uma nova tentativa: o erro aparece em ~7 s, sem travar a tela.
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs.' })).toBeVisible({
      timeout: 20_000,
    })

    await switchTo(page, null)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('nft-grid')).toBeVisible()
  })

  test('timeout também vale para rotas privadas (carteiras)', async ({ page }) => {
    await signIn(page)
    await switchTo(page, 'request-timeout')
    await page.goto('/carteiras')

    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível verificar sua sessão.' })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('queda de conexão: erro de rede em qualquer endpoint, com recuperação ao voltar', async ({ page }) => {
    await signIn(page)
    await page.goto('/carteiras')
    await expect(page.getByTestId('wallet-card').first()).toBeVisible()

    await switchTo(page, 'network-error')
    await page.goto('/carteiras')
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível verificar sua sessão.' })).toBeVisible({
      timeout: 15_000,
    })

    await switchTo(page, null)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('wallet-card').first()).toBeVisible()
  })

  test('queda de conexão no catálogo mostra o erro e permite tentar de novo', async ({ page }) => {
    await startWith(page, 'network-error')
    await page.goto('/')

    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs.' })).toBeVisible({
      timeout: 15_000,
    })

    await switchTo(page, null)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('nft-grid')).toBeVisible()
  })
})

test.describe('403: falta de permissão', () => {
  test('carteiras e pedido mostram o aviso de permissão, sem botão de repetir', async ({ page }) => {
    await signIn(page)
    await switchTo(page, 'forbidden')

    await page.goto('/carteiras')
    await expect(main(page).getByRole('alert')).toHaveText('Você não tem permissão para ver estas carteiras.')
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0)

    await page.goto('/pedido/KUR-000001')
    await expect(main(page).getByRole('alert')).toHaveText('Você não tem permissão para ver este pedido.')
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0)
  })

  test('o catálogo público continua aberto e o perfil recusa a alteração', async ({ page }) => {
    await signIn(page, '/perfil')
    await expect(main(page).getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await switchTo(page, 'forbidden')

    await main(page).getByLabel('Nome completo', { exact: true }).fill('Ana Souza Lima')
    await main(page).getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(main(page).getByRole('alert').filter({ hasText: 'Você não tem permissão para alterar este perfil.' })).toBeVisible()

    await page.goto('/')
    await expect(page.getByTestId('nft-grid')).toBeVisible()
  })

  test('sem login continua sendo 401, não 403', async ({ page }) => {
    await startWith(page, 'forbidden')
    await page.goto('/carteiras')

    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('falha transitória', () => {
  test('503 na 1ª tentativa: a tela se recupera sozinha, sem mostrar erro', async ({ page }) => {
    const statuses: number[] = []
    page.on('response', (response) => {
      if (new URL(response.url()).pathname === '/api/nfts') {
        statuses.push(response.status())
      }
    })

    await startWith(page, 'transient-failure')
    await page.goto('/')

    await expect(page.getByTestId('nft-grid')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('nft-card')).toHaveCount(9)
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível' })).toHaveCount(0)
    expect(statuses.slice(0, 2)).toEqual([503, 200])
  })

  test('a ação do usuário não é repetida sozinha: o login falha uma vez e funciona ao tentar de novo', async ({ page }) => {
    await startWith(page, 'transient-failure')
    await page.goto('/login')
    await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
    await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
    await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(main(page).getByText('Não foi possível entrar agora. Tente novamente.')).toBeVisible()

    await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login/)
  })
})

test.describe('erro geral (500)', () => {
  test('uma falha da API ao verificar a sessão não vira logout e se recupera', async ({ page }) => {
    await signIn(page)
    await switchTo(page, 'error')

    await page.goto('/carteiras')
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível verificar sua sessão.' })).toBeVisible()
    // Falha da API não é logout: continua na tela, sem ir ao login.
    await expect(page).toHaveURL(/\/carteiras/)

    await switchTo(page, null)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('wallet-card').first()).toBeVisible()
  })

  test('carteiras: com a sessão em cache, a própria lista mostra o erro e se recupera', async ({ page }) => {
    await signIn(page, '/perfil')
    await expect(main(page).getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await switchTo(page, 'error')

    // Navegação interna: a sessão está em cache, só a lista de carteiras é pedida.
    await main(page).getByRole('link', { name: 'carteiras' }).click()
    await expect(main(page).getByRole('alert')).toContainText('Não foi possível carregar suas carteiras.')

    await switchTo(page, null)
    await main(page).getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('wallet-card').first()).toBeVisible()
  })

  test('perfil: salvar com a API fora mostra o erro no formulário', async ({ page }) => {
    await signIn(page, '/perfil')
    await expect(main(page).getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await switchTo(page, 'error')

    await main(page).getByLabel('Nome completo', { exact: true }).fill('Ana Souza Lima')
    await main(page).getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(
      main(page).getByRole('alert').filter({ hasText: 'Não foi possível salvar os dados. Tente novamente.' }),
    ).toBeVisible()
  })

  test('autenticação: login e cadastro mostram a falha e ficam na tela', async ({ page }) => {
    await startWith(page, 'error')

    await page.goto('/login')
    await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
    await main(page).getByLabel('Senha', { exact: true }).fill(ana.password)
    await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(main(page).getByText('Não foi possível entrar agora. Tente novamente.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)

    await page.goto('/cadastro')
    await main(page).getByLabel('Nome completo', { exact: true }).fill('Maria Teste')
    await main(page).getByLabel('E-mail', { exact: true }).fill('maria.teste@kurio.test')
    await main(page).getByLabel('Senha', { exact: true }).fill('Senha-segura-1')
    await main(page).getByLabel('Confirmar senha', { exact: true }).fill('Senha-segura-1')
    await main(page).getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(main(page).getByText('Não foi possível criar a conta agora. Tente novamente.')).toBeVisible()
    await expect(page).toHaveURL(/\/cadastro/)
  })
})
