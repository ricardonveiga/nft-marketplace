import { HttpResponse, http } from 'msw'
import type { ApiErrorBody } from '@/types/auth'
import { authenticate } from './auth-handlers'
import { nfts } from './fixtures/nfts'
import { getScenario } from './scenario'

// Favoritos por usuário no localStorage (sobrevivem ao refresh e à troca de conta).
const PREFIX = 'mock-favorites:'

function read(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(PREFIX + userId)

    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function write(userId: string, ids: string[]) {
  try {
    window.localStorage.setItem(PREFIX + userId, JSON.stringify(ids))
  } catch {
    // Sem localStorage os favoritos valem só até o próximo refresh.
  }
}

function error(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

export const favoritesHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const user = authenticate(request)

    return user instanceof Response ? user : HttpResponse.json({ nftIds: read(user.id) })
  }),

  http.put('/api/favorites/:nftId', ({ request, params }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    // Cenário para testar falha de mutation e recuperação do estado.
    if (getScenario() === 'favorites-error') {
      return error(503, { code: 'unavailable', message: 'Serviço indisponível' })
    }

    const nftId = String(params.nftId)

    if (!nfts.some((nft) => nft.id === nftId)) {
      return error(404, { code: 'nft_not_found', message: 'NFT não encontrado.' })
    }

    const ids = read(user.id)
    const next = ids.includes(nftId) ? ids : [...ids, nftId]
    write(user.id, next)

    return HttpResponse.json({ nftIds: next })
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    if (getScenario() === 'favorites-error') {
      return error(503, { code: 'unavailable', message: 'Serviço indisponível' })
    }

    const next = read(user.id).filter((id) => id !== String(params.nftId))
    write(user.id, next)

    return HttpResponse.json({ nftIds: next })
  }),
]
