import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  connectWallet,
  createWallet,
  deleteWallet,
  disconnectWallet,
  fetchWallets,
  updateWallet,
} from '@/api/wallets'
import type { WalletUpdate, WalletsResponse } from '@/types/wallet'
import { useSession } from './use-session'

export const WALLETS_QUERY_KEY = ['wallets'] as const

export function useWallets() {
  const { data: user } = useSession()

  return useQuery({
    queryKey: WALLETS_QUERY_KEY,
    queryFn: fetchWallets,
    enabled: Boolean(user),
    staleTime: 30 * 1000,
    retry: 1,
  })
}

function useSetConnection() {
  const queryClient = useQueryClient()

  return (connectedWalletId: string | null) =>
    queryClient.setQueryData<WalletsResponse>(WALLETS_QUERY_KEY, (current) =>
      current ? { ...current, connectedWalletId } : current,
    )
}

export function useConnectWallet() {
  const setConnection = useSetConnection()

  return useMutation({
    mutationKey: ['wallets', 'mutation'],
    mutationFn: connectWallet,
    onSuccess: (connectedWalletId) => setConnection(connectedWalletId),
  })
}

export function useDisconnectWallet() {
  const setConnection = useSetConnection()

  return useMutation({
    mutationKey: ['wallets', 'mutation'],
    mutationFn: disconnectWallet,
    onSuccess: () => setConnection(null),
  })
}

/** As mutações de cadastro devolvem a lista completa, que passa a ser a do cache. */
function useWalletsMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<WalletsResponse>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['wallets', 'mutation'],
    mutationFn,
    onSuccess: (response) => queryClient.setQueryData(WALLETS_QUERY_KEY, response),
  })
}

export function useCreateWallet() {
  return useWalletsMutation(createWallet)
}

export function useUpdateWallet() {
  return useWalletsMutation(({ id, update }: { id: string; update: WalletUpdate }) =>
    updateWallet(id, update),
  )
}

export function useDeleteWallet() {
  return useWalletsMutation(deleteWallet)
}
