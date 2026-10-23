import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, fetchFavorites, removeFavorite } from '@/api/favorites'
import { useSession } from './use-session'

export const FAVORITES_QUERY_KEY = ['favorites'] as const

/** Ids favoritados do usuário autenticado (visitantes não têm favoritos). */
export function useFavorites() {
  const { data: user } = useSession()

  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: fetchFavorites,
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  })
}

type ToggleVariables = { nftId: string; favorite: boolean }

/**
 * Favoritar/desfavoritar com atualização otimista: o coração muda na hora e, se a
 * API falhar, o estado anterior é restaurado e o estado real é relido do servidor.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['favorites', 'mutation'],
    mutationFn: ({ nftId, favorite }: ToggleVariables) =>
      favorite ? addFavorite(nftId) : removeFavorite(nftId),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY })
      const previous = queryClient.getQueryData<string[]>(FAVORITES_QUERY_KEY)

      queryClient.setQueryData<string[]>(FAVORITES_QUERY_KEY, (current = []) =>
        favorite
          ? [...new Set([...current, nftId])]
          : current.filter((id) => id !== nftId),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(FAVORITES_QUERY_KEY, context?.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
  })
}
