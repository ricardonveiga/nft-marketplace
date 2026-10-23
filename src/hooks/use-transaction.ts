import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { fetchTransaction } from '@/api/explorer'

/** Transação no explorador simulado. Hash desconhecido (404) não é repetido. */
export function useTransaction(hash: string) {
  return useQuery({
    queryKey: ['explorer', hash],
    queryFn: () => fetchTransaction(hash),
    retry: (failureCount, error) =>
      !(isAxiosError(error) && error.response?.status === 404) && failureCount < 1,
  })
}
