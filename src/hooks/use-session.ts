import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { fetchSession, login, logout, register } from '@/api/auth'
import { mergeGuestCart } from '@/api/cart'
import { clearSessionToken, setSessionToken } from '@/lib/session-token'
import type { LoginResponse } from '@/types/auth'

export const SESSION_QUERY_KEY = ['session'] as const

// Dados públicos que sobrevivem à troca de usuário; todo o resto é privado.
// A sessão fica de fora porque é atualizada com setQueryData: remover uma query
// com observadores ativos deixaria a interface presa à versão antiga.
const PRESERVED_QUERY_KEYS = new Set(['nfts', SESSION_QUERY_KEY[0]])

/**
 * Zera o cache do usuário anterior (carrinho, favoritos...). `resetQueries` limpa os
 * dados e refaz sozinho as consultas em uso (como o contador do carrinho), agora com
 * a identidade nova; `removeQueries` deixaria a interface presa à versão antiga.
 */
export function clearPrivateData(queryClient: QueryClient) {
  return queryClient.resetQueries({
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

/** Abre a sessão (login ou cadastro): nada do usuário anterior pode vazar para a nova. */
function useStartSession() {
  const queryClient = useQueryClient()

  return async ({ user, token }: LoginResponse) => {
    setSessionToken(token)
    queryClient.setQueryData(SESSION_QUERY_KEY, user)

    // Os itens do visitante passam para a conta antes de o carrinho ser relido.
    try {
      await mergeGuestCart()
    } catch {
      // Sem a mesclagem o carrinho da conta continua valendo; nada a desfazer.
    }

    await clearPrivateData(queryClient)
  }
}

export function useLogin() {
  const startSession = useStartSession()

  return useMutation({ mutationFn: login, onSuccess: startSession })
}

export function useRegister() {
  const startSession = useStartSession()

  return useMutation({ mutationFn: register, onSuccess: startSession })
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
