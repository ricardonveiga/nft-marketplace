import { useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { RequireAuth } from '@/components/auth/require-auth'
import { RealtimeNotices } from '@/components/realtime/realtime-notices'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CART_QUERY_KEY } from '@/hooks/use-cart'
import { useOrder } from '@/hooks/use-orders'
import { shortAddress } from '@/lib/address'
import { clearCheckoutState, clearIdempotencyKey } from '@/lib/checkout-draft'
import type { Order } from '@/types/order'

export const Route = createFileRoute('/pedido/$id')({
  component: OrderPage,
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})

function Row({ label, value, testId, strong }: { label: string; value: string; testId: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? 'text-lg font-bold' : 'text-sm'}`}>
      <dt className={strong ? undefined : 'text-text-secondary'}>{label}</dt>
      <dd data-testid={testId} className={strong ? 'text-text-accent' : undefined}>
        {value}
      </dd>
    </div>
  )
}

// Confirmação provisória: dados essenciais do pedido. A versão completa (recibo, links
// de exploração, eventos em tempo real) vem na próxima etapa.
function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <section aria-labelledby="itens" className="flex flex-col gap-4 rounded-lg bg-card p-6">
        <h2 id="itens" className="text-lg leading-4">
          Itens
        </h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.nftId} data-testid="order-item" className="flex items-center gap-3">
              <img src={item.imageUrl} alt="" width={56} height={56} className="size-14 rounded-lg object-cover" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate">{item.name}</span>
                <span className="text-text-secondary">
                  Edição {item.edition} · Quantidade: {item.quantity}
                </span>
              </span>
              <span className="text-sm font-bold">{item.lineTotalEth} ETH</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="valores" className="flex flex-col gap-5 rounded-lg bg-card p-6">
        <h2 id="valores" className="text-lg leading-4">
          Valores
        </h2>
        <dl className="flex flex-col gap-3">
          <Row label="Subtotal" value={`${order.subtotalEth} ETH`} testId="order-subtotal" />
          {order.couponCode && (
            <Row label={`Desconto (${order.couponCode})`} value={`-${order.discountEth} ETH`} testId="order-discount" />
          )}
          <Row label="Taxa de rede" value={`${order.networkFeeEth} ETH`} testId="order-fee" />
          <div className="border-t border-border pt-3">
            <Row label="Total" value={`${order.totalEth} ETH`} testId="order-total" strong />
          </div>
        </dl>
        <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Carteira</dt>
            <dd title={order.wallet.address}>
              {order.wallet.label} · {shortAddress(order.wallet.address)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Rede</dt>
            <dd>{order.network}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Colecionador</dt>
            <dd>{order.collector.name}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function OrderPage() {
  return (
    <RequireAuth>
      {() => (
        <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
          <OrderContent />
        </div>
      )}
    </RequireAuth>
  )
}

function OrderContent() {
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

  if (isPending) {
    return (
      <div role="status" aria-label="Carregando pedido" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
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
        <p>Não foi possível carregar o pedido.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <RealtimeNotices orderId={order.id} />

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
        <div data-testid="order-confirmed" className="flex flex-col gap-2">
          <h1 className="text-heading">Pedido confirmado</h1>
          <p className="text-text-secondary">
            Pedido <span data-testid="order-id" className="text-foreground">{order.id}</span> ·{' '}
            {dateFormatter.format(new Date(order.createdAt))}
          </p>
          <p className="text-sm text-text-secondary">
            Transação (simulada):{' '}
            <span data-testid="order-transaction" title={order.transactionHash ?? undefined}>
              {order.transactionHash ? shortAddress(order.transactionHash) : ''}
            </span>
          </p>
        </div>
      )}

      {order.status === 'declined' && (
        <div role="alert" data-testid="order-declined" className="flex flex-col items-start gap-3">
          <h1 className="text-heading">Pagamento recusado</h1>
          <p className="text-text-secondary">
            {order.declineReason ?? 'O pagamento não foi aprovado.'} Seu carrinho foi mantido.
          </p>
          <Button asChild className="h-[45px] rounded-md px-6 text-base font-bold">
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
        </div>
      )}

      <OrderDetails order={order} />
    </div>
  )
}
