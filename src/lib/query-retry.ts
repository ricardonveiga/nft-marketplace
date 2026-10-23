import { isAxiosError } from 'axios'

/**
 * Nova tentativa automática só para falhas transitórias: sem resposta (queda de conexão ou
 * timeout) ou 502/503/504. Erros que repetir não resolve (401, 403, 404, 409, 422, 500) vão
 * direto para a tela. Sem resposta tenta mais uma vez (cada tentativa já custou o timeout).
 */
export function shouldRetry(failureCount: number, error: unknown) {
  if (!isAxiosError(error)) {
    return false
  }

  const status = error.response?.status

  if (status === undefined) {
    return failureCount < 1
  }

  return [502, 503, 504].includes(status) && failureCount < 2
}

export function retryDelay(attempt: number) {
  return Math.min(300 * 2 ** attempt, 2000)
}
