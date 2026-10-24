import { useIsMutating } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { RequireAuth } from '@/components/auth/require-auth'
import { RingCheck } from '@/components/forms/fields'
import { AccountSidebar } from '@/components/profile/account-sidebar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletForm } from '@/components/wallets/wallet-form'
import { useWallets } from '@/hooks/use-wallets'
import { isForbidden } from '@/lib/api-error'
import { getSafeRedirect, validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/carteiras')({
  // Quem chega do pagamento volta para lá (mesmo `redirect` do login).
  validateSearch: validateAuthSearch,
  component: WalletsPage,
})

type Feedback = { kind: 'success' | 'error'; text: string }

const addLink =
  'text-base font-bold text-text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60'

function WalletsPage() {
  return (
    <RequireAuth>
      {() => (
        <div className="mx-auto grid w-full max-w-[1264px] items-start gap-8 px-6 pt-[32px] pb-24 md:px-8 lg:grid-cols-[310px_1fr] lg:gap-x-[28px]">
          <AccountSidebar />
          <WalletsContent />
        </div>
      )}
    </RequireAuth>
  )
}

function WalletsContent() {
  const { redirect } = Route.useSearch()
  const returnTo = getSafeRedirect(redirect)
  const { data, isPending, isError, error, refetch } = useWallets()
  const busy = useIsMutating({ mutationKey: ['wallets', 'mutation'] }) > 0
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const wallets = data?.wallets ?? []
  const primary = wallets.find((wallet) => wallet.isPrimary)
  const secondary = wallets.find((wallet) => !wallet.isPrimary)

  return (
    <div>
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
        <div role="status" aria-label="Carregando carteiras" className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
          {isForbidden(error) ? (
            <p>Você não tem permissão para ver estas carteiras.</p>
          ) : (
            <>
              <p>Não foi possível carregar suas carteiras.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </>
          )}
        </div>
      )}

      {data && (
        <>
          <section
            aria-labelledby="carteira-principal"
            data-testid={primary ? 'wallet-card' : 'wallet-empty-slot'}
          >
            <div className="-mt-px flex items-start justify-between gap-4">
              <h1 id="carteira-principal" className="text-[17px] leading-5 font-bold">
                Carteira principal
              </h1>
              {!primary && (
                <button
                  type="button"
                  onClick={() => firstFieldRef.current?.focus()}
                  className={`${addLink} -mt-[3px]`}
                >
                  Adicionar
                  <span className="sr-only"> carteira principal</span>
                </button>
              )}
            </div>
            <p className="mt-px text-sm leading-5 text-text-secondary">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>

            <div className="mt-[34px]">
              <WalletForm
                key={primary?.id ?? 'nova-principal'}
                wallet={primary}
                role="principal"
                connected={Boolean(primary) && data.connectedWalletId === primary?.id}
                busy={busy}
                onFeedback={setFeedback}
                firstFieldRef={firstFieldRef}
              />
            </div>
          </section>

          <section
            aria-labelledby="carteira-secundaria"
            data-testid={secondary ? 'wallet-card' : 'wallet-empty-slot'}
            className="mt-[29px]"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="carteira-secundaria" className="text-[17px] leading-5 font-bold">
                Carteira secundária
              </h2>
              {!secondary && (
                <div className="-mt-px flex items-center gap-2.5 pr-1.5">
                  <RingCheck checked={sameAsPrimary} onChange={setSameAsPrimary}>
                    <span className="-ml-0.5 text-sm">Igual à carteira principal</span>
                  </RingCheck>
                  <button
                    type="button"
                    disabled={!primary || sameAsPrimary || addingSecondary}
                    title={primary ? undefined : 'Cadastre a carteira principal primeiro.'}
                    onClick={() => setAddingSecondary(true)}
                    className={addLink}
                  >
                    Adicionar
                    <span className="sr-only"> carteira secundária</span>
                  </button>
                </div>
              )}
            </div>

            {secondary ? (
              <div className="mt-[30px]">
                <WalletForm
                  key={secondary.id}
                  wallet={secondary}
                  role="secundária"
                  connected={data.connectedWalletId === secondary.id}
                  busy={busy}
                  onFeedback={setFeedback}
                />
              </div>
            ) : addingSecondary ? (
              <div className="mt-[30px]">
                <WalletForm
                  key="nova-secundaria"
                  role="secundária"
                  busy={busy}
                  onFeedback={(next) => {
                    setFeedback(next)

                    if (next.kind === 'success') {
                      setAddingSecondary(false)
                    }
                  }}
                  onCancel={() => setAddingSecondary(false)}
                />
              </div>
            ) : (
              <p className="mt-1.5 text-sm leading-5 text-text-secondary">
                {sameAsPrimary
                  ? 'A carteira secundária é a mesma da principal.'
                  : 'Você ainda não adicionou uma carteira secundária.'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
