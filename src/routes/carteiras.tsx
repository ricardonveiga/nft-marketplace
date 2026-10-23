import { useIsMutating } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { RequireAuth } from '@/components/auth/require-auth'
import { WalletCard } from '@/components/wallets/wallet-card'
import { WalletFormDialog } from '@/components/wallets/wallet-form-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWallets } from '@/hooks/use-wallets'
import { getSafeRedirect, validateAuthSearch } from '@/lib/redirect'
import { MAX_WALLETS } from '@/lib/wallets'

export const Route = createFileRoute('/carteiras')({
  // Quem chega do pagamento volta para lá (mesmo `redirect` do login).
  validateSearch: validateAuthSearch,
  component: WalletsPage,
})

type Feedback = { kind: 'success' | 'error'; text: string }

function WalletsPage() {
  return (
    <RequireAuth>
      {() => (
        <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
          <WalletsContent />
        </div>
      )}
    </RequireAuth>
  )
}

function WalletsContent() {
  const { redirect } = Route.useSearch()
  const returnTo = getSafeRedirect(redirect)
  const { data, isPending, isError, refetch } = useWallets()
  const busy = useIsMutating({ mutationKey: ['wallets', 'mutation'] }) > 0
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const wallets = data?.wallets ?? []
  const [primary, secondary] = [wallets.find((wallet) => wallet.isPrimary), wallets.find((wallet) => !wallet.isPrimary)]
  const canAdd = wallets.length < MAX_WALLETS

  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-heading">Carteiras</h1>
        <p className="text-sm text-text-secondary">
          Cadastre uma carteira principal e uma secundária para pagar seus pedidos.
        </p>
      </div>

      {/* Sucesso é anunciado só para leitores de tela; erros ficam visíveis. */}
      <p role="status" className="sr-only">
        {feedback?.kind === 'success' ? feedback.text : ''}
      </p>
      {feedback?.kind === 'error' && (
        <p role="alert" className="mb-6 rounded-md bg-card px-4 py-3 text-sm text-destructive">
          {feedback.text}
        </p>
      )}

      {returnTo !== '/' && wallets.length > 0 && (
        <p className="mb-6 rounded-md bg-card px-4 py-3 text-sm">
          Pronto para continuar?{' '}
          <Link to="/pagamento" className="font-bold text-text-accent underline underline-offset-4">
            Voltar ao pagamento
          </Link>
        </p>
      )}

      {isPending && (
        <div role="status" aria-label="Carregando carteiras" className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
          <p>Não foi possível carregar suas carteiras.</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      )}

      {data && (
        <ul className="grid items-start gap-6 md:grid-cols-2">
          {primary ? (
            <WalletCard
              wallet={primary}
              role="principal"
              connected={data.connectedWalletId === primary.id}
              busy={busy}
              onFeedback={setFeedback}
            />
          ) : (
            <EmptySlot role="principal" onSaved={(text) => setFeedback({ kind: 'success', text })} disabled={busy} />
          )}

          {secondary ? (
            <WalletCard
              wallet={secondary}
              role="secundária"
              connected={data.connectedWalletId === secondary.id}
              busy={busy}
              onFeedback={setFeedback}
            />
          ) : (
            canAdd &&
            primary && (
              <EmptySlot role="secundária" onSaved={(text) => setFeedback({ kind: 'success', text })} disabled={busy} />
            )
          )}
        </ul>
      )}
    </>
  )
}

function EmptySlot({
  role,
  disabled,
  onSaved,
}: {
  role: 'principal' | 'secundária'
  disabled: boolean
  onSaved: (message: string) => void
}) {
  return (
    <li
      data-testid="wallet-empty-slot"
      className="flex flex-col items-start gap-4 rounded-lg border-2 border-dashed border-border-soft p-6"
    >
      <h2 className="text-base leading-5">Carteira {role}</h2>
      <p className="text-sm text-text-secondary">
        {role === 'principal'
          ? 'Você ainda não tem uma carteira cadastrada.'
          : 'Adicione uma segunda carteira como reserva.'}
      </p>
      <WalletFormDialog
        role={role}
        onSaved={onSaved}
        trigger={
          <Button type="button" disabled={disabled} className="h-10 rounded-md px-5 text-sm font-bold">
            Adicionar carteira {role}
          </Button>
        }
      />
    </li>
  )
}
