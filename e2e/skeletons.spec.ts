import { expect, test, type Page } from '@playwright/test'

// Skeletons de detalhe e carrinho durante o carregamento lento, sem deslocamento de layout,
// e sem a animação do shimmer quando a pessoa prefere menos movimento. (O do catálogo também
// é visto em `scenarios.spec.ts`.) O cenário `slow` atrasa toda resposta em 1,2 s.

/** Soma os deslocamentos de layout (CLS) da página, ignorando os causados por interação. */
async function trackLayoutShift(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as { __cls: number }

    state.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) {
          state.__cls += entry.value
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
}

function layoutShift(page: Page) {
  return page.evaluate(() => (window as unknown as { __cls: number }).__cls)
}

async function enableSlow(page: Page) {
  await page.addInitScript(() => localStorage.setItem('mock-scenario', 'slow'))
}

test('detalhe: o esqueleto aparece durante a lentidão, depois some, sem deslocar o layout', async ({ page }) => {
  await trackLayoutShift(page)
  await enableSlow(page)
  await page.goto('/nft/nft-03')

  const skeleton = page.getByTestId('detail-loading')

  await expect(skeleton).toBeVisible()
  await expect(skeleton.locator('[data-slot="skeleton"]').first()).toBeVisible()

  await expect(page.getByTestId('detail-price')).toBeVisible({ timeout: 10_000 })
  await expect(skeleton).toHaveCount(0)
  // Dimensões preservadas: o conteúdo ocupa o lugar do esqueleto (CLS "bom" é até 0,1).
  expect(await layoutShift(page)).toBeLessThan(0.1)
})

test('carrinho: o esqueleto aparece durante a lentidão, depois some, sem deslocar o layout', async ({ page }) => {
  // O item entra no carrinho com a API em velocidade normal.
  await page.goto('/nft/nft-03')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()

  await trackLayoutShift(page)
  await page.evaluate(() => localStorage.setItem('mock-scenario', 'slow'))
  await page.goto('/carrinho')

  const skeleton = page.getByTestId('cart-loading')

  await expect(skeleton).toBeVisible()
  // O esqueleto cobre a lista e o resumo de valores.
  expect(await skeleton.locator('[data-slot="skeleton"]').count()).toBeGreaterThan(5)

  await expect(page.getByLabel('Cupom de desconto')).toBeVisible({ timeout: 10_000 })
  await expect(skeleton).toHaveCount(0)
  expect(await layoutShift(page)).toBeLessThan(0.1)
})

/** Nome da animação do brilho (shimmer) do primeiro esqueleto visível da página. */
function shimmerAnimation(page: Page, container: string) {
  return page
    .getByTestId(container)
    .locator('[data-slot="skeleton"]')
    .first()
    .evaluate((element) => getComputedStyle(element, '::after').animationName)
}

test('skeletons: o brilho (shimmer) anima por padrão', async ({ page }) => {
  await enableSlow(page)
  await page.goto('/')
  await expect(page.getByTestId('nft-grid-loading')).toBeVisible()

  expect(await shimmerAnimation(page, 'nft-grid-loading')).toBe('shimmer')
})

test('skeletons respeitam prefers-reduced-motion: sem animação do shimmer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await enableSlow(page)

  // Catálogo...
  await page.goto('/')
  await expect(page.getByTestId('nft-grid-loading')).toBeVisible()
  expect(await shimmerAnimation(page, 'nft-grid-loading')).toBe('none')

  // ...e detalhe.
  await page.goto('/nft/nft-03')
  await expect(page.getByTestId('detail-loading')).toBeVisible()
  expect(await shimmerAnimation(page, 'detail-loading')).toBe('none')
})
