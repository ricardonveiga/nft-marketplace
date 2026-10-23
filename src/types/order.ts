import type { Cart } from './cart'
import type { NftNetwork } from './nft'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export type CollectorData = {
  name: string
  email: string
  phone: string
  /** Campos opcionais do perfil do colecionador (vazio = não informado). */
  username?: string
  ensName?: string
  referralCode?: string
  notes?: string
}

export type OrderItem = {
  nftId: string
  name: string
  collection: string
  edition: string
  imageUrl: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

/** Pedido: um retrato (snapshot) do que foi comprado; mudanças posteriores no catálogo não o alteram. */
export type Order = {
  id: string
  status: OrderStatus
  /** Versão do pedido: 1 ao criar, avança quando o pagamento é decidido. */
  version: number
  createdAt: string
  /** Quando o pagamento foi decidido (confirmado ou recusado); null enquanto pendente. */
  settledAt: string | null
  items: OrderItem[]
  couponCode: string | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  collector: CollectorData
  wallet: { id: string; label: string; address: string }
  network: NftNetwork
  /** Referência da transação (simulada), só em pedidos confirmados. */
  transactionHash: string | null
  declineReason: string | null
}

export type CreateOrderRequest = {
  collector: CollectorData
  walletId: string
  network: NftNetwork
  /** Cotação que o usuário revisou; a API recusa se ela mudou. */
  quote: { version: number; totalEth: string }
}

export type OrderErrorBody = {
  code: string
  message?: string
  errors?: Partial<
    Record<'name' | 'email' | 'phone' | 'username' | 'ensName' | 'referralCode' | 'notes' | 'network', string>
  >
  /** Cotação atual, quando o pedido foi recusado por mudança de valores/disponibilidade. */
  cart?: Cart
  orderId?: string
}
