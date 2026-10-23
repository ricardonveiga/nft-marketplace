import { HttpResponse, http } from 'msw'
import {
  DEFAULT_SORT,
  DEFAULT_TAB,
  validateCatalogSearch,
  type CatalogSort,
  type CatalogTab,
} from '@/lib/catalog-search'
import { compareEth } from '@/lib/eth'
import type { Nft, NftFacets, NftListResponse } from '@/types/nft'
import {
  REFERENCE_DATE,
  categoryOrder,
  networkOrder,
  nfts,
} from './fixtures/nfts'
import { getScenario } from './scenario'

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50
const NEW_RELEASE_DAYS = 30
const TRENDING_MIN_POPULARITY = 70

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

type Filters = {
  q?: string
  category?: string[]
  network?: string[]
  minPrice?: string
  maxPrice?: string
  tab: CatalogTab
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function matches(nft: Nft, filters: Filters, skip?: 'category' | 'network') {
  if (filters.q) {
    const haystack = normalize(`${nft.name} ${nft.collection}`)

    if (!haystack.includes(normalize(filters.q))) {
      return false
    }
  }

  if (skip !== 'category' && filters.category && !filters.category.includes(nft.category)) {
    return false
  }

  if (skip !== 'network' && filters.network && !filters.network.includes(nft.network)) {
    return false
  }

  if (filters.minPrice && compareEth(nft.priceEth, filters.minPrice) < 0) {
    return false
  }

  if (filters.maxPrice && compareEth(nft.priceEth, filters.maxPrice) > 0) {
    return false
  }

  if (filters.tab === 'novos') {
    const age = REFERENCE_DATE - Date.parse(nft.listedAt)

    if (age > NEW_RELEASE_DAYS * 24 * 60 * 60 * 1000) {
      return false
    }
  }

  if (filters.tab === 'em-alta' && nft.popularity < TRENDING_MIN_POPULARITY) {
    return false
  }

  return true
}

function sortNfts(items: Nft[], sort: CatalogSort) {
  const sorted = [...items]

  sorted.sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return compareEth(a.priceEth, b.priceEth) || a.id.localeCompare(b.id)
      case 'price-desc':
        return compareEth(b.priceEth, a.priceEth) || a.id.localeCompare(b.id)
      case 'name':
        return a.name.localeCompare(b.name, 'pt-BR') || a.id.localeCompare(b.id)
      default:
        return Date.parse(b.listedAt) - Date.parse(a.listedAt)
    }
  })

  return sorted
}

function buildFacets(source: readonly Nft[], filters: Filters): NftFacets {
  // Cada contagem ignora o próprio filtro, para mostrar quanto cada opção adicionaria.
  const forCategories = source.filter((nft) => matches(nft, filters, 'category'))
  const forNetworks = source.filter((nft) => matches(nft, filters, 'network'))

  let min = '0.00'
  let max = '0.00'

  for (const [index, nft] of source.entries()) {
    if (index === 0 || compareEth(nft.priceEth, min) < 0) {
      min = nft.priceEth
    }

    if (index === 0 || compareEth(nft.priceEth, max) > 0) {
      max = nft.priceEth
    }
  }

  return {
    categories: categoryOrder.map((name) => ({
      name,
      count: forCategories.filter((nft) => nft.category === name).length,
    })),
    networks: networkOrder.map((name) => ({
      name,
      count: forNetworks.filter((nft) => nft.network === name).length,
    })),
    price: { min, max },
  }
}

/**
 * Critério de "destaque" (card da barra lateral e hero): o NFT mais caro entre os
 * disponíveis. Esgotados ficam de fora para o destaque sempre poder ser comprado.
 */
function pickFeatured(source: readonly Nft[]) {
  return source
    .filter((nft) => nft.availability === 'disponivel')
    .reduce<Nft | undefined>(
      (best, nft) => (!best || compareEth(nft.priceEth, best.priceEth) > 0 ? nft : best),
      undefined,
    )
}

export const nftsHandlers = [
  http.get('/api/nfts/featured', () => {
    const scenario = getScenario()

    if (scenario === 'error') {
      return HttpResponse.json({ message: 'Serviço indisponível' }, { status: 503 })
    }

    const featured = pickFeatured(scenario === 'empty' ? [] : nfts)

    return featured
      ? HttpResponse.json({ nft: featured })
      : HttpResponse.json({ code: 'not_found' }, { status: 404 })
  }),

  http.get('/api/nfts', ({ request }) => {
    const scenario = getScenario()

    if (scenario === 'error') {
      return HttpResponse.json(
        { message: 'Serviço indisponível' },
        { status: 503 },
      )
    }

    const params = new URL(request.url).searchParams
    const page = parsePositiveInt(params.get('page'), 1)
    const pageSize = Math.min(
      parsePositiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    )

    const search = validateCatalogSearch(Object.fromEntries(params))
    const filters: Filters = {
      q: search.q,
      category: search.category,
      network: search.network,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      tab: search.tab ?? DEFAULT_TAB,
    }

    const source = scenario === 'empty' ? [] : nfts
    const filtered = sortNfts(
      source.filter((nft) => matches(nft, filters)),
      search.sort ?? DEFAULT_SORT,
    )
    const start = (page - 1) * pageSize

    const body: NftListResponse = {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
      facets: buildFacets(source, filters),
    }

    return HttpResponse.json(body)
  }),
]
