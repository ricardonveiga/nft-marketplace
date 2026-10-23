import { compareEth } from '@/lib/eth'
import type { Nft } from '@/types/nft'
import type { NftState, NftUpdatedEvent } from '@/types/realtime'
import { nfts as baseNfts } from './fixtures/nfts'
import { MAX_QUANTITY_PER_ORDER } from './limits'

// Estado mutável do catálogo simulado. Tanto as respostas REST quanto os eventos do
// Socket.IO leem DAQUI, então nunca divergem. Persiste no localStorage (sobrevive ao
// refresh); resetCatalogState() volta ao cenário conhecido (as fixtures originais).
const STORAGE_KEY = 'mock-nft-state'

type Override = {
  version: number
  priceEth?: string
  previousPriceEth?: string | null
  availableQuantity?: number
}

export type NftChanges = {
  priceEth?: string
  availableQuantity?: number
}

function readOverrides(): Record<string, Override> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    return raw ? (JSON.parse(raw) as Record<string, Override>) : {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides: Record<string, Override>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // Sem localStorage as mudanças valem só até o próximo refresh.
  }
}

function applyOverride(base: Nft, override: Override | undefined): Nft {
  if (!override) {
    return base
  }

  const availableQuantity = override.availableQuantity ?? base.availableQuantity
  const previousPriceEth =
    override.previousPriceEth === undefined ? base.previousPriceEth : (override.previousPriceEth ?? undefined)
  const { previousPriceEth: _base, ...rest } = base

  return {
    ...rest,
    ...(previousPriceEth ? { previousPriceEth } : {}),
    priceEth: override.priceEth ?? base.priceEth,
    availableQuantity,
    availability: availableQuantity === 0 ? 'esgotado' : 'disponivel',
    version: override.version,
  }
}

export function currentNfts(): Nft[] {
  const overrides = readOverrides()

  return baseNfts.map((nft) => applyOverride(nft, overrides[nft.id]))
}

export function currentNft(id: string | undefined): Nft | undefined {
  return currentNfts().find((nft) => nft.id === id)
}

export function maxQuantityFor(nft: Nft) {
  return Math.min(MAX_QUANTITY_PER_ORDER, nft.availableQuantity)
}

export function nftState(nft: Nft): NftState {
  return {
    priceEth: nft.priceEth,
    previousPriceEth: nft.previousPriceEth ?? null,
    availability: nft.availability,
    availableQuantity: nft.availableQuantity,
    maxQuantity: maxQuantityFor(nft),
  }
}

/**
 * Altera preço e/ou estoque de um NFT e sobe sua versão. Devolve o NFT novo, ou
 * undefined se o id não existe. Preço mais baixo guarda o anterior (desconto).
 */
export function updateNftState(id: string, changes: NftChanges): Nft | undefined {
  const current = currentNft(id)

  if (!current) {
    return undefined
  }

  const overrides = readOverrides()
  const next: Override = { ...overrides[id], version: current.version + 1 }

  if (changes.priceEth !== undefined) {
    next.priceEth = changes.priceEth
    next.previousPriceEth =
      compareEth(changes.priceEth, current.priceEth) < 0 ? current.priceEth : null
  }

  if (changes.availableQuantity !== undefined) {
    next.availableQuantity = Math.max(0, Math.floor(changes.availableQuantity))
  }

  writeOverrides({ ...overrides, [id]: next })

  return currentNft(id)
}

export function resetCatalogState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada a limpar.
  }
}

let sequence = 0

export function nextEventId(prefix: string) {
  sequence += 1

  return `${prefix}-${Date.now().toString(36)}-${sequence}`
}

export function nftUpdatedEvent(nft: Nft): NftUpdatedEvent {
  return {
    eventId: nextEventId('nft'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: nftState(nft),
  }
}
