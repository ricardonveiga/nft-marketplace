import { useId } from 'react'
import type { Cart } from '@/types/cart'

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

/** Resumo do pedido ao lado do formulário de pagamento (valores calculados pela API). */
export function CheckoutSummary({ cart }: { cart: Cart }) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5 rounded-lg bg-card p-6 lg:sticky lg:top-24"
    >
      <h2 id={headingId} className="text-lg leading-4">
        Resumo do pedido
      </h2>

      <ul className="flex flex-col gap-3">
        {cart.items.map((item) => (
          <li key={item.nft.id} className="flex items-center gap-3">
            <img
              src={item.nft.imageUrl}
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1 text-sm">
              <span className="block truncate">{item.nft.name}</span>
              <span className="text-text-secondary">Quantidade: {item.quantity}</span>
            </span>
            <span className="text-sm font-bold">{item.lineTotalEth} ETH</span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-3 border-t border-border pt-4">
        <Row label="Subtotal" value={`${cart.subtotalEth} ETH`} testId="summary-subtotal" />
        {cart.coupon && (
          <Row
            label={`Desconto (${cart.coupon.code})`}
            value={`-${cart.discountEth} ETH`}
            testId="summary-discount"
          />
        )}
        <Row label="Taxa de rede" value={`${cart.networkFeeEth} ETH`} testId="summary-fee" />
        <div className="border-t border-border pt-3">
          <Row label="Total" value={`${cart.totalEth} ETH`} testId="summary-total" strong />
        </div>
      </dl>
    </section>
  )
}
