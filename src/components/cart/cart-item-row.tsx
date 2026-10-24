import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash } from 'lucide-react'
import { useRemoveCartItem, useSetCartItemQuantity } from '@/hooks/use-cart'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getApiErrorMessage } from '@/lib/api-error'
import type { CartItem } from '@/types/cart'

/** Colunas da tabela (Figma): NFT, Preço, Edições, Total e a lixeira; o cabeçalho usa as mesmas. */
export const CART_COLUMNS = 'lg:grid-cols-[312px_138px_136px_151px_45px]'

type CartItemRowProps = {
  item: CartItem
  /** Há uma alteração do carrinho em andamento: bloqueia os controles. */
  busy: boolean
  onFeedback: (feedback: { kind: 'success' | 'error'; text: string }) => void
}

const stepperButtonClass =
  'grid h-6 w-[19px] shrink-0 place-items-center rounded-lg bg-primary text-stepper-glyph focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

function CartTableRow({ item, busy, onFeedback }: CartItemRowProps) {
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
      className={`grid grid-cols-[70px_1fr_auto] items-center gap-x-4 gap-y-3 bg-card pr-4 max-lg:p-3 lg:h-[70px] lg:gap-x-0 lg:pr-0 ${CART_COLUMNS}`}
    >
      <div className="flex min-w-0 items-center gap-[17px] max-lg:col-span-2">
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="block size-[70px] shrink-0 overflow-hidden rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img
            src={nft.imageUrl}
            alt={`${nft.name}, da coleção ${nft.collection}`}
            width={70}
            height={70}
            className="size-full object-cover"
          />
        </Link>

        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-base leading-5 font-bold">
            <Link
              to="/nft/$id"
              params={{ id: nft.id }}
              className="hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              {nft.name}
            </Link>
          </h3>
          <p className="text-sm leading-5 text-brand-secondary">ID do token: {nft.tokenId}</p>
          <p className="text-sm leading-5 text-text-secondary lg:hidden">{item.unitPriceEth} ETH cada</p>

          {status === 'sold_out' && (
            <p className="text-xs leading-4 text-destructive">Este NFT esgotou. Remova-o para continuar.</p>
          )}
          {status === 'insufficient_stock' && (
            <p className="text-xs leading-4 text-destructive">
              Só restam {maxQuantity} unidades. Reduza a quantidade para continuar.
            </p>
          )}
          {status === 'ok' && quantity >= maxQuantity && (
            <p className="text-[11px] leading-4 whitespace-nowrap text-text-secondary">
              Máximo de {maxQuantity} {maxQuantity === 1 ? 'unidade' : 'unidades'} por pedido.
            </p>
          )}
        </div>
      </div>

      <p className="hidden text-base font-bold text-text-secondary lg:block">{item.unitPriceEth} ETH</p>

      <div className="flex items-center max-lg:col-start-1 max-lg:justify-self-start">
        {status !== 'sold_out' && (
          <div role="group" aria-label={`Quantidade de ${nft.name}`} className="flex items-center gap-[13px]">
            <button
              type="button"
              aria-label={`Diminuir quantidade de ${nft.name}`}
              disabled={busy || quantity <= 1}
              onClick={() => changeQuantity(quantity - 1)}
              className={stepperButtonClass}
            >
              <Minus className="size-3" strokeWidth={3} aria-hidden="true" />
            </button>
            <output
              aria-label={`Quantidade de ${nft.name}: ${quantity}`}
              className="min-w-[10px] text-center text-base"
            >
              {quantity}
            </output>
            <button
              type="button"
              aria-label={`Aumentar quantidade de ${nft.name}`}
              disabled={busy || quantity >= maxQuantity}
              onClick={() => changeQuantity(quantity + 1)}
              className={stepperButtonClass}
            >
              <Plus className="size-3" strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <p className="text-base font-bold text-text-accent max-lg:justify-self-end" data-testid="cart-line-total">
        {item.lineTotalEth} ETH
      </p>

      <button
        type="button"
        aria-label={`Remover ${nft.name} do carrinho`}
        disabled={busy}
        onClick={removeItem}
        className="grid size-5 place-items-center text-brand-secondary hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 max-lg:justify-self-end"
      >
        <Trash className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </li>
  )
}

const roundButtonClass =
  'grid size-6 shrink-0 place-items-center rounded-full bg-avatar text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:text-stepper-glyph'

/** Cartão do item no mobile (Figma): imagem de 100 px, nome, edição, valor e o seletor de quantidade. */
function CartCard({ item, busy, onFeedback }: CartItemRowProps) {
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
    <li data-testid="cart-item" className="relative flex h-[100px] overflow-hidden rounded-xl bg-card">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="block size-[100px] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
      >
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={100}
          height={100}
          className="size-full rounded-l-xl object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-center pr-4 pl-[9px]">
        <h3 className="truncate text-base leading-5 font-bold">
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-[15px] leading-5 text-text-secondary">Edição: {nft.edition}</p>
        <p className="mt-[14px] text-xl leading-6 font-bold text-text-accent" data-testid="cart-line-total">
          {item.lineTotalEth} ETH
        </p>
        {status === 'sold_out' && (
          <p className="absolute right-3 bottom-1 left-[109px] text-[11px] leading-4 text-destructive">
            Este NFT esgotou. Remova-o para continuar.
          </p>
        )}
        {status === 'insufficient_stock' && (
          <p className="absolute right-3 bottom-1 left-[109px] text-[11px] leading-4 text-destructive">
            Só restam {maxQuantity} unidades. Reduza a quantidade.
          </p>
        )}
        {status === 'ok' && quantity >= maxQuantity && (
          <p className="absolute right-3 bottom-1 left-[109px] text-[11px] leading-4 text-text-secondary">
            Máximo de {maxQuantity} {maxQuantity === 1 ? 'unidade' : 'unidades'} por pedido.
          </p>
        )}
      </div>

      {status !== 'sold_out' && (
        <div
          role="group"
          aria-label={`Quantidade de ${nft.name}`}
          className="absolute top-[38px] right-4 flex items-center gap-[12px]"
        >
          <button
            type="button"
            aria-label={`Diminuir quantidade de ${nft.name}`}
            disabled={busy || quantity <= 1}
            onClick={() => changeQuantity(quantity - 1)}
            className={roundButtonClass}
          >
            <Minus className="size-3" strokeWidth={2.5} aria-hidden="true" />
          </button>
          <output aria-label={`Quantidade de ${nft.name}: ${quantity}`} className="mt-[6px] min-w-[10px] text-center text-base">
            {quantity}
          </output>
          <button
            type="button"
            aria-label={`Aumentar quantidade de ${nft.name}`}
            disabled={busy || quantity >= maxQuantity}
            onClick={() => changeQuantity(quantity + 1)}
            className={roundButtonClass}
          >
            <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label={`Remover ${nft.name} do carrinho`}
        disabled={busy}
        onClick={removeItem}
        className="absolute top-2 right-3 grid size-6 place-items-center text-brand-secondary hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </li>
  )
}

/** Tabela no desktop (a partir de 1024 px) e cartões abaixo disso. */
export function CartItemRow(props: CartItemRowProps) {
  const wide = useMediaQuery('(min-width: 1024px)')

  return wide ? <CartTableRow {...props} /> : <CartCard {...props} />
}
