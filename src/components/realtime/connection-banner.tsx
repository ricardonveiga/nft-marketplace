import { useSocketStatus } from '@/lib/realtime/socket'

/** Aviso discreto enquanto a conexão em tempo real está fora; some sozinho ao reconectar. */
export function ConnectionBanner() {
  const { connected, attempted } = useSocketStatus()

  if (connected || !attempted) {
    return null
  }

  return (
    <p
      role="status"
      data-testid="connection-banner"
      className="bg-card px-4 py-1.5 text-center text-sm text-text-secondary print:hidden"
    >
      Sem conexão em tempo real. Tentando reconectar…
    </p>
  )
}
