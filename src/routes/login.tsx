import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/login-form'
import { getSafeRedirect } from '@/lib/redirect'

type LoginSearch = {
  /** Página para onde voltar depois de entrar. */
  redirect?: string
  reason?: 'expired'
}

export const Route = createFileRoute('/login')({
  // As chaves ausentes precisam ser `undefined` explícito: o roteador herda os
  // search params crus da rota pai, e um `redirect` malicioso sobreviveria.
  validateSearch: (raw: Record<string, unknown>): LoginSearch => {
    const redirect = getSafeRedirect(raw.redirect)

    return {
      redirect: redirect !== '/' ? redirect : undefined,
      reason: raw.reason === 'expired' ? 'expired' : undefined,
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect, reason } = Route.useSearch()

  return (
    <div className="mx-auto w-full max-w-[1264px] px-4 py-10 md:px-8 md:py-16">
      <LoginForm
        redirect={getSafeRedirect(redirect)}
        expired={reason === 'expired'}
      />
    </div>
  )
}
