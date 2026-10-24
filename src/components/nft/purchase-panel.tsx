import { Link } from '@tanstack/react-router'
import { Minus, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAddToCart, useCart } from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/lib/api-error'
import type { NftDetail } from '@/types/nft'

type Feedback = { kind: 'success' | 'error'; text: string }

const stepperButtonClass =
  'grid h-12 w-[33px] place-items-center rounded-full bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

function units(count: number) {
  return `${count} ${count === 1 ? 'unidade' : 'unidades'}`
}

/**
 * Quantidade + COMPRAR + Favoritar. O limite considera o estoque da edição, o máximo por pedido e o
 * que o usuário já tem no carrinho; a API continua sendo quem decide (erros são exibidos).
 * COMPRAR coloca o NFT no carrinho e oferece o caminho para ele.
 */
export function PurchasePanel({ nft, favorite }: { nft: NftDetail; favorite: ReactNode }) {
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

      <p
        data-testid="quantity-hint"
        className={showHint ? 'text-sm text-text-secondary' : 'sr-only'}
      >
        {atLimit
          ? `Você já tem o máximo permitido (${units(nft.maxQuantity)}) deste NFT no carrinho.`
          : selected >= remaining
            ? `Máximo de ${units(nft.maxQuantity)} por pedido.${inCart > 0 ? ` Você já tem ${inCart} no carrinho.` : ''}`
            : `Até ${units(nft.maxQuantity)} por pedido.`}
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
