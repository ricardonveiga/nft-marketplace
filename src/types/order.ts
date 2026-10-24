import type { Cart } from './cart'
import type { NftNetwork } from './nft'
import type { WalletType } from './wallet'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

/** Dados do colecionador no pagamento (Figma: "Perfil do colecionador"). */
export type CollectorData = {
  /** Nome de exibição. */
  name: string
  username: string
  profileName: string
  email: string
  walletType: WalletType
  /** Endereço da carteira que recebe os NFTs (0x + 40 hexadecimais). */
  walletAddress: string
  /** "ENS ou carteira secundária" (opcional). */
  secondary?: string
  referralCode: string
  /** Nome ENS completo, com o sufixo (ex.: "ana.eth"). */
  ensName: string
  notes?: string
}

export type OrderItem = {
  nftId: string
  name: string
  collection: string
  edition: string
  /** ID do token (ex.: "#0042"). */
  tokenId: string
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
  errors?: Partial<Record<keyof CollectorData | 'network', string>>
  /** Cotação atual, quando o pedido foi recusado por mudança de valores/disponibilidade. */
  cart?: Cart
  orderId?: string
}
