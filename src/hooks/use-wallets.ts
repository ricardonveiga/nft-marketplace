import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { connectWallet, disconnectWallet, fetchWallets } from '@/api/wallets'
import type { WalletsResponse } from '@/types/wallet'
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
