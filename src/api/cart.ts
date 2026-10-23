import { api } from '@/lib/api'
import type { AddCartItemRequest, Cart } from '@/types/cart'

function assertCart(data: Cart | undefined) {
  if (!data || !Array.isArray(data.items) || typeof data.totalEth !== 'string') {
    throw new Error('Resposta do carrinho fora do formato esperado')
  }

  return data
}

export async function fetchCart() {
  const response = await api.get<Cart>('/cart')

  return assertCart(response.data)
}

export async function addCartItem(request: AddCartItemRequest) {
  const response = await api.post<Cart>('/cart/items', request)

  return assertCart(response.data)
}

export async function setCartItemQuantity(nftId: string, quantity: number) {
  const response = await api.patch<Cart>(`/cart/items/${nftId}`, { quantity })

  return assertCart(response.data)
}

export async function removeCartItem(nftId: string) {
  const response = await api.delete<Cart>(`/cart/items/${nftId}`)

  return assertCart(response.data)
}

export async function applyCoupon(code: string) {
  const response = await api.post<Cart>('/cart/coupon', { code })

  return assertCart(response.data)
}

export async function removeCoupon() {
  const response = await api.delete<Cart>('/cart/coupon')

  return assertCart(response.data)
}

/** Passa os itens do carrinho de visitante para o da conta recém-autenticada. */
export async function mergeGuestCart() {
  const response = await api.post<Cart>('/cart/merge')

  return assertCart(response.data)
}
