import type { CatalogSort, CatalogTab } from '@/lib/catalog-search'

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
  /** Data de listagem (ISO 8601). Alimenta a aba "Novos lançamentos" e a ordenação. */
  listedAt: string
  /** Pontuação de 0 a 100. Alimenta a aba "Em alta". */
  popularity: number
}

export type NftFacetOption = {
  name: string
  count: number
}

/** Contagens por filtro, calculadas pela API sobre os demais filtros ativos. */
export type NftFacets = {
  categories: NftFacetOption[]
  networks: NftFacetOption[]
  /** Faixa de preço de todo o catálogo, em ETH (string decimal). */
  price: { min: string; max: string }
}

export type NftListResponse = {
  items: Nft[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: NftFacets
}

export type NftListParams = {
  page?: number
  pageSize?: number
  q?: string
  category?: string[]
  network?: NftNetwork[]
  minPrice?: string
  maxPrice?: string
  tab?: CatalogTab
  sort?: CatalogSort
}
