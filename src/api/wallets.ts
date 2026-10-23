import { api } from '@/lib/api'
import type { WalletInput, WalletsResponse, WalletUpdate } from '@/types/wallet'

function assertWallets(data: WalletsResponse | undefined) {
  if (!Array.isArray(data?.wallets)) {
    throw new Error('Resposta de /wallets fora do formato esperado')
  }

  return data
}

export async function fetchWallets() {
  const response = await api.get<WalletsResponse>('/wallets')

  return assertWallets(response.data)
}

export async function createWallet(input: WalletInput) {
  const response = await api.post<WalletsResponse>('/wallets', input)

  return assertWallets(response.data)
}

export async function updateWallet(id: string, update: WalletUpdate) {
  const response = await api.patch<WalletsResponse>(`/wallets/${id}`, update)

  return assertWallets(response.data)
}

export async function deleteWallet(id: string) {
  const response = await api.delete<WalletsResponse>(`/wallets/${id}`)

  return assertWallets(response.data)
}

export async function connectWallet(walletId: string) {
  const response = await api.post<{ connectedWalletId: string }>(`/wallets/${walletId}/connect`)

  return response.data.connectedWalletId
}

export async function disconnectWallet() {
  await api.delete('/wallets/connection')
}
