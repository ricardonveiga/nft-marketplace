import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

type HealthResponse = {
  status: string
}

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health')

      if (typeof response.data?.status !== 'string') {
        throw new Error('Resposta da API de saúde fora do formato esperado')
      }

      return response.data
    },
  })

  return (
    <section className="flex flex-col items-center justify-center gap-4 p-6 py-24 text-center">
      <h1 className="text-2xl">NFT Marketplace</h1>

      {isPending && (
        <p data-testid="health-status" className="text-muted-foreground">
          Carregando status da API...
        </p>
      )}

      {isError && (
        <p data-testid="health-status" role="alert" className="text-destructive">
          Não foi possível conectar à API.
        </p>
      )}

      {data && (
        <p data-testid="health-status" className="text-foreground">
          API está{' '}
          <span className="font-medium text-primary">{data.status}</span>
        </p>
      )}
    </section>
  )
}
