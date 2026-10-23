import { api } from '@/lib/api'
import type { CreateOrderRequest, Order } from '@/types/order'

function assertOrder(data: { order: Order } | undefined) {
  if (!data?.order?.id) {
    throw new Error('Resposta de pedidos fora do formato esperado')
  }

  return data.order
}

/** A chave de idempotência garante que reenviar o mesmo pedido nunca cria outro. */
export async function createOrder(request: CreateOrderRequest, idempotencyKey: string) {
  const response = await api.post<{ order: Order }>('/orders', request, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })

  return assertOrder(response.data)
}

export async function fetchOrder(id: string) {
  const response = await api.get<{ order: Order }>(`/orders/${encodeURIComponent(id)}`)

  return assertOrder(response.data)
}
