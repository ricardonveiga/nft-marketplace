import type { NftNetwork } from './nft'

/** Transação no explorador de blocos simulado: só dados públicos (nada do colecionador). */
export type Transaction = {
  hash: string
  network: NftNetwork
  status: 'confirmed'
  blockNumber: number
  confirmedAt: string
  from: string
  to: string
  valueEth: string
  feeEth: string
}
