import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchFeaturedNft, fetchNfts } from '@/api/nfts'
import type { NftListParams } from '@/types/nft'

export function useNfts(params: NftListParams = {}) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: () => fetchNfts(params),
    // Mantém a lista anterior na tela enquanto uma nova página/filtro carrega.
    placeholderData: keepPreviousData,
  })
}

export function useFeaturedNft() {
  return useQuery({
    queryKey: ['nfts', 'featured'],
    queryFn: fetchFeaturedNft,
    retry: false,
  })
}
