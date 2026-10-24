import { HttpResponse, delay, http } from 'msw'
import { validateWallet } from '@/lib/validation'
import { MAX_WALLETS } from '@/lib/wallets'
import { NETWORKS } from '@/lib/catalog-search'
import type { ApiErrorBody } from '@/types/auth'
import type { NftNetwork } from '@/types/nft'
import type { Wallet, WalletInput, WalletsResponse, WalletUpdate } from '@/types/wallet'
import { authenticate } from './auth-handlers'
import type { MockWallet } from './fixtures/wallets'
import { nextWalletId, readWallets, writeWallets } from './wallets-store'

const CONNECTION_PREFIX = 'mock-wallet-connection:'
const CONNECTION_DELAY_MS = 500

export function walletsOf(userId: string): MockWallet[] {
  return readWallets(userId)
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

export function toPublicWallet({ userId: _userId, rejectsConnection: _rejects, ...wallet }: MockWallet): Wallet {
  return wallet
}

function error(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

function snapshot(userId: string): WalletsResponse {
  // A principal sempre vem primeiro.
  const wallets = [...walletsOf(userId)].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))

  return {
    wallets: wallets.map(toPublicWallet),
    connectedWalletId: readConnectedWalletId(userId),
  }
}

function sameAddress(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function parseNetworks(value: unknown): NftNetwork[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is NftNetwork => NETWORKS.includes(item as NftNetwork)))]
    : []
}

type WalletData = Omit<WalletInput, never>

function asText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

/** Lê o corpo da requisição; o que faltar (ou vier fora do tipo) vira vazio e falha na validação. */
function readInput(body: Partial<WalletInput> | null, base?: WalletData): WalletData {
  const pick = (field: keyof WalletData) => (body && field in body ? asText(body[field]) : base ? asText(base[field]) : '')

  return {
    displayName: pick('displayName').trim(),
    label: pick('label').trim(),
    profileName: pick('profileName').trim(),
    address: pick('address').trim(),
    secondary: pick('secondary').trim(),
    walletType: pick('walletType') as WalletData['walletType'],
    referralCode: pick('referralCode').trim(),
    email: pick('email').trim(),
    ensName: pick('ensName').trim().toLowerCase(),
    networks: body?.networks === undefined ? (base?.networks ?? []) : parseNetworks(body.networks),
  }
}

function validationError(data: WalletData) {
  const { networks, ...rest } = data
  const errors = validateWallet({ ...rest, network: networks[0] ?? '' })

  return Object.keys(errors).length > 0 ? error(422, { code: 'validation_error', errors }) : null
}

export const walletsHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const user = authenticate(request)

    return user instanceof Response ? user : HttpResponse.json(snapshot(user.id))
  }),

  // Cadastro: a primeira carteira vira a principal; a segunda, a secundária; não há uma terceira.
  http.post('/api/wallets', async ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const body = (await request.json().catch(() => null)) as Partial<WalletInput> | null
    const input = readInput(body)
    const invalid = validationError(input)

    if (invalid) {
      return invalid
    }

    const current = walletsOf(user.id)

    if (current.length >= MAX_WALLETS) {
      return error(409, {
        code: 'wallet_limit',
        message: 'Você já tem uma carteira principal e uma secundária. Remova uma para cadastrar outra.',
      })
    }

    if (current.some((wallet) => sameAddress(wallet.address, input.address))) {
      return error(409, {
        code: 'wallet_duplicate',
        message: 'Esta carteira já está cadastrada.',
        errors: { address: 'Esta carteira já está cadastrada.' },
      })
    }

    const wallet: MockWallet = {
      id: nextWalletId(),
      userId: user.id,
      ...input,
      isPrimary: current.length === 0,
    }
    writeWallets(user.id, [...current, wallet])

    return HttpResponse.json(snapshot(user.id), { status: 201 })
  }),

  // Edição: apelido, endereço, redes e/ou troca da principal.
  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const current = walletsOf(user.id)
    const target = current.find((wallet) => wallet.id === params.id)

    if (!target) {
      return error(404, { code: 'wallet_not_found', message: 'Carteira não encontrada.' })
    }

    const body = (await request.json().catch(() => null)) as WalletUpdate | null
    const next = readInput(body, target)
    const invalid = validationError(next)

    if (invalid) {
      return invalid
    }

    if (current.some((wallet) => wallet.id !== target.id && sameAddress(wallet.address, next.address))) {
      return error(409, {
        code: 'wallet_duplicate',
        message: 'Esta carteira já está cadastrada.',
        errors: { address: 'Esta carteira já está cadastrada.' },
      })
    }

    const makePrimary = body?.isPrimary === true

    writeWallets(
      user.id,
      current.map((wallet) => {
        if (wallet.id === target.id) {
          return {
            ...wallet,
            ...next,
            isPrimary: makePrimary || wallet.isPrimary,
          }
        }

        return makePrimary ? { ...wallet, isPrimary: false } : wallet
      }),
    )

    // Trocar o endereço invalida a conexão que existia com a carteira.
    if (
      readConnectedWalletId(user.id) === target.id &&
      !sameAddress(target.address, next.address)
    ) {
      writeConnectedWalletId(user.id, null)
    }

    return HttpResponse.json(snapshot(user.id))
  }),

  // Remoção: se era a principal, a outra assume; uma conexão com ela é encerrada.
  http.delete('/api/wallets/connection', ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    writeConnectedWalletId(user.id, null)

    return HttpResponse.json({ connectedWalletId: null })
  }),

  http.delete('/api/wallets/:id', ({ request, params }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const current = walletsOf(user.id)
    const target = current.find((wallet) => wallet.id === params.id)

    if (!target) {
      return error(404, { code: 'wallet_not_found', message: 'Carteira não encontrada.' })
    }

    const remaining = current.filter((wallet) => wallet.id !== target.id)

    if (target.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true }
    }

    writeWallets(user.id, remaining)

    if (readConnectedWalletId(user.id) === target.id) {
      writeConnectedWalletId(user.id, null)
    }

    return HttpResponse.json(snapshot(user.id))
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
]
