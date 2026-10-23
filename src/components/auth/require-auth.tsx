import { Navigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/use-session'
import { getSafeRedirect } from '@/lib/redirect'
import { onSessionExpired } from '@/lib/session-token'
import type { User } from '@/types/auth'

/**
 * Protege uma tela: visitantes vão ao login e, depois de entrar, voltam para ela
 * (parâmetro `redirect`, com a página atual).
 */
export function RequireAuth({ children }: { children: (user: User) => ReactNode }) {
  const session = useSession()
  const href = useRouterState({ select: (state) => state.location.href })
  // O destino é fixado na primeira renderização: depois do redirecionamento o href já é o
  // do login e não pode virar o novo destino.
  const [redirect] = useState(() => getSafeRedirect(href))
  const expired = useRef(false)

  // Sessão expirada: quem leva ao login (com o aviso) é o AuthListener; aqui só não atrapalhamos.
  useEffect(
    () =>
      onSessionExpired(() => {
        expired.current = true
      }),
    [],
  )

  if (session.isPending) {
    return (
      <div
        role="status"
        aria-label="Verificando sessão"
        className="mx-auto w-full max-w-[1264px] px-6 py-12 md:px-8"
      >
        <Skeleton className="h-8 w-1/3" />
      </div>
    )
  }

  // Só quando não há sessão conhecida: uma releitura que falha não derruba quem já está dentro.
  if (session.isError && !session.data) {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-[1264px] flex-col items-center gap-4 px-6 py-16 text-center md:px-8">
        <p>Não foi possível verificar sua sessão.</p>
        <Button onClick={() => session.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  if (!session.data) {
    if (expired.current || href.startsWith('/login')) {
      return null
    }

    return <Navigate to="/login" search={redirect === '/' ? {} : { redirect }} replace />
  }

  return <>{children(session.data)}</>
}
