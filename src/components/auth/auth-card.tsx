import { Link, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useSession } from '@/hooks/use-session'

type AuthCardProps = {
  mode: 'login' | 'register'
  /** Caminho interno para onde voltar depois de entrar. */
  redirect: string
  expired?: boolean
  subtitle: string
  children: ReactNode
}

/**
 * Casca do modal de autenticação (Figma: "Sign In Modal", 500 px): abas
 * Entrar / Criar conta, texto de apoio, botão de fechar e faixa de destaque.
 */
export function AuthCard({ mode, redirect, expired, subtitle, children }: AuthCardProps) {
  const router = useRouter()
  const { data: user } = useSession()
  const search = redirect === '/' ? {} : { redirect }

  // Entrou (agora ou em outra aba): retoma o fluxo de onde o usuário veio.
  useEffect(() => {
    if (user) {
      router.history.replace(redirect)
    }
  }, [user, redirect, router])

  const activeClass = 'text-base text-text-accent'
  const idleClass =
    'text-base text-foreground/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

  return (
    <div className="relative mx-auto w-full max-w-[500px] overflow-hidden rounded-xl border-b-[10px] border-primary bg-card shadow-[0_0_30px_rgba(10,6,4,0.45)]">
      <button
        type="button"
        aria-label="Fechar e voltar"
        onClick={() => router.history.replace(redirect)}
        className="absolute top-3 right-3 grid size-[18px] place-items-center text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <X className="size-[18px]" aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center gap-10 px-6 pt-12">
        <div className="flex items-center gap-4">
          {mode === 'login' ? (
            <h1 className={activeClass}>Entrar</h1>
          ) : (
            <Link to="/login" search={search} className={idleClass}>
              Entrar
            </Link>
          )}
          <span aria-hidden="true" className="h-5 w-px bg-border-soft" />
          {mode === 'register' ? (
            <h1 className={activeClass}>Criar conta</h1>
          ) : (
            <Link to="/cadastro" search={search} className={idleClass}>
              Criar conta
            </Link>
          )}
        </div>
        <p className="max-w-[404px] text-center text-sm leading-4 text-text-secondary">
          {subtitle}
        </p>
      </div>

      {expired && (
        <p
          role="status"
          className="mx-auto mt-6 w-full max-w-[340px] px-6 text-center text-sm text-text-accent sm:px-0"
        >
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}

      {children}
    </div>
  )
}
