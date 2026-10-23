import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/lib/api-error'
import type { Cart } from '@/types/cart'

type CartSummaryProps = {
  cart: Cart
  busy: boolean
  onFeedback: (feedback: { kind: 'success' | 'error'; text: string }) => void
}

function CouponBox({ cart, busy, onFeedback }: CartSummaryProps) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const inputId = useId()
  const errorId = `${inputId}-error`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!code.trim()) {
      setError('Informe o código do cupom.')

      return
    }

    apply.mutate(code, {
      onSuccess: (updated) => {
        setCode('')
        onFeedback({ kind: 'success', text: `Cupom ${updated.coupon?.code} aplicado.` })
      },
      onError: (err) => setError(getApiErrorMessage(err, 'Não foi possível aplicar o cupom. Tente novamente.')),
    })
  }

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-surface-dark px-4 py-3">
        <p className="min-w-0 text-sm">
          <span className="font-bold text-text-accent">{cart.coupon.code}</span>
          <span className="block text-text-secondary">{cart.coupon.description}</span>
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => onFeedback({ kind: 'success', text: 'Cupom removido.' }),
              onError: (err) =>
                onFeedback({
                  kind: 'error',
                  text: getApiErrorMessage(err, 'Não foi possível remover o cupom. Tente novamente.'),
                }),
            })
          }
          aria-label={`Remover cupom ${cart.coupon.code}`}
          className="shrink-0 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
        >
          Remover
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
      <div className="flex h-10 rounded-md bg-surface-dark">
        <label htmlFor={inputId} className="sr-only">
          Cupom de desconto
        </label>
        <input
          id={inputId}
          name="coupon"
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setError('')
          }}
          placeholder="Código do cupom"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 rounded-l-md bg-transparent px-4 text-sm uppercase outline-none placeholder:text-brand-secondary placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive"
        />
        <button
          type="submit"
          disabled={busy || cart.items.length === 0}
          className="rounded-r-md bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

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

export function CartSummary(props: CartSummaryProps) {
  const { cart } = props
  const headingId = useId()
  const blocked = cart.items.some((item) => item.status !== 'ok')
  const hasPayable = cart.items.some((item) => item.status === 'ok')

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5 rounded-lg bg-card p-6 lg:sticky lg:top-24"
    >
      <h2 id={headingId} className="text-lg leading-4">
        Resumo do pedido
      </h2>

      <CouponBox {...props} />

      <dl className="flex flex-col gap-3">
        <Row label="Subtotal" value={`${cart.subtotalEth} ETH`} testId="summary-subtotal" />
        {cart.coupon && (
          <Row
            label={`Desconto (${cart.coupon.discountPercent}%)`}
            value={`-${cart.discountEth} ETH`}
            testId="summary-discount"
          />
        )}
        <Row label="Taxa de rede" value={`${cart.networkFeeEth} ETH`} testId="summary-fee" />
        <div className="border-t border-border pt-3">
          <Row label="Total" value={`${cart.totalEth} ETH`} testId="summary-total" strong />
        </div>
      </dl>

      {blocked && (
        <p role="alert" className="text-sm text-destructive">
          Resolva os itens indisponíveis para continuar.
        </p>
      )}

      <Button
        type="button"
        disabled
        title="O pagamento será liberado na próxima etapa"
        className="h-[45px] w-full rounded-md text-base font-bold"
      >
        Finalizar compra
      </Button>
      <p className="-mt-2 text-xs text-text-secondary">
        {hasPayable
          ? 'O pagamento será liberado na próxima etapa.'
          : 'Adicione itens disponíveis para finalizar.'}
      </p>
    </section>
  )
}
