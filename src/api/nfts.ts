import { api } from '@/lib/api'
import type { NftListParams, NftListResponse } from '@/types/nft'

export async function fetchNfts(params: NftListParams = {}) {
  const response = await api.get<NftListResponse>('/nfts', { params })

  if (!Array.isArray(response.data?.items)) {
    throw new Error('Resposta de /nfts fora do formato esperado')
  }

  return response.data
}
