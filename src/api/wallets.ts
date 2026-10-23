import { api } from '@/lib/api'
import type { WalletsResponse } from '@/types/wallet'

export async function fetchWallets() {
  const response = await api.get<WalletsResponse>('/wallets')

  if (!Array.isArray(response.data?.wallets)) {
    throw new Error('Resposta de /wallets fora do formato esperado')
  }

  return response.data
}

export async function connectWallet(walletId: string) {
  const response = await api.post<{ connectedWalletId: string }>(`/wallets/${walletId}/connect`)

  return response.data.connectedWalletId
}

export async function disconnectWallet() {
  await api.delete('/wallets/connection')
}
