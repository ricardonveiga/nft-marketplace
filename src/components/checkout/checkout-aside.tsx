import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConnectWallet, useDisconnectWallet, useWallets } from '@/hooks/use-wallets'
import { getApiErrorMessage, isForbidden } from '@/lib/api-error'
import type { Cart } from '@/types/cart'

type CheckoutAsideProps = {
  cart: Cart
  walletId: string | null
  connected: boolean
  error?: string
  disabled: boolean
  pending: boolean
  onWallet: (walletId: string) => void
  onConfirm: () => void
}

function Line({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[15px] leading-4">
      <dt>{label}</dt>
      <dd data-testid={testId} className="text-base leading-4">
        {value}
      </dd>
    </div>
  )
}

/** Coluna "Seus NFTs": itens, valores calculados pela API, carteira e rede, e a confirmação. */
export function CheckoutAside({
  cart,
  walletId,
  connected,
  error,
  disabled,
  pending,
  onWallet,
  onConfirm,
}: CheckoutAsideProps) {
  return (
    <section aria-labelledby="seus-nfts" className="flex flex-col">
      <h2 id="seus-nfts" className="text-[17px] leading-5 font-bold">
        Seus NFTs
      </h2>

      <div className="mt-[9px] flex items-center justify-between border-b border-border pb-[11px] text-base leading-4 font-bold">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {cart.items.map((item) => (
          <li key={item.nft.id} className="flex h-[70px] items-center gap-2.5 bg-card pr-3 pl-1">
            <img
              src={item.nft.imageUrl}
              alt=""
              width={70}
              height={70}
              className="size-[70px] shrink-0 rounded-md object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base leading-5 font-bold" title={item.nft.name}>
                {item.nft.name}
              </span>
              <span className="block text-[13px] leading-5 text-brand-secondary">
                ID do token: {item.nft.tokenId}
              </span>
              {item.status !== 'ok' && (
                <span className="block text-xs leading-4 text-destructive">Indisponível</span>
              )}
            </span>
            <span className="w-12 whitespace-nowrap text-center text-sm text-text-secondary">(x {item.quantity})</span>
            <span className="w-[88px] text-right text-[17px] leading-5 font-bold text-text-accent">
              {item.lineTotalEth} ETH
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center text-sm leading-4">
        Tem um código promocional?{' '}
        <Link to="/carrinho" className="underline underline-offset-4 hover:text-text-accent">
          Aplique aqui
        </Link>
      </p>

      <dl className="mt-[14px] flex flex-col gap-4">
        <Line label="Subtotal" value={`${cart.subtotalEth} ETH`} testId="summary-subtotal" />
        <Line
          label="Desconto do lançamento"
          value={`(-) ${cart.coupon ? cart.discountEth : '00.00'}`}
          testId="summary-discount"
        />
        <Line label="Taxa de rede" value={`${cart.networkFeeEth} ETH`} testId="summary-fee" />
      </dl>
      <p className="mt-4 text-center text-[11px] leading-[14px] text-text-accent">Taxa estimada</p>

      <div className="mt-[11px] border-t border-border pt-2.5">
        <div className="mx-[42px] flex items-baseline justify-between">
          <span className="text-[15px] leading-4 font-bold">Total</span>
          <span data-testid="summary-total" className="text-lg leading-5 font-bold text-text-accent">
            {cart.totalEth} ETH
          </span>
        </div>
      </div>

      <WalletChoice walletId={walletId} connected={connected} error={error} onWallet={onWallet} />

      <Button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        aria-busy={pending}
        className="mt-6 h-[45px] w-full rounded-[7px] text-[15px] font-bold"
      >
        {pending ? 'Processando…' : 'Confirmar compra'}
      </Button>

      <Link
        to="/carteiras"
        search={{ redirect: '/pagamento' }}
        className="mt-4 self-center text-sm text-text-secondary underline underline-offset-4 hover:text-foreground"
      >
        Gerenciar carteiras
      </Link>
    </section>
  )
}

type Message = { kind: 'success' | 'error'; text: string }

/** "Carteira e rede": escolha da carteira cadastrada, com conexão simulada (conectar, recusa e desconectar). */
function WalletChoice({
  walletId,
  connected,
  error,
  onWallet,
}: {
  walletId: string | null
  connected: boolean
  error?: string
  onWallet: (walletId: string) => void
}) {
  const { data, isPending, isError, error: loadError, refetch } = useWallets()
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [message, setMessage] = useState<Message | null>(null)
  const busy = connect.isPending || disconnect.isPending

  function handleConnect(id: string, label: string) {
    setMessage(null)
    connect.mutate(id, {
      onSuccess: () => setMessage({ kind: 'success', text: `${label} conectada.` }),
      onError: (failure) =>
        setMessage({
          kind: 'error',
          text: getApiErrorMessage(failure, 'Não foi possível conectar a carteira. Tente novamente.'),
        }),
    })
  }

  function handleDisconnect() {
    setMessage(null)
    disconnect.mutate(undefined, {
      onSuccess: () => setMessage({ kind: 'success', text: 'Carteira desconectada.' }),
      onError: () =>
        setMessage({ kind: 'error', text: 'Não foi possível desconectar a carteira. Tente novamente.' }),
    })
  }

  return (
    <div className="mt-[9px]">
      <h3 className="text-center text-[17px] leading-5 font-bold">Carteira e rede</h3>

      {isPending && (
        <div role="status" aria-label="Carregando carteiras" className="mt-4 flex flex-col gap-4">
          <Skeleton className="h-[45px] w-full" />
          <Skeleton className="h-[45px] w-full" />
        </div>
      )}

      {(isError || (!isPending && !data)) && (
        <div role="alert" className="mt-4 flex flex-col items-start gap-3 text-sm">
          {isForbidden(loadError) ? (
            <p className="text-destructive">Você não tem permissão para ver estas carteiras.</p>
          ) : (
            <>
              <p className="text-destructive">Não foi possível carregar suas carteiras.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </>
          )}
        </div>
      )}

      {data && data.wallets.length === 0 && (
        <div id="checkout-wallet" tabIndex={-1} className="mt-4 flex flex-col gap-2 outline-none">
          <p className="border border-border p-4 text-sm text-text-secondary">
            Você ainda não tem carteiras cadastradas.{' '}
            <Link
              to="/carteiras"
              search={{ redirect: '/pagamento' }}
              className="font-bold text-text-accent underline underline-offset-4"
            >
              Cadastrar carteira
            </Link>
          </p>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}

      {data && data.wallets.length > 0 && (
        <fieldset
          id="checkout-wallet"
          tabIndex={-1}
          aria-describedby={error ? 'checkout-wallet-error' : undefined}
          className="mt-[17px] flex flex-col gap-4 outline-none"
        >
          <legend className="sr-only">Carteira</legend>

          {data.wallets.map((wallet) => {
            const checked = wallet.id === walletId
            const isConnected = wallet.id === data.connectedWalletId

            return (
              <div
                key={wallet.id}
                className={`flex min-h-[45px] items-center gap-3 border px-3 ${checked ? 'border-foreground' : 'border-border'}`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-[11px] py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
                  <input
                    type="radio"
                    name="wallet"
                    value={wallet.id}
                    checked={checked}
                    onChange={() => {
                      setMessage(null)
                      onWallet(wallet.id)
                    }}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="grid size-4 shrink-0 place-items-center rounded-full border-2 border-primary peer-checked:[&>span]:opacity-100"
                  >
                    <span className="size-2 rounded-full bg-primary opacity-0" />
                  </span>
                  <span className="min-w-0 truncate text-[15px]">{wallet.label}</span>
                  <span
                    title={wallet.address}
                    className={`shrink-0 text-xs ${isConnected ? 'text-text-accent' : 'text-text-secondary'}`}
                    data-testid={`wallet-status-${wallet.id}`}
                  >
                    {isConnected ? 'Conectada' : 'Desconectada'}
                  </span>
                </label>
                {checked &&
                  (connected ? (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      aria-label="Desconectar carteira"
                      disabled={busy}
                      className="shrink-0 text-xs font-bold text-text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
                    >
                      {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnect(wallet.id, wallet.label)}
                      aria-label="Conectar carteira"
                      disabled={busy}
                      aria-busy={connect.isPending}
                      className="shrink-0 text-xs font-bold text-text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
                    >
                      {connect.isPending ? 'Conectando…' : 'Conectar'}
                    </button>
                  ))}
              </div>
            )
          })}

          {error && (
            <p id="checkout-wallet-error" role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </fieldset>
      )}

      <p
        role="status"
        className={`mt-3 text-sm empty:hidden ${message?.kind === 'error' ? 'text-destructive' : 'text-text-accent'}`}
      >
        {message?.text}
      </p>

    </div>
  )
}
