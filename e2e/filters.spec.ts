import { expect, test, type Locator, type Page } from '@playwright/test'

// Em telas >= 1280 px os filtros ficam na barra lateral; abaixo disso, na gaveta.
function usesDrawer(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 1280
}

async function openFilters(page: Page): Promise<Locator> {
  if (usesDrawer(page)) {
    // No mobile o botão fica no header; no tablet, na barra de abas.
    await page.getByRole('button', { name: 'Filtros' }).first().click()

    return page.getByRole('dialog', { name: 'Filtros' })
  }

  return page.getByRole('complementary', { name: 'Filtros' })
}

async function closeFilters(page: Page) {
  if (usesDrawer(page)) {
    await page.getByRole('button', { name: 'Fechar filtros' }).click()
  }
}

async function facetCounts(group: Locator) {
  const labels = await group.getByRole('checkbox').evaluateAll((inputs) =>
    inputs.map((input) => input.closest('label')?.textContent ?? ''),
  )

  return labels.map((label) => Number(/\((\d+)\)/.exec(label)?.[1]))
}

/**
 * Marca um filtro clicando no rótulo (como a pessoa faz). O campo de verdade é invisível e fica
 * em outro ponto da tela, que pode ficar sob o botão fixo da gaveta no mobile.
 */
async function checkFilter(filters: Locator, name: RegExp) {
  const checkbox = filters.getByRole('checkbox', { name })

  // O "has" é relativo ao rótulo: usa um localizador da página, não o encadeado a partir dos filtros.
  await filters.locator('label').filter({ has: filters.page().getByRole('checkbox', { name }) }).click()
  await expect(checkbox).toBeChecked()
}

async function waitForGrid(page: Page) {
  await expect(page.getByTestId('nft-grid')).toBeVisible()
}

test('contagens dos filtros batem com os 27 NFTs do mock', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  const filters = await openFilters(page)
  const categories = await facetCounts(filters.getByRole('group', { name: 'Coleções' }))
  const networks = await facetCounts(filters.getByRole('group', { name: 'Rede' }))

  expect(categories).toHaveLength(9)
  expect(categories.reduce((sum, count) => sum + count, 0)).toBe(27)
  expect(networks).toEqual([9, 9, 9])
})

test('filtro de coleção vai para a URL, atualiza a lista e as contagens', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  const filters = await openFilters(page)
  await checkFilter(filters, /Fotografia/)

  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page.getByTestId('nft-card')).toHaveCount(4)

  // Contagem de Rede passa a considerar só a coleção escolhida.
  const networks = await facetCounts(filters.getByRole('group', { name: 'Rede' }))
  expect(networks.reduce((sum, count) => sum + count, 0)).toBe(4)
})

test('filtros se combinam (coleção + rede)', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  const filters = await openFilters(page)
  await checkFilter(filters, /Fotografia/)
  await checkFilter(filters, /Ethereum/)

  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page).toHaveURL(/network=Ethereum/)

  // A lista anterior fica na tela até a nova chegar (keepPreviousData): espera a contagem cair
  // em vez de lê-la na hora, que é o que fazia o teste falhar sob carga.
  await expect.poll(() => page.getByTestId('nft-card').count()).toBeLessThan(4)
})

test('mudar qualquer filtro reinicia a paginação para a página 1', async ({ page }) => {
  await page.goto('/?page=3')
  await waitForGrid(page)
  await expect(page.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('link', { name: 'Novos lançamentos' }).click()

  await expect(page).toHaveURL(/tab=novos/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
})

test('filtro de rede também reinicia a paginação', async ({ page }) => {
  await page.goto('/?page=2')
  await waitForGrid(page)

  const filters = await openFilters(page)
  await checkFilter(filters, /Solana/)

  await expect(page).toHaveURL(/network=Solana/)
  await expect(page).not.toHaveURL(/page=/)
})

test('paginação usa a URL e funciona com o histórico do navegador', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)
  const firstName = await page.getByTestId('nft-card').first().getByRole('heading').textContent()

  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByTestId('nft-card').first().getByRole('heading')).not.toHaveText(firstName!)

  await page.goBack()
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByTestId('nft-card').first().getByRole('heading')).toHaveText(firstName!)
})

test('página além do fim volta para a última página', async ({ page }) => {
  await page.goto('/?page=99')

  await expect(page).toHaveURL(/page=3/)
  await expect(page.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
})

test('ordenação por menor preço', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  // No mobile a ordenação fica dentro da gaveta; de 768 px em diante, na barra de abas.
  const mobile = (page.viewportSize()?.width ?? 0) < 768
  const scope = mobile ? await openFilters(page) : page
  await scope.getByLabel('Ordenar por:').selectOption('price-asc')
  await closeFilters(page)

  await expect(page).toHaveURL(/sort=price-asc/)
  await expect(page.getByTestId('nft-card').first()).toContainText('0.39 ETH')
})

