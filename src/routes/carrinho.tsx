import { useIsMutating } from '@tanstack/react-query'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { CART_COLUMNS, CartItemRow } from '@/components/cart/cart-item-row'
import { CartSkeleton } from '@/components/cart/cart-skeleton'
import { CartSummary } from '@/components/cart/cart-summary'
import { RecommendedNfts } from '@/components/cart/recommended-nfts'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RealtimeNotices } from '@/components/realtime/realtime-notices'
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
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-[1264px] px-7 pt-[32px] pb-[370px] md:px-8 md:pt-[32px] lg:pb-24">
      <Breadcrumb className="max-md:hidden"
        items={[
          { label: 'Início', to: '/' },
          { label: 'Mercado', to: '/', hash: 'mercado' },
          { label: 'Carrinho' },
        ]}
      />
      <div className="relative flex h-[35px] items-center justify-center md:block md:h-auto">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.history.back()}
          className="absolute left-0 grid size-[35px] place-items-center rounded-full bg-avatar text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <h1 className="text-xl leading-6 font-bold max-md:pl-6 max-md:text-center md:sr-only">Carrinho de NFTs</h1>
      </div>

      <RealtimeNotices nftIds={cart?.items.map((item) => item.nft.id)} className="mt-4" />

      {/* Sucesso é anunciado só para leitores de tela; erros ficam visíveis. */}
      <p role="status" className="sr-only">
        {feedback?.kind === 'success' ? feedback.text : ''}
      </p>
      {feedback?.kind === 'error' && (
        <p role="alert" className="mt-4 rounded-md bg-card px-4 py-3 text-sm text-destructive">
          {feedback.text}
        </p>
      )}

      <div className="mt-[21px] md:mt-[9px]">
        {isPending && <CartSkeleton />}

        {isError && (
          <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
            <p>Não foi possível carregar o carrinho.</p>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        )}

        {cart && cart.items.length === 0 && (
          <div data-testid="cart-empty" className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-text-secondary">Seu carrinho está vazio.</p>
            <Button asChild className="h-[45px] rounded-md px-6 text-base font-bold">
              <Link to="/">Explorar NFTs</Link>
            </Button>
          </div>
        )}

        {cart && cart.items.length > 0 && (
          <div className="grid items-start gap-10 lg:grid-cols-[782px_332px] lg:gap-x-[86px]">
            <div>
              <div
                aria-hidden="true"
                className={`hidden border-b border-header-line pb-[10px] text-base leading-5 lg:grid ${CART_COLUMNS}`}
              >
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
              </div>
              <ul className="flex flex-col gap-5 lg:mt-[12px] lg:gap-3" aria-label="Itens do carrinho">
                {cart.items.map((item) => (
                  <CartItemRow key={item.nft.id} item={item} busy={busy} onFeedback={setFeedback} />
                ))}
              </ul>
            </div>
            <CartSummary cart={cart} busy={busy} onFeedback={setFeedback} />
          </div>
        )}
      </div>

      {(isPending || (cart && cart.items.length > 0)) && <RecommendedNfts compact className="mt-[60px] lg:mt-[95px]" />}
    </div>
  )
}
