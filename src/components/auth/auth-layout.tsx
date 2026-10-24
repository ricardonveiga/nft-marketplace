import type { CSSProperties, ReactNode } from 'react'
import { HomeContent } from '@/components/home/home-content'

/**
 * Login e cadastro (Figma: "Sign In Modal"): a Início fica atrás, sem escurecer, e o modal de
 * 500 px aparece por cima, a 160 px do topo. O fundo é só cenário: `inert` e escondido de leitores
 * de tela, para o foco e a leitura ficarem no modal.
 */
export function AuthLayout({ children, top = 160 }: { children: ReactNode; top?: number }) {
  return (
    <>
      <div aria-hidden="true" inert className="max-md:hidden">
        <HomeContent />
      </div>
      <div
        style={{ '--auth-top': `${top}px` } as CSSProperties}
        className="fixed top-6 left-1/2 z-[60] max-h-[calc(100dvh-3rem)] w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 overflow-y-auto max-md:inset-0 max-md:max-h-none max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:bg-background md:top-[var(--auth-top)]"
      >
        {children}
      </div>
    </>
  )
}
