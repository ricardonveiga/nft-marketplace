// Carrinhos do mock, um por dono (visitante ou usuário), no localStorage: sobrevivem ao
// refresh. clearMockCarts() volta ao cenário conhecido (todos os carrinhos vazios).
const PREFIX = 'mock-cart:'

export type StoredCart = {
  items: Array<{ nftId: string; quantity: number }>
  couponCode?: string
  version: number
}

export function emptyCart(): StoredCart {
  return { items: [], version: 0 }
}

export function readCart(owner: string): StoredCart {
  try {
    const raw = window.localStorage.getItem(PREFIX + owner)

    return raw ? (JSON.parse(raw) as StoredCart) : emptyCart()
  } catch {
    return emptyCart()
  }
}

export function writeCart(owner: string, cart: StoredCart) {
  const next: StoredCart = { ...cart, version: cart.version + 1 }

  try {
    window.localStorage.setItem(PREFIX + owner, JSON.stringify(next))
  } catch {
    // Sem localStorage o carrinho vale só até o próximo refresh.
  }

  return next
}

export function deleteCart(owner: string) {
  try {
    window.localStorage.removeItem(PREFIX + owner)
  } catch {
    // Nada a remover.
  }
}

export function clearMockCarts() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Nada a limpar.
  }
}
