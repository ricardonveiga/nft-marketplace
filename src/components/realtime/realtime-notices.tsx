import { X } from 'lucide-react'
import { useRef } from 'react'
import { dismissNotice, useNotices } from '@/lib/realtime/notices'

type RealtimeNoticesProps = {
  /** Mostra avisos de mudança de preço/disponibilidade destes NFTs. */
  nftIds?: readonly string[]
  /** Mostra avisos sobre este pedido. */
  orderId?: string
}

/**
 * Avisos de mudanças em tempo real que dizem respeito à tela atual. É uma região
 * `role="status"` (anunciada por leitores de tela) e também aparece na tela.
 * Só mostra o que chegou depois de a tela abrir, para não exibir avisos antigos.
 */
export function RealtimeNotices({ nftIds, orderId }: RealtimeNoticesProps) {
  const openedAt = useRef(Date.now())
  const notices = useNotices().filter(
    (notice) =>
      notice.createdAt >= openedAt.current &&
      ((notice.scope.nftId && nftIds?.includes(notice.scope.nftId)) ||
        (notice.scope.orderId && notice.scope.orderId === orderId)),
  )

  return (
    <div role="status" data-testid="realtime-notices" className="flex flex-col gap-2 empty:hidden">
      {notices.map((notice) => (
        <p
          key={notice.id}
          data-testid="realtime-notice"
          className="flex items-start justify-between gap-3 rounded-md bg-card px-4 py-3 text-sm text-text-accent"
        >
          <span>{notice.text}</span>
          <button
            type="button"
            aria-label="Dispensar aviso"
            onClick={() => dismissNotice(notice.id)}
            className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </p>
      ))}
    </div>
  )
}
