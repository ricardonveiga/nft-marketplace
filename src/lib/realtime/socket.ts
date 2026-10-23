import { useSyncExternalStore } from 'react'
import type { Socket } from 'socket.io-client'

let socketPromise: Promise<Socket> | null = null

/**
 * Cliente Socket.IO único da aplicação, criado sob demanda.
 *
 * O `socket.io-client` é importado dinamicamente de propósito: o Engine.IO guarda o
 * `WebSocket` nativo no momento em que o módulo é carregado, e o MSW só consegue interceptar
 * a conexão se ela usar o WebSocket que ele instalou (depois do `worker.start()`). Importar
 * aqui, só quando o provedor de tempo real monta, garante essa ordem — e ainda tira o
 * cliente do pacote inicial. Só usa WebSocket (o MSW não intercepta o long-polling).
 */
export function getSocket() {
  socketPromise ??= import('socket.io-client').then(({ io }) =>
    io({
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      // Tentativas contra um servidor indisponível falham em 3 s (o padrão é 20 s), para a
      // reconexão não demorar quando ele voltar.
      timeout: 3000,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      randomizationFactor: 0,
    }),
  )

  return socketPromise
}

// Estado da conexão para a interface (aviso de "sem conexão" e polling de reserva).
type Status = { connected: boolean; attempted: boolean }

let status: Status = { connected: false, attempted: false }
const listeners = new Set<() => void>()

export function setSocketStatus(next: Partial<Status>) {
  const merged = { ...status, ...next }

  if (merged.connected === status.connected && merged.attempted === status.attempted) {
    return
  }

  status = merged
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function useSocketStatus() {
  return useSyncExternalStore(subscribe, () => status)
}
