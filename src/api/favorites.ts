import { api } from '@/lib/api'

type FavoritesResponse = { nftIds: string[] }

function assertFavorites(data: FavoritesResponse | undefined) {
  if (!Array.isArray(data?.nftIds)) {
    throw new Error('Resposta de favoritos fora do formato esperado')
  }

  return data.nftIds
}

export async function fetchFavorites() {
  const response = await api.get<FavoritesResponse>('/favorites')

  return assertFavorites(response.data)
}

export async function addFavorite(nftId: string) {
  const response = await api.put<FavoritesResponse>(`/favorites/${nftId}`)

  return assertFavorites(response.data)
}

export async function removeFavorite(nftId: string) {
  const response = await api.delete<FavoritesResponse>(`/favorites/${nftId}`)

  return assertFavorites(response.data)
}
