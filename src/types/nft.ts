export type NftRarity = 'comum' | 'raro' | 'epico' | 'lendario'

export type NftAvailability = 'disponivel' | 'esgotado'

export type Nft = {
  id: string
  name: string
  collection: string
  imageUrl: string
  /** Preço em ETH como string decimal (ex.: "0.85"). Nunca converter para float. */
  priceEth: string
  /** Edição no formato "atual/total" (ex.: "1/50"). */
  edition: string
  rarity: NftRarity
  availability: NftAvailability
}

export type NftListResponse = {
  items: Nft[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type NftListParams = {
  page?: number
  pageSize?: number
}
