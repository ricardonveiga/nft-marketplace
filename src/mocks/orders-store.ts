import type { Order } from '@/types/order'
import { deleteCart } from './cart-store'
import { getScenario } from './scenario'

// Pedidos, chaves de idempotência e contador no localStorage: sobrevivem ao refresh.
const ORDERS_PREFIX = 'mock-orders:'
const IDEMPOTENCY_PREFIX = 'mock-idempotency:'
const SEQUENCE_KEY = 'mock-order-seq'

/** Tempo até o "processador de pagamento" simulado decidir o pedido. */
export const SETTLE_AFTER_MS = 1200

export type StoredOrder = Order & { settleAt: number }

type IdempotencyRecord = { hash: string; orderId: string }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)

    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem localStorage os pedidos valem só até o próximo refresh.
  }
}

export function nextOrderId() {
  const next = readJson<number>(SEQUENCE_KEY, 0) + 1
  writeJson(SEQUENCE_KEY, next)

  return `KUR-${String(next).padStart(6, '0')}`
}

export function readIdempotency(userId: string, key: string) {
  return readJson<Record<string, IdempotencyRecord>>(IDEMPOTENCY_PREFIX + userId, {})[key]
}

export function saveIdempotency(userId: string, key: string, record: IdempotencyRecord) {
  const all = readJson<Record<string, IdempotencyRecord>>(IDEMPOTENCY_PREFIX + userId, {})
  writeJson(IDEMPOTENCY_PREFIX + userId, { ...all, [key]: record })
}

export function saveOrder(userId: string, order: StoredOrder) {
  const orders = readJson<StoredOrder[]>(ORDERS_PREFIX + userId, [])
  writeJson(ORDERS_PREFIX + userId, [...orders.filter((item) => item.id !== order.id), order])
}

/** Hash de 64 caracteres hexadecimais, determinístico (referência de transação simulada). */
function fakeTransactionHash(seed: string) {
  let state = 2166136261
  let hex = ''

  while (hex.length < 64) {
    for (const char of seed + hex.length) {
      state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0
    }
    hex += state.toString(16).padStart(8, '0')
  }

  return `0x${hex.slice(0, 64)}`
}

/**
 * Lista os pedidos do usuário já decidindo os que passaram do prazo:
 * pagamento confirmado (o carrinho é esvaziado) ou recusado (o carrinho fica como está).
 */
export function listOrders(userId: string): StoredOrder[] {
  const orders = readJson<StoredOrder[]>(ORDERS_PREFIX + userId, [])
  let changed = false

  const settled = orders.map((order) => {
    if (order.status !== 'pending' || order.settleAt > Date.now()) {
      return order
    }

    changed = true

    if (getScenario() === 'payment-declined') {
      return {
        ...order,
        status: 'declined' as const,
        declineReason: 'Pagamento recusado pela rede. Nenhum valor foi cobrado.',
      }
    }

    deleteCart(`user:${userId}`)

    return {
      ...order,
      status: 'confirmed' as const,
      transactionHash: fakeTransactionHash(order.id),
    }
  })

  if (changed) {
    writeJson(ORDERS_PREFIX + userId, settled)
  }

  return settled
}

export function toPublicOrder({ settleAt: _settleAt, ...order }: StoredOrder): Order {
  return order
}
