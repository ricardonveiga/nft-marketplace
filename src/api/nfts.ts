import { api } from '@/lib/api'
import type { Nft, NftDetail, NftListParams, NftListResponse } from '@/types/nft'

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

/** NFT em destaque da Início (e do hero): o mais caro entre os disponíveis. */
export async function fetchFeaturedNft() {
  const response = await api.get<{ nft: Nft }>('/nfts/featured')

  if (!response.data?.nft) {
    throw new Error('Resposta de /nfts/featured fora do formato esperado')
  }

  return response.data.nft
}

/** Destaques do hero: o primeiro é o mesmo NFT do card "em destaque". */
export async function fetchHighlights() {
  const response = await api.get<{ nfts: Nft[] }>('/nfts/highlights')

  if (!Array.isArray(response.data?.nfts)) {
    throw new Error('Resposta de /nfts/highlights fora do formato esperado')
  }

  return response.data.nfts
}

export async function fetchNft(id: string) {
  const response = await api.get<{ nft: NftDetail }>(`/nfts/${encodeURIComponent(id)}`)

  if (!response.data?.nft) {
    throw new Error('Resposta de /nfts/:id fora do formato esperado')
  }

  return response.data.nft
}
