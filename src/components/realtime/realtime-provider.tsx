import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSession } from '@/hooks/use-session'
import {
  applyNftUpdated,
  applyOrderUpdated,
  resyncAfterReconnect,
} from '@/lib/realtime/apply-events'
import { getSocket, setSocketStatus } from '@/lib/realtime/socket'
import { getSessionToken } from '@/lib/session-token'
import { SOCKET_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/types/realtime'

/**
 * Liga o cliente Socket.IO ao cache do TanStack Query.
 * - `nft.updated` (público) atualiza preço e disponibilidade no catálogo, detalhe e carrinho;
 * - `order.updated` chega só para o dono do pedido (assinatura feita com o token da sessão);
 * - ao trocar de usuário/sair, a assinatura anterior é cancelada;
 * - ao reconectar depois de uma queda, o que pode ter mudado é relido.
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient()
  const { data: user } = useSession()
  const userId = user?.id ?? null
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  useEffect(() => {
    let cancelled = false
    let teardown: (() => void) | undefined

    void getSocket().then((socket) => {
      if (cancelled) {
        return
      }

      let hasConnected = false

      function subscribeOrders() {
        const token = getSessionToken()

        if (userIdRef.current && token) {
          socket.emit(SOCKET_EVENTS.subscribeOrders, { token })
        }
      }

      function onConnect() {
        setSocketStatus({ connected: true, attempted: true })
        subscribeOrders()

        if (hasConnected) {
          resyncAfterReconnect(queryClient)
        }

        hasConnected = true
      }

      function onDisconnect() {
        setSocketStatus({ connected: false, attempted: true })
      }

      function onNftUpdated(event: NftUpdatedEvent) {
        applyNftUpdated(queryClient, event)
      }

      function onOrderUpdated(event: OrderUpdatedEvent) {
        applyOrderUpdated(queryClient, event)
      }

      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)
      socket.on('connect_error', onDisconnect)
      socket.on(SOCKET_EVENTS.nftUpdated, onNftUpdated)
      socket.on(SOCKET_EVENTS.orderUpdated, onOrderUpdated)
      socket.connect()

      teardown = () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
        socket.off('connect_error', onDisconnect)
        socket.off(SOCKET_EVENTS.nftUpdated, onNftUpdated)
        socket.off(SOCKET_EVENTS.orderUpdated, onOrderUpdated)
        socket.disconnect()
        setSocketStatus({ connected: false })
      }
    })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [queryClient])

  // Troca de usuário ou logout: cancela a assinatura da sessão anterior e assina a nova.
  useEffect(() => {
    let cancelled = false

    void getSocket().then((socket) => {
      if (cancelled || !socket.connected) {
        return
      }

      socket.emit(SOCKET_EVENTS.unsubscribeOrders)

      const token = getSessionToken()

      if (userId && token) {
        socket.emit(SOCKET_EVENTS.subscribeOrders, { token })
      }
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  return null
}
