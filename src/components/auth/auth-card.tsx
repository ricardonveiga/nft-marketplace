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
  /** Altura mínima do modal no desktop (px): 600 no login, 654 no cadastro (Figma). */
  minHeight?: number
  children: ReactNode
}

/**
 * Casca do modal de autenticação (Figma: "Sign In Modal", 500 × 600; cadastro 500 × 656 com cantos de
 * 10 px): abas Entrar / Criar conta, texto de apoio, botão de fechar e faixa de destaque de 10 px na base.
 */
export function AuthCard({ mode, redirect, expired, subtitle, minHeight = 600, children }: AuthCardProps) {
  const router = useRouter()
  const { data: user } = useSession()
  const search = redirect === '/' ? {} : { redirect }

  // Entrou (agora ou em outra aba): retoma o fluxo de onde o usuário veio.
  useEffect(() => {
    if (user) {
      router.history.replace(redirect)
    }
  }, [user, redirect, router])

  const activeClass = 'text-[20px] leading-5 font-medium text-text-accent'
  const idleClass =
    'text-[20px] leading-5 font-medium text-foreground hover:text-text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

  return (
    <div
      style={{ minHeight }}
      className={`relative w-full border-b-[10px] border-primary bg-card max-md:!min-h-0 ${mode === 'register' ? 'overflow-hidden rounded-[10px]' : ''}`}
    >
      <button
        type="button"
        aria-label="Fechar e voltar"
        onClick={() => router.history.replace(redirect)}
        className="absolute top-2 right-[9px] grid size-6 place-items-center text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
      >
        <X className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center gap-10 px-6 pt-12">
        <div className="flex items-center gap-2">
          {mode === 'login' ? (
            <h1 className={activeClass}>Entrar</h1>
          ) : (
            <Link to="/login" search={search} className={idleClass}>
              Entrar
            </Link>
          )}
          <span aria-hidden="true" className="h-5 w-px bg-auth-divider" />
          {mode === 'register' ? (
            <h1 className={activeClass}>Criar conta</h1>
          ) : (
            <Link to="/cadastro" search={search} className={idleClass}>
              Criar conta
            </Link>
          )}
        </div>
        <p className="max-w-[404px] text-center text-[13px] leading-4">{subtitle}</p>
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
