import { HttpResponse, delay, http } from 'msw'
import type { ApiErrorBody } from '@/types/auth'
import type { Wallet, WalletsResponse } from '@/types/wallet'
import { authenticate } from './auth-handlers'
import { mockWallets, type MockWallet } from './fixtures/wallets'

const CONNECTION_PREFIX = 'mock-wallet-connection:'
const CONNECTION_DELAY_MS = 500

export function walletsOf(userId: string): MockWallet[] {
  return mockWallets.filter((wallet) => wallet.userId === userId)
}

export function readConnectedWalletId(userId: string): string | null {
  try {
    return window.localStorage.getItem(CONNECTION_PREFIX + userId)
  } catch {
    return null
  }
}

function writeConnectedWalletId(userId: string, walletId: string | null) {
  try {
    if (walletId) {
      window.localStorage.setItem(CONNECTION_PREFIX + userId, walletId)
    } else {
      window.localStorage.removeItem(CONNECTION_PREFIX + userId)
    }
  } catch {
    // Sem localStorage a conexão vale só até o próximo refresh.
  }
}

export function toPublicWallet({ id, label, address, networks, isPrimary }: MockWallet): Wallet {
  return { id, label, address, networks, isPrimary }
}

function error(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

export const walletsHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const body: WalletsResponse = {
      wallets: walletsOf(user.id).map(toPublicWallet),
      connectedWalletId: readConnectedWalletId(user.id),
    }

    return HttpResponse.json(body)
  }),

  // Simulação de conexão: demora um pouco e a carteira pode recusar.
  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    await delay(CONNECTION_DELAY_MS)

    const wallet = walletsOf(user.id).find((candidate) => candidate.id === params.id)

    if (!wallet) {
      return error(404, { code: 'wallet_not_found', message: 'Carteira não encontrada.' })
    }

    if (wallet.rejectsConnection) {
      return error(403, {
        code: 'wallet_rejected',
        message: 'A conexão foi recusada na carteira. Aprove o pedido de conexão e tente de novo.',
      })
    }

    writeConnectedWalletId(user.id, wallet.id)

    return HttpResponse.json({ connectedWalletId: wallet.id })
  }),

  http.delete('/api/wallets/connection', ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    writeConnectedWalletId(user.id, null)

    return HttpResponse.json({ connectedWalletId: null })
  }),
]
