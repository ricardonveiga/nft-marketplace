import { AlertDialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { useDeleteWallet, useUpdateWallet } from '@/hooks/use-wallets'
import { shortAddress } from '@/lib/address'
import { getApiErrorMessage } from '@/lib/api-error'
import type { Wallet } from '@/types/wallet'
import { WalletFormDialog } from './wallet-form-dialog'

type WalletCardProps = {
  wallet: Wallet
  role: 'principal' | 'secundária'
  connected: boolean
  /** Há uma alteração de carteira em andamento: bloqueia as ações. */
  busy: boolean
  onFeedback: (feedback: { kind: 'success' | 'error'; text: string }) => void
}

const actionClass = 'h-9 rounded-md px-3 text-sm font-bold'

export function WalletCard({ wallet, role, connected, busy, onFeedback }: WalletCardProps) {
  const update = useUpdateWallet()
  const remove = useDeleteWallet()

  function makePrimary() {
    update.mutate(
      { id: wallet.id, update: { isPrimary: true } },
      {
        onSuccess: () => onFeedback({ kind: 'success', text: `${wallet.label} agora é a carteira principal.` }),
        onError: (error) =>
          onFeedback({
            kind: 'error',
            text: getApiErrorMessage(error, 'Não foi possível trocar a carteira principal. Tente novamente.'),
          }),
      },
    )
  }

  function removeWallet() {
    remove.mutate(wallet.id, {
      onSuccess: () => onFeedback({ kind: 'success', text: `${wallet.label} removida.` }),
      onError: (error) =>
        onFeedback({
          kind: 'error',
          text: getApiErrorMessage(error, 'Não foi possível remover a carteira. Tente novamente.'),
        }),
    })
  }

  return (
    <li
      data-testid="wallet-card"
      className="flex flex-col gap-4 rounded-lg bg-card p-6"
      aria-label={`Carteira ${role}: ${wallet.label}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base leading-5">
          Carteira {role}
        </h2>
        <span
          data-testid="wallet-connection"
          className={`rounded-full border px-3 py-0.5 text-xs ${connected ? 'border-primary text-text-accent' : 'border-border-soft text-text-secondary'}`}
        >
          {connected ? 'Conectada' : 'Desconectada'}
        </span>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Apelido</dt>
          <dd data-testid="wallet-label">{wallet.label}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Endereço</dt>
          <dd title={wallet.address} data-testid="wallet-address">
            {shortAddress(wallet.address)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Redes</dt>
          <dd data-testid="wallet-networks">{wallet.networks.join(', ')}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <WalletFormDialog
          wallet={wallet}
          onSaved={(text) => onFeedback({ kind: 'success', text })}
          trigger={
            <Button type="button" variant="outline" disabled={busy} className={actionClass}>
              Editar
              <span className="sr-only"> {wallet.label}</span>
            </Button>
          }
        />

        {!wallet.isPrimary && (
          <Button type="button" variant="outline" disabled={busy} onClick={makePrimary} className={actionClass}>
            Definir como principal
            <span className="sr-only"> {wallet.label}</span>
          </Button>
        )}

        <AlertDialog.Root>
          <AlertDialog.Trigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className={`${actionClass} text-destructive`}
            >
              Remover
              <span className="sr-only"> {wallet.label}</span>
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 shadow-[0_0_30px_rgba(10,6,4,0.45)] outline-none">
              <AlertDialog.Title className="text-base">Remover {wallet.label}?</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-text-secondary">
                {wallet.isPrimary
                  ? 'Esta é a carteira principal. Se houver outra carteira, ela passará a ser a principal.'
                  : 'Esta carteira deixará de poder ser usada nos pagamentos.'}
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button type="button" variant="outline" className="h-10 rounded-md px-5 font-bold">
                    Cancelar
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button type="button" onClick={removeWallet} className="h-10 rounded-md px-5 font-bold">
                    Remover
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </li>
  )
}
