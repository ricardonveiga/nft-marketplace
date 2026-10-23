import { HttpResponse, delay, http } from 'msw'
import { getScenario } from './scenario'

/**
 * Efeitos de rede dos cenários, aplicados a TODA a API (menos o health check) por um único
 * handler que roda antes dos handlers de cada rota: ele atrasa ou derruba a requisição e,
 * quando não responde por conta própria, deixa o handler da rota seguir normalmente.
 *
 *  - slow              toda resposta demora SLOW_MS
 *  - variable-latency  a latência segue um ciclo fixo (ver abaixo): uma resposta antiga pode
 *                      chegar depois de uma mais nova, de forma reproduzível
 *  - request-timeout   o servidor nunca responde; quem encerra é o timeout do cliente (Axios)
 *  - network-error     a conexão cai (erro de rede, sem resposta HTTP)
 *  - forbidden         recursos privados respondem 403 a quem está autenticado
 *  - transient-failure a 1ª tentativa de cada requisição falha com 503; a repetição funciona
 *  - error             tudo responde 500
 */
export const SLOW_MS = 1200

// Ciclo de latência por requisição (ms): a 1ª é lenta e a 2ª rápida, então uma busca antiga
// termina depois da nova, e assim por diante.
export const VARIABLE_LATENCY_CYCLE_MS = [900, 60, 500, 30] as const

const PRIVATE_PREFIXES = ['/api/wallets', '/api/orders', '/api/profile', '/api/favorites']

let sequence = 0
const failedOnce = new Set<string>()

export function resetScenarioState() {
  sequence = 0
  failedOnce.clear()
}

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

export const scenarioHandlers = [
  http.all('/api/*', async ({ request }) => {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') {
      return undefined
    }

    switch (getScenario()) {
      case 'slow':
        await delay(SLOW_MS)

        return undefined

      case 'variable-latency':
        await delay(VARIABLE_LATENCY_CYCLE_MS[sequence++ % VARIABLE_LATENCY_CYCLE_MS.length])

        return undefined

      case 'request-timeout':
        await delay('infinite')

        return undefined

      case 'network-error':
        return HttpResponse.error()

      case 'forbidden':
        if (
          request.headers.has('Authorization') &&
          PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
        ) {
          return errorResponse(403, 'forbidden', 'Você não tem permissão para acessar este recurso.')
        }

        return undefined

      case 'transient-failure': {
        const key = `${request.method} ${request.url}`

        if (!failedOnce.has(key)) {
          failedOnce.add(key)

          return errorResponse(503, 'service_unavailable', 'Serviço temporariamente indisponível.')
        }

        return undefined
      }

      case 'error':
        return errorResponse(500, 'internal_error', 'Erro interno do servidor.')

      default:
        return undefined
    }
  }),
]
