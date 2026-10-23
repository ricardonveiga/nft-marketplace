export type NftRarity = 'comum' | 'raro' | 'epico' | 'lendario'

export type NftAvailability = 'disponivel' | 'esgotado'

export type NftNetwork = 'Ethereum' | 'Polygon' | 'Solana'

export type Nft = {
  id: string
  name: string
  collection: string
  /** Categoria usada no filtro "Coleções" da Início (ex.: "Arte digital"). */
  category: string
  network: NftNetwork
  imageUrl: string
  /** Preço em ETH como string decimal (ex.: "0.85"). Nunca converter para float. */
  priceEth: string
  /** Preço anterior, quando o NFT está com desconto. Também string decimal. */
  previousPriceEth?: string
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
