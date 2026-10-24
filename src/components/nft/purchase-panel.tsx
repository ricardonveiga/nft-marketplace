import { Link } from '@tanstack/react-router'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAddToCart, useCart } from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/lib/api-error'
import type { NftDetail } from '@/types/nft'

type Feedback = { kind: 'success' | 'error'; text: string }

const stepperButtonClass =
  'grid h-12 w-[33px] place-items-center rounded-full bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

const barStepperClass =
  'grid h-[30px] w-5 place-items-center rounded-full bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

function units(count: number) {
  return `${count} ${count === 1 ? 'unidade' : 'unidades'}`
}

/**
 * Quantidade + COMPRAR + Favoritar. O limite considera o estoque da edição, o máximo por pedido e o
 * que o usuário já tem no carrinho; a API continua sendo quem decide (erros são exibidos).
 * COMPRAR coloca o NFT no carrinho e oferece o caminho para ele.
 */
export function PurchasePanel({
  nft,
  favorite,
  variant = 'panel',
}: {
  nft: NftDetail
  favorite: ReactNode
  /** `bar`: barra fixa do mobile (Figma): quantidade, valor, "Comprar NFT" e o atalho do carrinho. */
  variant?: 'panel' | 'bar'
}) {
  const add = useAddToCart()
  const cart = useCart()
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const soldOut = nft.availability === 'esgotado' || nft.maxQuantity === 0
  const inCart = cart.data?.items.find((item) => item.nft.id === nft.id)?.quantity ?? 0
  const remaining = Math.max(nft.maxQuantity - inCart, 0)
  const selected = Math.min(quantity, Math.max(remaining, 1))

  if (soldOut) {
    return (
      <div className="flex flex-col gap-4">
        <div role="status" className="rounded-lg bg-card p-4">
          <p className="font-bold">Esta edição está esgotada.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Não há unidades disponíveis para compra.{' '}
            <Link to="/" className="underline underline-offset-4">
              Ver outros NFTs
            </Link>
          </p>
        </div>
        <div className="flex justify-end">{favorite}</div>
      </div>
    )
  }

  function buy() {
    setFeedback(null)
    add.mutate(
      { nftId: nft.id, quantity: selected },
      {
        onSuccess: () => {
          setQuantity(1)
          setFeedback({ kind: 'success', text: 'Adicionado ao carrinho.' })
        },
        onError: (error) =>
          setFeedback({
            kind: 'error',
            text: getApiErrorMessage(error, 'Não foi possível adicionar ao carrinho. Tente novamente.'),
          }),
      },
    )
  }

  const atLimit = remaining === 0
  const showHint = atLimit || selected >= remaining
  const hint = atLimit
    ? `Você já tem o máximo permitido (${units(nft.maxQuantity)}) deste NFT no carrinho.`
    : selected >= remaining
      ? `Máximo de ${units(nft.maxQuantity)} por pedido.${inCart > 0 ? ` Você já tem ${inCart} no carrinho.` : ''}`
      : `Até ${units(nft.maxQuantity)} por pedido.`

  if (variant === 'bar') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[36px] bg-card px-6 pt-[30px] pb-[34px] shadow-[0_-10px_30px_rgba(10,6,4,0.45)]">
        <p
          role="status"
          className={`absolute -top-9 right-6 left-6 rounded-full bg-card px-4 py-1.5 text-center text-sm shadow-[0_0_20px_rgba(10,6,4,0.6)] empty:hidden ${feedback?.kind === 'error' ? 'text-destructive' : 'text-text-accent'}`}
        >
          {feedback?.text}
          {feedback?.kind === 'success' && (
            <>
              {' '}
              <Link to="/carrinho" className="underline underline-offset-4">
                Ver carrinho
              </Link>
            </>
          )}
        </p>

        <div className="flex items-center justify-between">
          <div role="group" aria-label="Quantidade" className="flex items-center">
            <span className="mr-[9px] text-[15px] text-text-secondary">Qtd.</span>
            {!atLimit && (
              <>
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={selected <= 1}
                  onClick={() => setQuantity(selected - 1)}
                  className={barStepperClass}
                >
                  <Minus className="size-3" strokeWidth={3} aria-hidden="true" />
                </button>
                <output aria-label={`Quantidade: ${selected}`} className="mx-[13px] min-w-[6px] text-center text-base">
                  {selected}
                </output>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={selected >= remaining}
                  onClick={() => setQuantity(selected + 1)}
                  className={barStepperClass}
                >
                  <Plus className="size-3" strokeWidth={3} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          <p className="text-xl leading-7 font-bold text-text-accent">
            <span data-testid="detail-price">{nft.priceEth} ETH</span>
            {nft.previousPriceEth && (
              <span className="sr-only">
                Preço anterior: {nft.previousPriceEth} ETH
              </span>
            )}
          </p>
        </div>

        <p data-testid="quantity-hint" className={showHint ? 'mt-2 text-sm text-text-secondary' : 'sr-only'}>
          {hint}
        </p>

        <div className="mt-5 flex items-center gap-[13px]">
          <button
            type="button"
            onClick={buy}
            disabled={add.isPending || atLimit}
            aria-busy={add.isPending}
            className="h-[60px] w-[196px] rounded-full bg-[linear-gradient(110deg,#d28a4c,#b07440)] text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {add.isPending ? 'Adicionando…' : 'Comprar NFT'}
          </button>
          <Link
            to="/carrinho"
            aria-label="Ir para o carrinho"
            className="grid size-[60px] place-items-center rounded-full border border-border bg-avatar text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ShoppingCart className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {!atLimit ? (
          <div role="group" aria-label="Quantidade" className="flex items-center gap-[14px]">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={selected <= 1}
              onClick={() => setQuantity(selected - 1)}
              className={stepperButtonClass}
            >
              <Minus className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            </button>
            <output aria-label={`Quantidade: ${selected}`} className="min-w-3 text-center text-base">
              {selected}
            </output>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={selected >= remaining}
              onClick={() => setQuantity(selected + 1)}
              className={stepperButtonClass}
            >
              <Plus className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={buy}
            disabled={add.isPending || atLimit}
            aria-busy={add.isPending}
            className="h-10 w-[129px] rounded-[3px] bg-primary text-sm font-bold text-primary-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {add.isPending ? 'Adicionando…' : 'Comprar'}
          </button>
          {favorite}
        </div>
      </div>

      <p data-testid="quantity-hint" className={showHint ? 'text-sm text-text-secondary' : 'sr-only'}>
        {hint}
      </p>

      <p role="status" className={`text-sm empty:hidden ${feedback?.kind === 'error' ? 'text-destructive' : 'text-text-accent'}`}>
        {feedback?.text}
        {feedback?.kind === 'success' && (
          <>
            {' '}
            <Link to="/carrinho" className="underline underline-offset-4">
              Ver carrinho
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
