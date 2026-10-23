import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useRemoveCartItem, useSetCartItemQuantity } from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/lib/api-error'
import type { CartItem } from '@/types/cart'

type CartItemRowProps = {
  item: CartItem
  /** Há uma alteração do carrinho em andamento: bloqueia os controles. */
  busy: boolean
  onFeedback: (feedback: { kind: 'success' | 'error'; text: string }) => void
}

const stepperButtonClass =
  'grid size-9 place-items-center focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

export function CartItemRow({ item, busy, onFeedback }: CartItemRowProps) {
  const { nft, quantity, maxQuantity, status } = item
  const setQuantity = useSetCartItemQuantity()
  const remove = useRemoveCartItem()

  function changeQuantity(next: number) {
    setQuantity.mutate(
      { nftId: nft.id, quantity: next },
      {
        onSuccess: () =>
          onFeedback({ kind: 'success', text: `Quantidade de ${nft.name} alterada para ${next}.` }),
        onError: (error) =>
          onFeedback({
            kind: 'error',
            text: getApiErrorMessage(error, 'Não foi possível alterar a quantidade. Tente novamente.'),
          }),
      },
    )
  }

  function removeItem() {
    remove.mutate(nft.id, {
      onSuccess: () => onFeedback({ kind: 'success', text: `${nft.name} removido do carrinho.` }),
      onError: (error) =>
        onFeedback({
          kind: 'error',
          text: getApiErrorMessage(error, 'Não foi possível remover o item. Tente novamente.'),
        }),
    })
  }

  return (
    <li
      data-testid="cart-item"
      className="grid grid-cols-[96px_1fr] gap-4 rounded-lg bg-card p-4 sm:grid-cols-[96px_1fr_auto]"
    >
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="block size-24 overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={96}
          height={96}
          className="size-full object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-base leading-5 font-normal">
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-sm text-text-secondary">
          {nft.collection} · Edição {nft.edition}
        </p>
        <p className="text-sm text-text-secondary">{item.unitPriceEth} ETH cada</p>

        {status === 'sold_out' && (
          <p className="text-sm text-destructive">
            Este NFT esgotou. Remova-o para continuar.
          </p>
        )}
        {status === 'insufficient_stock' && (
          <p className="text-sm text-destructive">
            Só restam {maxQuantity} unidades. Reduza a quantidade para continuar.
          </p>
        )}
        {status === 'ok' && quantity >= maxQuantity && (
          <p className="text-sm text-text-secondary">
            Máximo de {maxQuantity} {maxQuantity === 1 ? 'unidade' : 'unidades'} por pedido.
          </p>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-between">
        <p className="text-lg font-bold text-text-accent" data-testid="cart-line-total">
          {item.lineTotalEth} ETH
        </p>

        <div className="flex items-center gap-3">
          {status !== 'sold_out' && (
            <div
              role="group"
              aria-label={`Quantidade de ${nft.name}`}
              className="inline-flex items-center rounded-md border border-border-soft"
            >
              <button
                type="button"
                aria-label={`Diminuir quantidade de ${nft.name}`}
                disabled={busy || quantity <= 1}
                onClick={() => changeQuantity(quantity - 1)}
                className={stepperButtonClass}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <output aria-label={`Quantidade de ${nft.name}: ${quantity}`} className="min-w-8 text-center text-base">
                {quantity}
              </output>
              <button
                type="button"
                aria-label={`Aumentar quantidade de ${nft.name}`}
                disabled={busy || quantity >= maxQuantity}
                onClick={() => changeQuantity(quantity + 1)}
                className={stepperButtonClass}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label={`Remover ${nft.name} do carrinho`}
            disabled={busy}
            onClick={removeItem}
            className="grid size-9 place-items-center rounded-md text-text-secondary hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
