import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, EllipsisVertical, Wallet as WalletIcon } from 'lucide-react'
import { shortAddress } from '@/lib/address'
import type { Wallet, WalletType } from '@/types/wallet'

/** Ordem do frame: WalletConnect, MetaMask e Coinbase Wallet. */
const MOBILE_TYPE_ORDER: readonly WalletType[] = ['WalletConnect', 'MetaMask', 'Coinbase Wallet']

type CheckoutMobileProps = {
  wallets: Wallet[]
  walletId: string | null
  connectedWalletId: string | null
  walletType: string
  totalEth: string
  /** Erro de carteira (não conectada, recusada...). */
  error?: string
  /** Aviso do resultado da conexão ("<carteira> conectada." ou o motivo da recusa). */
  message: { kind: 'success' | 'error'; text: string } | null
  disabled: boolean
  pending: boolean
  busy: boolean
  onWallet: (walletId: string) => void
  onWalletType: (type: WalletType) => void
  onSwitch: () => void
  onConfirm: () => void
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] ${checked ? 'border-primary' : 'border-border'}`}
    >
      {checked && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}

function TypeIcon({ type }: { type: WalletType }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-avatar text-base font-bold text-text-accent"
    >
      {type === 'Coinbase Wallet' ? (
        <WalletIcon className="size-5" strokeWidth={1.5} />
      ) : (
        type[0]
      )}
    </span>
  )
}

/** Pagamento no mobile (Figma "Pagamento com carteira"): escolhe a carteira, o tipo e confirma. */
export function CheckoutMobile({
  wallets,
  walletId,
  connectedWalletId,
  walletType,
  totalEth,
  error,
  message,
  disabled,
  pending,
  busy,
  onWallet,
  onWalletType,
  onSwitch,
  onConfirm,
}: CheckoutMobileProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col pb-[120px]">
      <div className="relative flex h-[35px] items-center justify-center">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.history.back()}
          className="absolute left-0 grid size-[35px] place-items-center rounded-full bg-avatar text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <h1 className="pl-6 text-xl leading-6 font-bold">Pagamento com carteira</h1>
      </div>

      <section aria-labelledby="carteira-conectada" className="mt-[23px]">
        <div className="flex items-baseline justify-between">
          <h2 id="carteira-conectada" className="text-base leading-5 font-bold">
            Carteira conectada
          </h2>
          <button
            type="button"
            onClick={onSwitch}
            disabled={busy || connectedWalletId === null}
            className="text-sm font-bold text-text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-60"
          >
            Trocar carteira
          </button>
        </div>

        {wallets.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-card p-4 text-sm text-text-secondary">
            Você ainda não tem carteiras cadastradas.{' '}
            <Link
              to="/carteiras"
              search={{ redirect: '/pagamento' }}
              className="font-bold text-text-accent underline underline-offset-4"
            >
              Cadastrar carteira
            </Link>
          </p>
        ) : (
          <ul id="checkout-wallet" tabIndex={-1} className="mt-[13px] flex flex-col gap-[21px] outline-none">
            {wallets.map((wallet) => {
              const checked = wallet.id === walletId
              const connected = wallet.id === connectedWalletId

              return (
                <li
                  key={wallet.id}
                  className="relative flex h-[93px] items-center rounded-2xl bg-card"
                >
                  <label className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-5 pr-12 pl-[19px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
                    <input
                      type="radio"
                      name="wallet"
                      value={wallet.id}
                      checked={checked}
                      disabled={busy}
                      onChange={() => onWallet(wallet.id)}
                      className="peer sr-only"
                    />
                    <Radio checked={checked} />
                    <span className="min-w-0">
                      <span className="block truncate text-base leading-5 font-bold">{wallet.label}</span>
                      <span className="block truncate text-[15px] leading-6 text-text-secondary">
                        {wallet.ensName || shortAddress(wallet.address)}
                      </span>
                      <span className="block truncate text-[15px] leading-5 text-text-secondary">
                        Rede {wallet.isPrimary ? 'principal ' : ''}
                        {wallet.networks[0]}
                      </span>
                    </span>
                    <span data-testid={`wallet-status-${wallet.id}`} className="sr-only">
                      {connected ? 'Conectada' : 'Desconectada'}
                    </span>
                  </label>
                  <Link
                    to="/carteiras"
                    search={{ redirect: '/pagamento' }}
                    aria-label={`Gerenciar ${wallet.label}`}
                    className="absolute top-1/2 right-[14px] grid size-8 -translate-y-1/2 place-items-center text-text-secondary focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <EllipsisVertical className="size-5" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {error && (
          <p id="checkout-wallet-error" role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <p
          role="status"
          className={message?.kind === 'error' ? 'mt-3 text-sm text-destructive' : 'sr-only'}
        >
          {message?.text}
        </p>
      </section>

      <fieldset className="mt-[13px]">
        <legend className="text-base leading-5 font-bold">Carteira e rede</legend>
        <div className="mt-[14px] flex flex-col gap-4">
          {MOBILE_TYPE_ORDER.map((type) => (
            <label
              key={type}
              className="flex h-[65px] cursor-pointer items-center gap-[11px] rounded-2xl bg-card pr-[15px] pl-[14px] text-[15px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                name="wallet-type"
                value={type}
                checked={walletType === type}
                onChange={() => onWalletType(type)}
                className="peer sr-only"
              />
              <TypeIcon type={type} />
              <span className="flex-1">{type}</span>
              <Radio checked={walletType === type} />
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-[11px] flex items-baseline justify-end gap-[33px] text-base leading-5 font-bold">
        <span>Total:</span>
        <span data-testid="summary-total" className="text-xl text-text-accent">
          {totalEth} ETH
        </span>
      </p>

      <div className="fixed inset-x-7 bottom-[33px] z-40">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          aria-busy={pending}
          className="h-[60px] w-full rounded-full bg-[linear-gradient(110deg,#d28a4c,#b07440)] text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Processando…' : 'Confirmar compra'}
        </button>
      </div>
    </div>
  )
}
