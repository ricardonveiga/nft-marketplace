import type { NftNetwork } from './nft'

export type Wallet = {
  id: string
  label: string
  /** Endereço completo (0x + 40 hex). Para exibir, use shortAddress(). */
  address: string
  /** Redes em que a carteira pode pagar. */
  networks: NftNetwork[]
  isPrimary: boolean
}

export type WalletsResponse = {
  wallets: Wallet[]
  /** Carteira conectada no momento (simulação), se houver. */
  connectedWalletId: string | null
}
