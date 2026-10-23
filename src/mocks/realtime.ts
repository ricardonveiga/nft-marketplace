import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import {
  SOCKET_EVENTS,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
} from '@/types/realtime'
import { authenticate } from './auth-handlers'
import { nextEventId } from './catalog-state'
import { listOrders, SETTLE_AFTER_MS, type StoredOrder } from './orders-store'

/**
 * Servidor Socket.IO simulado na camada de rede (MSW + @mswjs/socket.io-binding).
 *
 * Transporte e limitações:
 * - o cliente real (socket.io-client) conecta por WebSocket (`transports: ['websocket']`):
 *   o MSW intercepta o WebSocket, não o long-polling HTTP;
 * - o binding simula o handshake do Engine.IO; este arquivo envia os pings de
 *   keep-alive (senão o cliente derrubaria a conexão por "ping timeout");
 * - sem namespaces, salas e acks: a assinatura de pedidos é um evento da aplicação
 *   (`orders.subscribe`) e a "sala" do usuário é uma lista mantida aqui;
 * - o `socket.io-client` precisa ser importado DEPOIS de o MSW instalar a interceptação
 *   (o Engine.IO guarda o WebSocket nativo ao ser carregado): ver lib/realtime/socket.ts;
 * - o servidor vive na página: recarregar a página derruba o servidor e os timers.
 */

type Connection = {
  io: ReturnType<typeof toSocketIo>
  close: () => void
  userId: string | null
}

const PING_INTERVAL_MS = 20_000

const connections = new Set<Connection>()
let offline = false
let lastEvent: NftUpdatedEvent | OrderUpdatedEvent | null = null

// O MSW remove o prefixo "/socket.io/" da URL do cliente antes de comparar, então o padrão é
// só a origem. Isso também pegaria outros WebSockets da página (como o HMR do Vite em
// desenvolvimento): por isso a conexão só é tratada aqui se for do Engine.IO (parâmetro EIO).
const socketLink = ws.link('*')

function userIdFromToken(token: unknown) {
  if (typeof token !== 'string') {
    return null
  }

  const result = authenticate(
    new Request('http://mock.local/', { headers: { Authorization: `Bearer ${token}` } }),
  )

  return result instanceof Response ? null : result.id
}

export const realtimeHandlers = [
  socketLink.addEventListener('connection', (rawConnection) => {
    if (!rawConnection.client.url.searchParams.has('EIO')) {
      // Não é Socket.IO: segue para o servidor real, sem interferência.
      rawConnection.server.connect()

      return
    }

    // "Fora do ar": a conexão abre e cai logo em seguida, como um servidor indisponível.
    if (offline) {
      rawConnection.client.close()

      return
    }

    const io = toSocketIo(rawConnection)
    const connection: Connection = {
      io,
      close: () => rawConnection.client.close(),
      userId: null,
    }
    connections.add(connection)

    // Keep-alive do Engine.IO: o servidor envia "2" (ping) e o cliente responde "3" (pong).
    const pingTimer = window.setInterval(() => rawConnection.client.send('2'), PING_INTERVAL_MS)

    rawConnection.client.addEventListener('close', () => {
      window.clearInterval(pingTimer)
      connections.delete(connection)
    })

    io.client.on(SOCKET_EVENTS.subscribeOrders, (_event, payload: { token?: string } | undefined) => {
      connection.userId = userIdFromToken(payload?.token)
    })

    io.client.on(SOCKET_EVENTS.unsubscribeOrders, () => {
      connection.userId = null
    })
  }),
]

export function emitNftUpdated(event: NftUpdatedEvent) {
  lastEvent = event
  connections.forEach((connection) => connection.io.client.emit(SOCKET_EVENTS.nftUpdated, event))
}

export function emitOrderUpdated(userId: string, event: OrderUpdatedEvent) {
  lastEvent = event
  connections.forEach((connection) => {
    if (connection.userId === userId) {
      connection.io.client.emit(SOCKET_EVENTS.orderUpdated, event)
    }
  })
}

/** Reenvia um evento tal como está (mesmo eventId): simula duplicatas e eventos fora de ordem. */
export function replay(event: NftUpdatedEvent | OrderUpdatedEvent) {
  if (event.type === 'nft.updated') {
    connections.forEach((connection) => connection.io.client.emit(SOCKET_EVENTS.nftUpdated, event))
  } else {
    connections.forEach((connection) => connection.io.client.emit(SOCKET_EVENTS.orderUpdated, event))
  }
}

export function getLastEvent() {
  return lastEvent
}

export function disconnectAll() {
  connections.forEach((connection) => connection.close())
}

export function setOffline(value: boolean) {
  offline = value

  if (value) {
    disconnectAll()
  }
}

export function connectionsInfo() {
  return [...connections].map((connection) => ({ userId: connection.userId }))
}

export function orderUpdatedEvent(order: StoredOrder): OrderUpdatedEvent {
  return {
    eventId: nextEventId('ord'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    data: {
      status: order.status,
      transactionHash: order.transactionHash,
      declineReason: order.declineReason,
    },
  }
}

/**
 * Quando o prazo do pedido passa, o "processador de pagamento" decide e avisa o dono pelo
 * socket. Se a página recarregar antes, o timer se perde, mas o pedido é decidido na leitura
 * seguinte (REST) e a retomada acontece pela releitura depois da reconexão.
 */
export function scheduleOrderSettlement(userId: string, orderId: string) {
  window.setTimeout(() => {
    const settled = listOrders(userId).find((order) => order.id === orderId)

    if (settled && settled.status !== 'pending') {
      emitOrderUpdated(userId, orderUpdatedEvent(settled))
    }
  }, SETTLE_AFTER_MS + 50)
}
