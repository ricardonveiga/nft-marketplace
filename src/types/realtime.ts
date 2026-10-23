import type { NftAvailability } from './nft'
import type { OrderStatus } from './order'

// Contrato dos eventos Socket.IO. Todo evento carrega:
// - eventId: identidade estável (o mesmo evento reenviado tem o mesmo id);
// - resource: o recurso afetado;
// - version: versão do recurso depois da mudança (só avança);
// - data: o estado completo dos campos afetados (e não um "diff"), para que aplicar
//   o mesmo evento duas vezes dê o mesmo resultado.

export const SOCKET_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
  subscribeOrders: 'orders.subscribe',
  unsubscribeOrders: 'orders.unsubscribe',
} as const

export type NftState = {
  priceEth: string
  previousPriceEth: string | null
  availability: NftAvailability
  availableQuantity: number
  maxQuantity: number
}

export type NftUpdatedEvent = {
  eventId: string
  type: 'nft.updated'
  resource: { type: 'nft'; id: string }
  version: number
  occurredAt: string
  data: NftState
}

export type OrderState = {
  status: OrderStatus
  settledAt: string | null
  transactionHash: string | null
  declineReason: string | null
}

export type OrderUpdatedEvent = {
  eventId: string
  type: 'order.updated'
  resource: { type: 'order'; id: string }
  version: number
  occurredAt: string
  data: OrderState
}

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
