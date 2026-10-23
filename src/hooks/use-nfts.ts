import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchFeaturedNft, fetchHighlights, fetchNft, fetchNfts } from '@/api/nfts'
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
  })
}

/** Detalhe de um NFT. NFT inexistente (404) não é repetido: a tela mostra "não encontrado". */
export function useNft(id: string) {
  return useQuery({
    queryKey: ['nfts', 'detail', id],
    queryFn: () => fetchNft(id),
    staleTime: 30 * 1000,
  })
}

export function useHighlights() {
  return useQuery({
    queryKey: ['nfts', 'highlights'],
    queryFn: fetchHighlights,
  })
}
