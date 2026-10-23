import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { SESSION_QUERY_KEY, clearPrivateData } from '@/hooks/use-session'
import { getSafeRedirect } from '@/lib/redirect'
import {
  clearSessionToken,
  getSessionToken,
  onSessionExpired,
} from '@/lib/session-token'

/**
 * Cuida da sessão fora das telas:
 * - quando a API diz que a sessão expirou, limpa tudo e leva ao login, guardando
 *   a página atual em `redirect` para retomar de onde parou;
 * - a cada navegação, reconfirma a sessão (expiração durante a navegação).
 */
export function AuthListener() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const firstRender = useRef(true)

  useEffect(
    () =>
      onSessionExpired(() => {
        const wasSignedIn = Boolean(queryClient.getQueryData(SESSION_QUERY_KEY))

        clearSessionToken()
        clearPrivateData(queryClient)
        queryClient.setQueryData(SESSION_QUERY_KEY, null)

        const { pathname: currentPath, href } = router.state.location

        // Token vencido no carregamento da página: só descarta, sem interromper a navegação.
        if (!wasSignedIn || currentPath === '/login') {
          return
        }

        const redirect = getSafeRedirect(href)

        void router.navigate({
          to: '/login',
          search: redirect === '/' ? { reason: 'expired' } : { redirect, reason: 'expired' },
          replace: true,
        })
      }),
    [queryClient, router],
  )

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false

      return
    }

    if (getSessionToken()) {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    }
  }, [pathname, queryClient])

  return null
}
