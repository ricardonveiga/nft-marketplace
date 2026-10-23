import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import {
  buildCatalogSearch,
  validateCatalogSearch,
  type CatalogSearch,
} from '@/lib/catalog-search'
import type { NftListParams } from '@/types/nft'
import { useNfts } from './use-nfts'

export const CATALOG_PAGE_SIZE = 9

/** Estado do catálogo lido da URL (funciona em qualquer rota, p. ex. no header). */
export function useCatalogSearch() {
  const raw = useSearch({ strict: false }) as Record<string, unknown>
  const search = useMemo(() => validateCatalogSearch(raw), [raw])
  const navigate = useNavigate()

  const update = useCallback(
    (patch: Partial<CatalogSearch>, options?: { keepPage?: boolean }) =>
      navigate({
        to: '/',
        search: (previous: unknown) =>
          buildCatalogSearch(previous, patch, options),
      }),
    [navigate],
  )

  return { search, update }
}

export function toListParams(search: CatalogSearch): NftListParams {
  return {
    page: search.page ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
    q: search.q,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab,
    sort: search.sort,
  }
}

/** Consulta do catálogo; grade, filtros e paginação compartilham o mesmo cache. */
export function useCatalogNfts() {
  const { search } = useCatalogSearch()

  return useNfts(toListParams(search))
}
