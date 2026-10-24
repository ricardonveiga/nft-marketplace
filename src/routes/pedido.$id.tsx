import { useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { RequireAuth } from '@/components/auth/require-auth'
import {
  OrderCollectorSection,
  OrderItemsSection,
  OrderPaymentSection,
  OrderTransactionSection,
  OrderValuesSection,
} from '@/components/orders/order-sections'
import { ConfirmationModal } from '@/components/orders/confirmation-modal'
import { RealtimeNotices } from '@/components/realtime/realtime-notices'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CART_QUERY_KEY } from '@/hooks/use-cart'
import { useOrder } from '@/hooks/use-orders'
import { clearCheckoutState, clearIdempotencyKey } from '@/lib/checkout-draft'
import { isForbidden } from '@/lib/api-error'
import { formatDateTime } from '@/lib/format'
import type { User } from '@/types/auth'
import type { Order } from '@/types/order'

export const Route = createFileRoute('/pedido/$id')({
  component: OrderPage,
})

function OrderPage() {
  return (
    <RequireAuth>
      {(user) => (
        <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
          <OrderContent user={user} />
        </div>
      )}
    </RequireAuth>
  )
}

/** Os blocos do pedido são sempre o retrato do momento da compra; o recibo completo é o do confirmado. */
function OrderBody({ order }: { order: Order }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        <OrderItemsSection order={order} />
        <OrderTransactionSection order={order} />
      </div>
      <div className="flex flex-col gap-6">
        <OrderValuesSection order={order} />
        <OrderPaymentSection order={order} />
        <OrderCollectorSection order={order} />
      </div>
    </div>
  )
}

/** Recibo completo do pedido confirmado: vai dentro do modal, só para leitores de tela (o frame mostra o resumo). */
function ConfirmedReceipt({ order, user }: { order: Order; user: User }) {
  const firstName = user.name.split(' ')[0]

  return (
    <div data-testid="order-receipt" className="flex flex-col gap-6">
      <h1>Pedido confirmado</h1>
      <p>
        Obrigado, {firstName}! Seu pagamento foi confirmado na rede {order.network}.
      </p>
      <dl>
        <dt>Número do pedido:</dt>
        <dd data-testid="order-id">{order.id}</dd>
        <dt>Feito em:</dt>
        <dd data-testid="order-created">{formatDateTime(order.createdAt)}</dd>
        {order.settledAt && (
          <>
            <dt>Confirmado em:</dt>
            <dd data-testid="order-settled">{formatDateTime(order.settledAt)}</dd>
          </>
        )}
      </dl>
      <OrderBody order={order} />
    </div>
  )
}

function OrderContent({ user }: { user: User }) {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: order, isPending, isError, error, refetch } = useOrder(id)
  const notFound = isError && isAxiosError(error) && error.response?.status === 404
  const status = order?.status

  // Desfecho: a próxima tentativa precisa de uma chave de idempotência nova. Se confirmou,
  // o rascunho é descartado e o carrinho (esvaziado pela API) é relido para o contador do
  // header; se foi recusado, o rascunho fica para o usuário tentar de novo sem redigitar.
  useEffect(() => {
    if (status === 'confirmed') {
      clearCheckoutState()
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    } else if (status === 'declined') {
      clearIdempotencyKey()
    }
  }, [status, queryClient])

  // O título da aba acompanha o pedido.
  useEffect(() => {
    const previous = document.title

    document.title = order
      ? `Pedido ${order.id} | Kurio`
      : notFound
        ? 'Pedido não encontrado | Kurio'
        : previous

    return () => {
      document.title = previous
    }
  }, [order, notFound])

  if (isPending) {
    return (
      <div role="status" aria-label="Carregando pedido" className="flex flex-col gap-4">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div data-testid="order-not-found" className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-heading">Pedido não encontrado</h1>
        <Button asChild>
          <Link to="/">Voltar ao mercado</Link>
        </Button>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
        {isForbidden(error) ? (
          <p>Você não tem permissão para ver este pedido.</p>
        ) : (
          <>
            <p>Não foi possível carregar o pedido.</p>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="receipt flex flex-col gap-8">
      <div className="print:hidden">
        <RealtimeNotices orderId={order.id} />
      </div>

      {order.status === 'pending' && (
        <div role="status" data-testid="order-pending" className="flex flex-col gap-2">
          <h1 className="text-heading">Processando pagamento…</h1>
          <p className="text-text-secondary">
            Aguardando a confirmação da rede {order.network}. Pedido {order.id}. Não é preciso
            repetir o pagamento: esta página se atualiza sozinha.
          </p>
        </div>
      )}

      {order.status === 'confirmed' && (
        <ConfirmationModal order={order} receipt={<ConfirmedReceipt order={order} user={user} />} />
      )}

      {order.status === 'declined' && (
        <div role="alert" data-testid="order-declined" className="flex flex-col items-start gap-3">
          <h1 className="text-heading">Pagamento recusado</h1>
          <p className="text-text-secondary">
            {order.declineReason ?? 'O pagamento não foi aprovado.'} Seu carrinho foi mantido.
          </p>
          <p className="text-sm text-text-secondary">
            Pedido {order.id}
            {order.settledAt && ` · ${formatDateTime(order.settledAt)}`}
          </p>
          <Button asChild className="h-[45px] rounded-md px-6 text-base font-bold">
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
        </div>
      )}

      {order.status !== 'confirmed' && <OrderBody order={order} />}
    </div>
  )
}
