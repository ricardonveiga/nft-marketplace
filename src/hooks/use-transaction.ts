import { useQuery } from '@tanstack/react-query'
import { fetchTransaction } from '@/api/explorer'

/** Transação no explorador simulado. Hash desconhecido (404) não é repetido. */
export function useTransaction(hash: string) {
  return useQuery({
    queryKey: ['explorer', hash],
    queryFn: () => fetchTransaction(hash),
  })
}
