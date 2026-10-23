import { Link, createFileRoute } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransaction } from '@/hooks/use-transaction'
import { formatDateTime } from '@/lib/format'

export const Route = createFileRoute('/explorador/$hash')({
  component: ExplorerPage,
})

function Field({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:gap-6">
      <dt className="text-sm text-text-secondary sm:w-44 sm:shrink-0">{label}</dt>
      <dd data-testid={testId} className="font-mono text-sm break-all">
        {value}
      </dd>
    </div>
  )
}

/** Explorador de blocos simulado: é para onde a "referência da transação" do recibo aponta. */
function ExplorerPage() {
  const { hash } = Route.useParams()
  const { data: tx, isPending, isError, error, refetch } = useTransaction(hash)
  const notFound = isError && isAxiosError(error) && error.response?.status === 404

  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-heading">Explorador de blocos</h1>
        <p className="text-sm text-text-secondary">
          Simulado: esta página imita um explorador de blocos para fins de demonstração. Nenhuma
          rede real é consultada.
        </p>
      </div>

      {isPending && (
        <div role="status" aria-label="Carregando transação" className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      )}

      {notFound && (
        <div data-testid="tx-not-found" className="flex flex-col items-start gap-4">
          <h2 className="text-lg">Transação não encontrada</h2>
          <p className="text-sm text-text-secondary break-all">
            Não há nenhuma transação com a referência {hash}.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao mercado</Link>
          </Button>
        </div>
      )}

      {isError && !notFound && (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p>Não foi possível consultar a transação.</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      )}

      {tx && (
        <section aria-labelledby="tx-titulo" className="flex flex-col gap-4 rounded-lg bg-card p-6">
          <h2 id="tx-titulo" className="text-lg leading-4">
            Detalhes da transação
          </h2>
          <dl className="flex flex-col gap-3">
            <Field label="Referência" value={tx.hash} testId="tx-hash" />
            <Field label="Status" value="Confirmada" testId="tx-status" />
            <Field label="Rede" value={tx.network} testId="tx-network" />
            <Field label="Bloco" value={`#${tx.blockNumber}`} testId="tx-block" />
            <Field label="Data e hora" value={formatDateTime(tx.confirmedAt)} testId="tx-time" />
            <Field label="De" value={tx.from} testId="tx-from" />
            <Field label="Para (contrato do marketplace)" value={tx.to} testId="tx-to" />
            <Field label="Valor" value={`${tx.valueEth} ETH`} testId="tx-value" />
            <Field label="Taxa de rede" value={`${tx.feeEth} ETH`} testId="tx-fee" />
          </dl>
        </section>
      )}
    </div>
  )
}