test('abas: Em alta filtra pelos NFTs em alta', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  await page.getByRole('link', { name: 'Em alta' }).click()

  await expect(page).toHaveURL(/tab=em-alta/)
  await expect(page.getByRole('link', { name: 'Em alta' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('status').filter({ hasText: 'NFTs encontrados' })).toHaveText('10 NFTs encontrados')
})

test('faixa de preço aplica string decimal na URL', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  const filters = await openFilters(page)
  const min = filters.getByRole('slider', { name: 'Preço mínimo' })
  await min.focus()
  // 0,39 + 61 centésimos = 1,00 ETH.
  for (let step = 0; step < 6; step++) {
    await min.press('Shift+ArrowRight')
  }
  await min.press('ArrowRight')
  await filters.getByRole('button', { name: 'Aplicar' }).click()

  await expect(page).toHaveURL(/minPrice=1\.00/)
  const prices = await page.getByTestId('nft-card').evaluateAll((cards) =>
    cards.map((card) => Number(/(\d+\.\d+) ETH/.exec(card.textContent ?? '')?.[1])),
  )
  expect(prices.length).toBeGreaterThan(0)
  expect(Math.min(...prices)).toBeGreaterThanOrEqual(1)
})

test('preço na URL continua string decimal (sem virar float)', async ({ page }) => {
  await page.goto('/?minPrice=0.10&maxPrice=3.50')
  await waitForGrid(page)

  await expect(page).toHaveURL(/minPrice=0\.10/)
  await expect(page).toHaveURL(/maxPrice=3\.50/)
})

test('busca do header vai para a URL e filtra o catálogo', async ({ page }) => {
  await page.goto('/')
  await waitForGrid(page)

  // No desktop a busca do cabeçalho é um ícone que abre o campo; no mobile o campo já está à vista.
  const open = page.getByRole('button', { name: 'Abrir busca' })

  if (await open.isVisible()) {
    await open.click()
  }

  const search = page.getByRole('searchbox')
  await search.fill('ivory')
  await search.press('Enter')

  await expect(page).toHaveURL(/q=ivory/)
  await expect(page.getByTestId('nft-card')).toHaveCount(3)
})

test('estado dos filtros sobrevive a refresh', async ({ page }) => {
  await page.goto('/?category=Fotografia&sort=price-desc&tab=novos')
  await waitForGrid(page)
  await page.reload()
  await waitForGrid(page)

  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page).toHaveURL(/tab=novos/)
  await expect(page.getByRole('link', { name: 'Novos lançamentos' })).toHaveAttribute('aria-current', 'page')
})

test('sem resultados: mensagem e botão para limpar filtros', async ({ page }) => {
  await page.goto('/?q=zzzz')

  await expect(page.getByTestId('nft-empty')).toContainText('Nenhum NFT encontrado.')
  await page.getByRole('button', { name: 'Limpar filtros' }).click()

  await expect(page).not.toHaveURL(/q=/)
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('gaveta de filtros: foco entra no diálogo e volta ao botão ao fechar', async ({ page }) => {
  test.skip(!usesDrawer(page), 'gaveta só abaixo de 1280 px')
  await page.goto('/')
  await waitForGrid(page)

  const trigger = page.getByRole('button', { name: 'Filtros' }).first()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Filtros' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator(':focus')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('contagens mantêm o estilo do Figma: "(N)" à direita, mesma fonte e cor do rótulo, negrito só em Coleções', async ({
  page,
}) => {
  await page.goto('/')
  await waitForGrid(page)

  const filters = await openFilters(page)

  for (const [title, weight] of [
    ['Coleções', '700'],
    ['Rede', '400'],
  ] as const) {
    const row = filters.getByRole('group', { name: title }).getByRole('checkbox').first().locator('xpath=ancestor::label')
    const [name, count] = [row.locator('> span').nth(0), row.locator('> span').nth(1)]

    await expect(count).toHaveText(/^\s*,?\s*\(\d+\)$/)

    const styles = await row.evaluate((label) => {
      const [nameEl, countEl] = Array.from(label.querySelectorAll(':scope > span')) as HTMLElement[]
      const read = (el: HTMLElement) => {
        const { fontFamily, fontSize, color, fontWeight } = getComputedStyle(el)

        return { fontFamily, fontSize, color, fontWeight, x: el.getBoundingClientRect().x }
      }

      return { name: read(nameEl), count: read(countEl) }
    })

    expect(styles.count.fontFamily).toBe(styles.name.fontFamily)
    expect(styles.count.fontSize).toBe(styles.name.fontSize)
    expect(styles.count.color).toBe(styles.name.color)
    expect(styles.count.fontWeight).toBe(weight)
    expect(styles.count.x).toBeGreaterThan(styles.name.x)
    await expect(name).not.toHaveText(/\(\d+\)/)
  }
})
