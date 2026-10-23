import { Link, useNavigate } from '@tanstack/react-router'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAddToCart, useCart } from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/lib/api-error'
import type { NftDetail } from '@/types/nft'

type Feedback = { kind: 'success' | 'error'; text: string }

const stepperButtonClass =
  'grid size-10 place-items-center focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

function units(count: number) {
  return `${count} ${count === 1 ? 'unidade' : 'unidades'}`
}

/**
 * Quantidade + compra. O limite considera o estoque da edição, o máximo por pedido e o
 * que o usuário já tem no carrinho; a API continua sendo quem decide (erros são exibidos).
 */
export function PurchasePanel({ nft }: { nft: NftDetail }) {
  const navigate = useNavigate()
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
      <div role="status" className="rounded-lg bg-card p-4">
        <p className="font-bold">Esta edição está esgotada.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Não há unidades disponíveis para compra.{' '}
          <Link to="/" className="underline underline-offset-4">
            Ver outros NFTs
          </Link>
        </p>
      </div>
    )
  }

  function addToCart(options: { buyNow: boolean }) {
    setFeedback(null)
    add.mutate(
      { nftId: nft.id, quantity: selected },
      {
        onSuccess: () => {
          if (options.buyNow) {
            void navigate({ to: '/carrinho' })

            return
          }

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

  return (
    <div className="flex flex-col gap-4">
      {!atLimit && (
        <div className="flex flex-wrap items-center gap-4">
          <span id="quantity-label" className="text-sm text-text-secondary">
            Quantidade
          </span>
          <div
            role="group"
            aria-labelledby="quantity-label"
            className="inline-flex items-center rounded-md border border-border-soft"
          >
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={selected <= 1}
              onClick={() => setQuantity(selected - 1)}
              className={stepperButtonClass}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output aria-label={`Quantidade: ${selected}`} className="min-w-10 text-center text-base">
              {selected}
            </output>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={selected >= remaining}
              onClick={() => setQuantity(selected + 1)}
              className={stepperButtonClass}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-text-secondary" data-testid="quantity-hint">
        {atLimit
          ? `Você já tem o máximo permitido (${units(nft.maxQuantity)}) deste NFT no carrinho.`
          : selected >= remaining
            ? `Máximo de ${units(nft.maxQuantity)} por pedido.${inCart > 0 ? ` Você já tem ${inCart} no carrinho.` : ''}`
            : `Até ${units(nft.maxQuantity)} por pedido.`}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => addToCart({ buyNow: false })}
          disabled={add.isPending || atLimit}
          aria-busy={add.isPending}
          className="h-[45px] rounded-md px-6 text-base font-bold"
        >
          {add.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => addToCart({ buyNow: true })}
          disabled={add.isPending || atLimit}
          className="h-[45px] rounded-md border-primary px-6 text-base font-bold text-text-accent"
        >
          Comprar agora
        </Button>
      </div>

      <p
        role="status"
        className={`min-h-5 text-sm ${feedback?.kind === 'error' ? 'text-destructive' : 'text-text-accent'}`}
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
    </div>
  )
}
