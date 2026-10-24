import type { ReactNode } from 'react'
import { HomeContent } from '@/components/home/home-content'

/**
 * Login e cadastro (Figma: "Sign In Modal"): a Início fica atrás, sem escurecer, e o modal de
 * 500 px aparece por cima, a 160 px do topo. O fundo é só cenário: `inert` e escondido de leitores
 * de tela, para o foco e a leitura ficarem no modal.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div aria-hidden="true" inert>
        <HomeContent />
      </div>
      <div className="fixed top-6 left-1/2 z-[60] max-h-[calc(100dvh-3rem)] w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 overflow-y-auto md:top-40">
        {children}
      </div>
    </>
  )
}
