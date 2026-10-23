import { api } from '@/lib/api'
import type { Transaction } from '@/types/explorer'

export async function fetchTransaction(hash: string) {
  const response = await api.get<{ transaction: Transaction }>(
    `/explorer/tx/${encodeURIComponent(hash)}`,
  )

  if (!response.data?.transaction?.hash) {
    throw new Error('Resposta do explorador fora do formato esperado')
  }

  return response.data.transaction
}
