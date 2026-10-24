import { Link } from '@tanstack/react-router'
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
      <div className="flex h-10 items-center justify-between gap-3 border border-primary px-3">
        <p className="min-w-0 truncate text-xs">
          <span className="font-bold text-text-accent">{cart.coupon.code}</span>
          <span className="ml-2 text-text-secondary">{cart.coupon.description}</span>
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
          className="shrink-0 text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
        >
          Remover
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
      <div className="flex h-10 rounded-[2px] border border-primary max-lg:h-[50px] max-lg:rounded-full max-lg:border-border max-lg:bg-transparent">
        <input
          id={inputId}
          name="coupon"
          aria-label="Cupom de desconto"
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setError('')
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent px-[6px] text-xs uppercase max-lg:pl-4 max-lg:text-[13px] outline-none placeholder:text-brand-secondary placeholder:normal-case focus-visible:bg-surface-featured aria-[invalid=true]:text-destructive"
        />
        <button
          type="submit"
          disabled={busy || cart.items.length === 0}
          className="-my-px -mr-px w-[102px] shrink-0 bg-primary text-[15px] font-bold text-primary-foreground max-lg:m-0 max-lg:w-[97px] max-lg:rounded-full max-lg:bg-[linear-gradient(90deg,#7c5130,#cf884b)] max-lg:text-base max-lg:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
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

function Row({
  label,
  value,
  testId,
  small,
}: {
  label: string
  value: string
  testId: string
  small?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[15px] leading-5">
      <dt>{label}</dt>
      <dd data-testid={testId} className={small ? 'text-[15px]' : 'text-lg leading-5'}>
        {value}
      </dd>
    </div>
  )
}

/** "Resumo da carteira" (Figma): cupom, valores calculados pela API e a saída para o pagamento. */
export function CartSummary(props: CartSummaryProps) {
  const { cart } = props
  const headingId = useId()
  const blocked = cart.items.some((item) => item.status !== 'ok')
  const hasPayable = cart.items.some((item) => item.status === 'ok')

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:rounded-t-[36px] max-lg:bg-card max-lg:px-6 max-lg:pt-[29px] max-lg:pb-[37px]"
    >
      <h2 id={headingId} className="max-lg:sr-only border-b border-header-line pt-px pb-[9px] text-lg leading-5 font-bold">
        Resumo da carteira
      </h2>

      <p className="mt-[22px] text-sm leading-5 font-bold max-lg:sr-only">Código promocional</p>
      <div className="mt-[6px] max-lg:mt-0">
        <CouponBox {...props} />
      </div>

      <dl className="mt-[22px] flex flex-col gap-[13px] max-lg:mt-[10px] max-lg:gap-3">
        <Row label="Subtotal" value={`${cart.subtotalEth} ETH`} testId="summary-subtotal" />
        <Row
          label="Desconto do lançamento"
          value={`(-) ${cart.coupon ? cart.discountEth : '00.00'}`}
          testId="summary-discount"
          small
        />
        <Row label="Taxa de rede" value={`${cart.networkFeeEth} ETH`} testId="summary-fee" />
        <p className="text-right text-[11px] leading-[14px] text-text-accent max-lg:-mt-[11px]">Taxa estimada</p>
        <div className="mt-[4px] flex items-baseline max-lg:-mt-[6px] justify-between text-[15px] leading-5 font-bold">
          <dt>Total</dt>
          <dd data-testid="summary-total" className="text-lg text-text-accent">
            {cart.totalEth} ETH
          </dd>
        </div>
      </dl>

      {blocked && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Resolva os itens indisponíveis para continuar.
        </p>
      )}

      {blocked || !hasPayable ? (
        <Button type="button" disabled className="mt-[18px] h-10 w-full rounded-[3px] text-[15px] font-bold max-lg:mt-[26px] max-lg:h-[60px] max-lg:rounded-full max-lg:bg-[linear-gradient(110deg,#d28a4c,#b07440)] max-lg:text-base">
          Conectar e finalizar
        </Button>
      ) : (
        <Button asChild className="mt-[18px] h-10 w-full rounded-[3px] text-[15px] font-bold max-lg:mt-[26px] max-lg:h-[60px] max-lg:rounded-full max-lg:bg-[linear-gradient(110deg,#d28a4c,#b07440)] max-lg:text-base">
          <Link to="/pagamento">Conectar e finalizar</Link>
        </Button>
      )}
      {!hasPayable && (
        <p className="mt-2 text-xs text-text-secondary">Adicione itens disponíveis para finalizar.</p>
      )}

      <Link
        to="/"
        className="mt-[12px] self-center text-[15px] max-lg:hidden leading-5 text-text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Continuar explorando
      </Link>
    </section>
  )
}
