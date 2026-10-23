import type { QueryClient } from '@tanstack/react-query'
import type { Cart } from '@/types/cart'
import type { Nft, NftListResponse } from '@/types/nft'
import type { Order } from '@/types/order'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types/realtime'
import { pushNotice } from './notices'

// ---------------------------------------------------------------------------------------
// Regras para aplicar eventos sem regredir nem repetir efeitos:
// 1. um eventId já visto é ignorado (duplicata);
// 2. um evento com versão menor ou igual à que já se conhece do recurso é ignorado
//    (evento antigo, fora de ordem, ou dado que o REST já trouxe mais novo);
// 3. o evento traz o estado completo dos campos afetados, então aplicá-lo é idempotente.
// Só depois de passar pelas regras 1 e 2 há efeitos (patch do cache, releituras, avisos).
// ---------------------------------------------------------------------------------------

const MAX_SEEN_EVENTS = 500
const seenEventIds = new Set<string>()

function alreadySeen(eventId: string) {
  if (seenEventIds.has(eventId)) {
    return true
  }

  seenEventIds.add(eventId)

  if (seenEventIds.size > MAX_SEEN_EVENTS) {
    seenEventIds.delete(seenEventIds.values().next().value as string)
  }

  return false
}

/** Apenas para testes e depuração. */
export function resetSeenEvents() {
  seenEventIds.clear()
}

const knownNftVersions = new Map<string, number>()

// A lista do catálogo tem `facets`; o carrinho também tem `items`, mas com outro formato.
function isList(data: unknown): data is NftListResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as NftListResponse).items) &&
    'facets' in data
  )
}

function isNft(data: unknown, id: string): data is Nft {
  return typeof data === 'object' && data !== null && (data as Nft).id === id && 'version' in data
}

/** Percorre o que está no cache e aparenta ser o NFT `id` (listas, detalhe, destaque, carrinho). */
function forEachCachedNft(queryClient: QueryClient, id: string, visit: (nft: Nft) => void) {
  for (const query of queryClient.getQueryCache().getAll()) {
    const data = query.state.data

    if (isList(data)) {
      data.items.filter((item) => isNft(item, id)).forEach(visit)
    } else if (isNft(data, id)) {
      visit(data)
    } else if (typeof data === 'object' && data !== null && Array.isArray((data as Cart).items)) {
      ;(data as Cart).items.forEach((item) => {
        if (isNft(item.nft, id)) {
          visit(item.nft)
        }
      })
    }
  }
}

function knownVersion(queryClient: QueryClient, id: string) {
  let version = knownNftVersions.get(id) ?? 0

  forEachCachedNft(queryClient, id, (nft) => {
    version = Math.max(version, nft.version)
  })

  return version
}

function patchNft<T extends Nft>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.resource.id || nft.version >= event.version) {
    return nft
  }

  const { previousPriceEth: _previous, ...rest } = nft
  const { data } = event

  return {
    ...rest,
    ...(data.previousPriceEth ? { previousPriceEth: data.previousPriceEth } : {}),
    priceEth: data.priceEth,
    availability: data.availability,
    availableQuantity: data.availableQuantity,
    // Só o detalhe carrega o máximo por pedido.
    ...('maxQuantity' in nft ? { maxQuantity: data.maxQuantity } : {}),
    version: event.version,
  } as T
}

function patchCacheValue(data: unknown, event: NftUpdatedEvent): unknown {
  if (isList(data)) {
    return { ...data, items: data.items.map((item) => patchNft(item, event)) }
  }

  if (isNft(data, event.resource.id)) {
    return patchNft(data, event)
  }

  return data
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  if (alreadySeen(event.eventId)) {
    return
  }

  const id = event.resource.id

  if (event.version <= knownVersion(queryClient, id)) {
    return
  }

  // O NFT antes da mudança, para o aviso ("mudou de X para Y").
  let before: Nft | undefined
  forEachCachedNft(queryClient, id, (nft) => {
    before ??= nft
  })

  knownNftVersions.set(id, event.version)

  // Patch imediato do que está em cache (catálogo, detalhe, destaque)...
  queryClient.setQueriesData({ queryKey: ['nfts'] }, (data) => patchCacheValue(data, event))

  // ...e releitura do que depende de cálculo ou ordenação da API: listas (ordem, filtros e
  // contagens), destaque e hero (o mais caro pode ter mudado) e carrinho (subtotal, taxa, total).
  void queryClient.invalidateQueries({
    queryKey: ['nfts'],
    predicate: (query) =>
      query.queryKey[1] === 'featured' ||
      query.queryKey[1] === 'highlights' ||
      typeof query.queryKey[1] === 'object',
  })

  const cart = queryClient.getQueryData<Cart>(['cart'])

  if (cart?.items.some((item) => item.nft.id === id)) {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }

  if (!before) {
    return
  }

  const scope = { nftId: id }

  if (event.data.priceEth !== before.priceEth) {
    pushNotice(
      `${before.name}: o preço mudou de ${before.priceEth} ETH para ${event.data.priceEth} ETH.`,
      scope,
    )
  }

  if (before.availability !== event.data.availability) {
    pushNotice(
      event.data.availability === 'esgotado'
        ? `${before.name} esgotou.`
        : `${before.name} voltou a ter unidades disponíveis.`,
      scope,
    )
  }
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent) {
  if (alreadySeen(event.eventId)) {
    return
  }

  const key = ['orders', event.resource.id]
  const current = queryClient.getQueryData<Order>(key)

  // Pedido que esta aba nunca carregou: nada a atualizar (será lido quando abrir).
  if (!current || event.version <= current.version) {
    return
  }

  queryClient.setQueryData<Order>(key, {
    ...current,
    version: event.version,
    status: event.data.status,
    transactionHash: event.data.transactionHash,
    declineReason: event.data.declineReason,
  })

  pushNotice(
    event.data.status === 'confirmed'
      ? `Pagamento do pedido ${current.id} confirmado.`
      : `Pagamento do pedido ${current.id} recusado.`,
    { orderId: current.id },
  )
}

/** Depois de uma queda, os eventos perdidos não voltam: relê o que pode ter mudado. */
export function resyncAfterReconnect(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['nfts'] })
  void queryClient.invalidateQueries({ queryKey: ['cart'] })
  void queryClient.invalidateQueries({ queryKey: ['orders'] })
}
