import type { NftNetwork } from './nft'

/** Tipo de carteira (Figma: "Tipo de carteira"). */
export const WALLET_TYPES = ['MetaMask', 'WalletConnect', 'Coinbase Wallet'] as const
export type WalletType = (typeof WALLET_TYPES)[number]

/** Sufixos de nome ENS aceitos (Figma: seletor ".eth"). */
export const ENS_SUFFIXES = ['.eth'] as const

/** Dados do perfil do colecionador guardados com a carteira (Figma: formulário de Carteiras). */
export type WalletProfile = {
  /** "Nome de exibição". */
  displayName: string
  profileName: string
  /** ENS ou carteira secundária (opcional); vazio = não informado. */
  secondary: string
  walletType: WalletType
  referralCode: string
  email: string
  /** Nome ENS completo, com o sufixo (ex.: "ana.eth"). */
  ensName: string
}

export type Wallet = WalletProfile & {
  id: string
  /** "Apelido da carteira": como ela aparece no pagamento. */
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

export type WalletInput = WalletProfile & {
  label: string
  address: string
  /** A primeira rede é a escolhida no formulário; as demais (se houver) são preservadas. */
  networks: NftNetwork[]
}

/** Alterações parciais; `isPrimary: true` troca qual é a principal. */
export type WalletUpdate = Partial<WalletInput> & { isPrimary?: boolean }
