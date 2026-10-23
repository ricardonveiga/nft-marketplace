import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockUsers } from '../src/mocks/fixtures/users'

// Navegação só por teclado (sem clique do mouse): login com Tab, menu da conta e diálogo de
// remover carteira. Em cada parada o foco precisa estar visível (`:focus-visible` + contorno ou anel).
const [ana] = mockUsers

function main(page: Page) {
  return page.getByRole('main')
}

/** O elemento focado indica o foco de forma visível (contorno ou anel/sombra)? */
async function expectVisibleFocus(locator: Locator) {
  await expect(locator).toBeFocused()

  const indicator = await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    // Rótulos e campos às vezes mostram o foco no elemento que os envolve (`has-[:focus-visible]`).
    const wrapper = element.closest('label, [role="menuitem"]') as HTMLElement | null
    const wrapperStyle = wrapper ? getComputedStyle(wrapper) : null
    const shows = (s: CSSStyleDeclaration | null) =>
      Boolean(s) && (s!.outlineStyle !== 'none' && parseFloat(s!.outlineWidth) > 0 || s!.boxShadow !== 'none')

    return { focusVisible: element.matches(':focus-visible'), visible: shows(style) || shows(wrapperStyle) }
  })

  expect(indicator.focusVisible, 'o foco veio do teclado').toBe(true)
  expect(indicator.visible, 'há contorno ou anel visível no elemento focado').toBe(true)
}

/** Aperta Tab até o elemento receber o foco (no máximo `limit` vezes). */
async function tabUntilFocused(page: Page, target: Locator, limit = 40) {
  for (let step = 0; step < limit; step++) {
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) {
      return
    }

    await page.keyboard.press('Tab')
  }

  await expect(target).toBeFocused()
}

test('login só com o teclado: Tab pelos campos com foco visível, Enter envia', async ({ page }) => {
  await page.goto('/login')
  await expect(main(page).getByLabel('E-mail', { exact: true })).toBeVisible()

  const email = main(page).getByLabel('E-mail', { exact: true })
  const password = main(page).getByLabel('Senha', { exact: true })
  const toggle = main(page).getByRole('button', { name: 'Mostrar senha' })
  const submit = main(page).getByRole('button', { name: 'Entrar', exact: true })

  // Chega ao e-mail só com Tab e digita sem tocar no mouse.
  await tabUntilFocused(page, email)
  await expectVisibleFocus(email)
  await page.keyboard.type(ana.email)

  // O próximo Tab leva à senha, depois ao botão de mostrar/ocultar e ao envio.
  await page.keyboard.press('Tab')
  await expectVisibleFocus(password)
  await page.keyboard.type(ana.password!)

  await page.keyboard.press('Tab')
  await expectVisibleFocus(toggle)

  await tabUntilFocused(page, submit, 6)
  await expectVisibleFocus(submit)

  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: `Conta de ${ana.name}` })).toBeVisible()
})

test('menu da conta só com o teclado: abre, navega com as setas, Esc fecha e devolve o foco', async ({ page }) => {
  await page.goto('/login')
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password!)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()

  const trigger = page.getByRole('button', { name: `Conta de ${ana.name}` })
  await expect(trigger).toBeVisible()

  // A partir daqui, nada de mouse: Tab até o botão da conta.
  await tabUntilFocused(page, trigger, 60)
  await expectVisibleFocus(trigger)

  await page.keyboard.press('Enter')
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()

  // Setas percorrem os itens; o item focado mostra o foco.
  const profile = menu.getByRole('menuitem', { name: 'Meu perfil' })
  for (let step = 0; step < 4; step++) {
    if (await profile.evaluate((element) => element === document.activeElement)) {
      break
    }

    await page.keyboard.press('ArrowDown')
  }
  await expect(profile).toBeFocused()

  // Esc fecha o menu e o foco volta ao botão que o abriu.
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expectVisibleFocus(trigger)

  // Abrir de novo e escolher o item com Enter leva à página.
  await page.keyboard.press('Enter')
  await expect(menu).toBeVisible()
  for (let step = 0; step < 4; step++) {
    if (await menu.getByRole('menuitem', { name: 'Meu perfil' }).evaluate((element) => element === document.activeElement)) {
      break
    }

    await page.keyboard.press('ArrowDown')
  }
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/perfil')
})

test('remover carteira só com o teclado: abre, Esc cancela e devolve o foco, Enter confirma', async ({ page }) => {
  await page.goto('/login?redirect=%2Fcarteiras')
  await main(page).getByLabel('E-mail', { exact: true }).fill(ana.email)
  await main(page).getByLabel('Senha', { exact: true }).fill(ana.password!)
  await main(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/carteiras')

  const secondary = page
    .getByTestId('wallet-card')
    .filter({ has: page.getByRole('heading', { name: 'Carteira secundária', exact: true }) })
  const remove = secondary.getByRole('button', { name: /^Remover/ })
  const dialog = page.getByRole('alertdialog')
  await expect(remove).toBeVisible()

  // Abre o diálogo com o teclado.
  await tabUntilFocused(page, remove, 80)
  await expectVisibleFocus(remove)
  await page.keyboard.press('Enter')
  await expect(dialog).toContainText('Remover Carteira secundária?')

  // O foco entra no diálogo (fica preso nele) e já mostra o indicador.
  await expect(dialog.locator(':focus')).toHaveCount(1)
  const focusedInDialog = dialog.locator(':focus')
  await expectVisibleFocus(focusedInDialog)
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press('Tab')
    await expect(dialog.locator(':focus')).toHaveCount(1)
  }

  // Esc cancela: o diálogo fecha, a carteira continua e o foco volta ao botão de remover.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(secondary).toBeVisible()
  await expectVisibleFocus(remove)

  // Abre de novo e confirma só com o teclado: Tab até "Remover" e Enter.
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await tabUntilFocused(page, dialog.getByRole('button', { name: 'Remover', exact: true }), 6)
  await page.keyboard.press('Enter')

  await expect(dialog).toBeHidden()
  await expect(secondary).toHaveCount(0)
})
