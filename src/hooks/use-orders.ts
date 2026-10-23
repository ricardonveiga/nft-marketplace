import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { createOrder, fetchOrder } from '@/api/orders'
import { useSocketStatus } from '@/lib/realtime/socket'
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

/**
 * Pedido por id. O desfecho chega pelo evento `order.updated`; só quando a conexão em
 * tempo real está fora, e o pedido segue pendente, volta a reler a cada segundo.
 */
export function useOrder(id: string) {
  const { connected } = useSocketStatus()

  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
    retry: (failureCount, error) =>
      !(isAxiosError(error) && error.response?.status === 404) && failureCount < 1,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && !connected ? 1000 : false,
  })
}
