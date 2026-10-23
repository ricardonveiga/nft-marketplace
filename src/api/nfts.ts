import { api } from '@/lib/api'
import type { NftListParams, NftListResponse } from '@/types/nft'

export async function fetchNfts({
  category,
  network,
  ...params
}: NftListParams = {}) {
  const response = await api.get<NftListResponse>('/nfts', {
    params: {
      ...params,
      category: category?.join(','),
      network: network?.join(','),
    },
  })

  if (!Array.isArray(response.data?.items) || !response.data.facets) {
    throw new Error('Resposta de /nfts fora do formato esperado')
  }

  return response.data
}
