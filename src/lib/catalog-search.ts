import { isEthDecimal } from '@/lib/eth'
import type { NftNetwork } from '@/types/nft'

export const CATALOG_TABS = ['todos', 'novos', 'em-alta'] as const
export type CatalogTab = (typeof CATALOG_TABS)[number]

export const CATALOG_SORTS = [
  'recent',
  'price-asc',
  'price-desc',
  'name',
] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

export const NETWORKS: readonly NftNetwork[] = ['Ethereum', 'Polygon', 'Solana']

export const DEFAULT_TAB: CatalogTab = 'todos'
export const DEFAULT_SORT: CatalogSort = 'recent'

/** Estado do catálogo guardado na URL. Valores padrão ficam de fora da URL. */
export type CatalogSearch = {
  q?: string
  category?: string[]
  network?: NftNetwork[]
  minPrice?: string
  maxPrice?: string
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
}

function toList(value: unknown) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return [
    ...new Set(
      items
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

function toPrice(value: unknown) {
  return typeof value === 'string' && isEthDecimal(value) ? value : undefined
}

/** Valida e normaliza os search params (vindos da URL ou de uma navegação). */
export function validateCatalogSearch(
  raw: Record<string, unknown>,
): CatalogSearch {
  const result: CatalogSearch = {}

  const q = typeof raw.q === 'string' ? raw.q.trim() : ''
  if (q) {
    result.q = q
  }

  const category = toList(raw.category)
  if (category.length > 0) {
    result.category = category
  }

  const network = toList(raw.network).filter((item): item is NftNetwork =>
    NETWORKS.includes(item as NftNetwork),
  )
  if (network.length > 0) {
    result.network = network
  }

  const minPrice = toPrice(raw.minPrice)
  if (minPrice) {
    result.minPrice = minPrice
  }

  const maxPrice = toPrice(raw.maxPrice)
  if (maxPrice) {
    result.maxPrice = maxPrice
  }

  if (
    CATALOG_TABS.includes(raw.tab as CatalogTab) &&
    raw.tab !== DEFAULT_TAB
  ) {
    result.tab = raw.tab as CatalogTab
  }

  if (
    CATALOG_SORTS.includes(raw.sort as CatalogSort) &&
    raw.sort !== DEFAULT_SORT
  ) {
    result.sort = raw.sort as CatalogSort
  }

  const page = Number(raw.page)
  if (Number.isInteger(page) && page > 1) {
    result.page = page
  }

  return result
}

/**
 * Aplica uma mudança sobre a busca atual. Qualquer mudança que não seja de
 * página volta para a página 1 (exigência do CHALLENGE.md).
 */
export function buildCatalogSearch(
  current: unknown,
  patch: Partial<CatalogSearch>,
  options: { keepPage?: boolean } = {},
) {
  const base = validateCatalogSearch((current ?? {}) as Record<string, unknown>)

  return validateCatalogSearch({
    ...base,
    ...patch,
    ...(options.keepPage || 'page' in patch ? {} : { page: undefined }),
  })
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.q ||
      search.category ||
      search.network ||
      search.minPrice ||
      search.maxPrice ||
      search.tab,
  )
}
