import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { fetchSession, login, logout } from '@/api/auth'
import { clearSessionToken, setSessionToken } from '@/lib/session-token'

export const SESSION_QUERY_KEY = ['session'] as const

// Dados públicos que sobrevivem à troca de usuário; todo o resto é privado.
// A sessão fica de fora porque é atualizada com setQueryData: remover uma query
// com observadores ativos deixaria a interface presa à versão antiga.
const PRESERVED_QUERY_KEYS = new Set(['nfts', SESSION_QUERY_KEY[0]])

/** Remove do cache tudo o que pertence ao usuário anterior (carrinho, favoritos...). */
export function clearPrivateData(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => !PRESERVED_QUERY_KEYS.has(String(query.queryKey[0])),
  })
}

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: ({ user, token }) => {
      // Troca de usuário: nada do anterior pode vazar para a nova sessão.
      clearPrivateData(queryClient)
      setSessionToken(token)
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Mesmo que a API falhe, o dispositivo deixa de ter a sessão.
      clearSessionToken()
      clearPrivateData(queryClient)
      queryClient.setQueryData(SESSION_QUERY_KEY, null)
    },
  })
}
