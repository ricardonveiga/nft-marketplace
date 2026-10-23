import { useIsMutating } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CartItemRow } from '@/components/cart/cart-item-row'
import { CartSkeleton } from '@/components/cart/cart-skeleton'
import { CartSummary } from '@/components/cart/cart-summary'
import { Button } from '@/components/ui/button'
import { CART_MUTATION_KEY, useCart } from '@/hooks/use-cart'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

type Feedback = { kind: 'success' | 'error'; text: string }

function CartPage() {
  const { data: cart, isPending, isError, refetch } = useCart()
  const busy = useIsMutating({ mutationKey: CART_MUTATION_KEY }) > 0
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-heading">Carrinho de NFTs</h1>
        {cart && cart.itemCount > 0 && (
          <p className="text-sm text-text-secondary">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}
          </p>
        )}
      </div>

      {/* Sucesso é anunciado só para leitores de tela; erros ficam visíveis. */}
      <p role="status" className="sr-only">
        {feedback?.kind === 'success' ? feedback.text : ''}
      </p>
      {feedback?.kind === 'error' && (
        <p role="alert" className="mb-6 rounded-md bg-card px-4 py-3 text-sm text-destructive">
          {feedback.text}
        </p>
      )}

      {isPending && <CartSkeleton />}

      {isError && (
        <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
          <p>Não foi possível carregar o carrinho.</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      )}

      {cart && cart.items.length === 0 && (
        <div
          data-testid="cart-empty"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <p className="text-text-secondary">Seu carrinho está vazio.</p>
          <Button asChild className="h-[45px] rounded-md px-6 text-base font-bold">
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="flex flex-col gap-4" aria-label="Itens do carrinho">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.nft.id}
                item={item}
                busy={busy}
                onFeedback={setFeedback}
              />
            ))}
          </ul>
          <CartSummary cart={cart} busy={busy} onFeedback={setFeedback} />
        </div>
      )}
    </div>
  )
}
