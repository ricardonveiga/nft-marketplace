const STORAGE_KEY = 'kurio.guest-cart'

/**
 * Identificador do carrinho de visitante. Enquanto não há login, é ele que a API
 * usa para guardar o carrinho; ao entrar, os itens são mesclados na conta.
 */
export function getGuestCartId() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)

    if (existing) {
      return existing
    }

    const created = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, created)

    return created
  } catch {
    return 'guest'
  }
}
