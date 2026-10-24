import type { NftNetwork } from './nft'

/** Tipo de carteira (Figma: "Tipo de carteira"). */
export const WALLET_TYPES = ['MetaMask', 'WalletConnect', 'Coinbase Wallet'] as const
export type WalletType = (typeof WALLET_TYPES)[number]

/** Sufixos de nome ENS aceitos (Figma: seletor ".eth"). */
export const ENS_SUFFIXES = ['.eth'] as const

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

export type WalletInput = {
  label: string
  address: string
  networks: NftNetwork[]
}

/** Alterações parciais; `isPrimary: true` troca qual é a principal. */
export type WalletUpdate = Partial<WalletInput> & { isPrimary?: boolean }
