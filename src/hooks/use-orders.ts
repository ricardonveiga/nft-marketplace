import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { createOrder, fetchOrder } from '@/api/orders'
import type { CreateOrderRequest } from '@/types/order'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['orders', 'create'],
    mutationFn: ({ request, key }: { request: CreateOrderRequest; key: string }) =>
      createOrder(request, key),
    onSuccess: (order) => queryClient.setQueryData(['orders', order.id], order),
  })
}

/** Pedido por id. Enquanto está pendente, relê a cada segundo até ser decidido. */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
    retry: (failureCount, error) =>
      !(isAxiosError(error) && error.response?.status === 404) && failureCount < 1,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1000 : false),
  })
}
