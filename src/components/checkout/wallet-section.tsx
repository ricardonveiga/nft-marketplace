import { Link } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConnectWallet, useDisconnectWallet, useWallets } from '@/hooks/use-wallets'
import { shortAddress } from '@/lib/address'
import { getApiErrorMessage, isForbidden } from '@/lib/api-error'
import type { NftNetwork } from '@/types/nft'

type WalletSectionProps = {
  walletId: string | null
  network: NftNetwork | ''
  onWalletChange: (walletId: string) => void
  onNetworkChange: (network: NftNetwork) => void
  walletError?: string
  networkError?: string
}

type Message = { kind: 'success' | 'error'; text: string }

const selectClass =
  'h-10 w-full rounded-md bg-surface-dark px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive'

/** Seleção da carteira, conexão simulada (conectar, recusa, desconectar) e rede de pagamento. */
export function WalletSection({
  walletId,
  network,
  onWalletChange,
  onNetworkChange,
  walletError,
  networkError,
}: WalletSectionProps) {
  const { data, isPending, isError, error, refetch } = useWallets()
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [message, setMessage] = useState<Message | null>(null)
  const legendId = useId()
  const networkErrorId = useId()

  if (isPending) {
    return (
      <div role="status" aria-label="Carregando carteiras" className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        {isForbidden(error) ? (
          <p className="text-sm text-destructive">Você não tem permissão para ver estas carteiras.</p>
        ) : (
          <>
            <p className="text-sm text-destructive">Não foi possível carregar suas carteiras.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </>
        )}
      </div>
    )
  }

  if (data.wallets.length === 0) {
    return (
      <div id="checkout-wallet" tabIndex={-1} className="flex flex-col gap-2 outline-none">
        <p className="rounded-md bg-surface-dark p-4 text-sm text-text-secondary">
          Você ainda não tem carteiras cadastradas.{' '}
          <Link
            to="/carteiras"
            search={{ redirect: '/pagamento' }}
            className="font-bold text-text-accent underline underline-offset-4"
          >
            Cadastrar carteira
          </Link>
        </p>
        {walletError && (
          <p role="alert" className="text-xs text-destructive">
            {walletError}
          </p>
        )}
      </div>
    )
  }

  const selected = data.wallets.find((wallet) => wallet.id === walletId)
  const connected = Boolean(selected) && data.connectedWalletId === selected?.id
  const busy = connect.isPending || disconnect.isPending

  function handleConnect() {
    if (!selected) {
      return
    }

    setMessage(null)
    connect.mutate(selected.id, {
      onSuccess: () => setMessage({ kind: 'success', text: `${selected.label} conectada.` }),
      onError: (error) =>
        setMessage({
          kind: 'error',
          text: getApiErrorMessage(error, 'Não foi possível conectar a carteira. Tente novamente.'),
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
    <div className="flex flex-col gap-4">
      <fieldset
        id="checkout-wallet"
        tabIndex={-1}
        aria-describedby={walletError ? `${legendId}-error` : undefined}
        className="flex flex-col gap-3 outline-none"
      >
        <legend id={legendId} className="sr-only">
          Carteira
        </legend>

        {data.wallets.map((wallet) => {
          const checked = wallet.id === walletId
          const isConnected = wallet.id === data.connectedWalletId

          return (
            <label
              key={wallet.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring ${checked ? 'border-primary bg-surface-dark' : 'border-border-soft'}`}
            >
              <input
                type="radio"
                name="wallet"
                value={wallet.id}
                checked={checked}
                onChange={() => {
                  setMessage(null)
                  onWalletChange(wallet.id)
                }}
                className="mt-1 accent-[var(--primary)]"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{wallet.label}</span>
                  {wallet.isPrimary && (
                    <span className="rounded-full border border-border-soft px-2 text-xs text-text-secondary">
                      Principal
                    </span>
                  )}
                </span>
                <span className="text-sm text-text-secondary" title={wallet.address}>
                  {shortAddress(wallet.address)}
                </span>
                <span className="text-xs text-text-secondary">
                  Redes: {wallet.networks.join(', ')}
                </span>
                <span
                  className={`text-xs ${isConnected ? 'text-text-accent' : 'text-text-secondary'}`}
                  data-testid={`wallet-status-${wallet.id}`}
                >
                  {isConnected ? 'Conectada' : 'Desconectada'}
                </span>
              </span>
            </label>
          )
        })}

        {walletError && (
          <p id={`${legendId}-error`} role="alert" className="text-xs text-destructive">
            {walletError}
          </p>
        )}
      </fieldset>

      <Link
        to="/carteiras"
        search={{ redirect: '/pagamento' }}
        className="w-fit text-sm text-text-secondary underline underline-offset-4 hover:text-foreground"
      >
        Gerenciar carteiras
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        {connected ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleDisconnect}
            disabled={busy}
            className="h-10 rounded-md px-4 text-sm font-bold"
          >
            {disconnect.isPending ? 'Desconectando…' : 'Desconectar carteira'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleConnect}
            disabled={busy || !selected}
            aria-busy={connect.isPending}
            className="h-10 rounded-md px-4 text-sm font-bold"
          >
            {connect.isPending ? 'Conectando…' : 'Conectar carteira'}
          </Button>
        )}

        <p
          role="status"
          className={`text-sm ${message?.kind === 'error' ? 'text-destructive' : 'text-text-accent'}`}
        >
          {message?.text}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="checkout-network" className="text-sm">
          Rede de pagamento
        </label>
        <select
          id="checkout-network"
          value={network}
          disabled={!selected}
          onChange={(event) => onNetworkChange(event.target.value as NftNetwork)}
          aria-invalid={networkError ? true : undefined}
          aria-describedby={networkError ? networkErrorId : undefined}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a rede
          </option>
          {selected?.networks.map((option) => (
            <option key={option} value={option} className="bg-card">
              {option}
            </option>
          ))}
        </select>
        {networkError && (
          <p id={networkErrorId} role="alert" className="text-xs text-destructive">
            {networkError}
          </p>
        )}
      </div>
    </div>
  )
}
