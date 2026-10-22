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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">
        NFT Marketplace
      </h1>

      {isPending && (
        <p data-testid="health-status" className="text-neutral-500">
          Carregando status da API...
        </p>
      )}

      {isError && (
        <p data-testid="health-status" role="alert" className="text-red-600">
          Não foi possível conectar à API.
        </p>
      )}

      {data && (
        <p data-testid="health-status" className="text-neutral-700">
          API está{' '}
          <span className="font-medium text-green-600">{data.status}</span>
        </p>
      )}
    </main>
  )
}
