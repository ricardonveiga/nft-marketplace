import type { Nft } from './nft'

export type CartItemStatus = 'ok' | 'sold_out' | 'insufficient_stock'

export type CartItem = {
  nft: Nft
  quantity: number
  /** Máximo que ainda pode ser pedido (menor entre o limite por pedido e o estoque da edição). */
  maxQuantity: number
  unitPriceEth: string
  lineTotalEth: string
  status: CartItemStatus
}

export type CartCoupon = {
  code: string
  description: string
  discountPercent: number
}

/**
 * Cotação do carrinho. Todos os valores em ETH vêm calculados pela API (strings
 * decimais): a interface só os exibe, nunca recalcula.
 */
export type Cart = {
  items: CartItem[]
  /** Soma das quantidades (o contador do header). */
  itemCount: number
  coupon: CartCoupon | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  /** Aumenta a cada alteração; permite ignorar respostas e eventos antigos. */
  version: number
}

export type AddCartItemRequest = {
  nftId: string
  quantity?: number
}
