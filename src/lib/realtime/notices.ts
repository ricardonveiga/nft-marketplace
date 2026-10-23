import { useSyncExternalStore } from 'react'

export type RealtimeNotice = {
  id: number
  text: string
  createdAt: number
  /** A que a mudança se refere; as telas só mostram o que lhes diz respeito. */
  scope: { nftId?: string; orderId?: string }
}

let notices: readonly RealtimeNotice[] = []
let counter = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function pushNotice(text: string, scope: RealtimeNotice['scope']) {
  counter += 1
  notices = [...notices.slice(-9), { id: counter, text, createdAt: Date.now(), scope }]
  emit()
}

export function dismissNotice(id: number) {
  notices = notices.filter((notice) => notice.id !== id)
  emit()
}

export function useNotices() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    () => notices,
  )
}
