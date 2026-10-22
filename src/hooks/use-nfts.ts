import { useQuery } from '@tanstack/react-query'
import { fetchNfts } from '@/api/nfts'
import type { NftListParams } from '@/types/nft'

export function useNfts(params: NftListParams = {}) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: () => fetchNfts(params),
  })
}
