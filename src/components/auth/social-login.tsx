import type { ReactNode } from 'react'
import { FacebookMark, GoogleMark } from './social-icons'

function SocialButton({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Em breve"
      onClick={(event) => event.preventDefault()}
      className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-[2px] border border-border text-[13px] font-medium text-text-secondary"
    >
      {icon}
      {children}
    </button>
  )
}

/**
 * "Ou continue com" + Google e Facebook (Figma, login e cadastro). Login social está fora do
 * escopo: os botões aparecem como no frame, mas ficam inertes, sem aparentar sucesso.
 */
/** `roomy`: o cadastro tem os botões 4 px mais abaixo e 16 px entre eles (Figma). */
export function SocialLogin({ roomy = false }: { roomy?: boolean }) {
  return (
    <div className="pb-8">
      <div role="separator" className="mt-[23px] flex items-center gap-3 text-[13px] leading-4">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        Ou continue com
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <div
        className={`mx-auto flex w-full max-w-[340px] flex-col px-6 sm:px-0 ${roomy ? 'mt-[17px] gap-4' : 'mt-[13px] gap-3'}`}
      >
        <SocialButton icon={<GoogleMark />}>Continuar com Google</SocialButton>
        <SocialButton icon={<FacebookMark />}>Continuar com Facebook</SocialButton>
      </div>
    </div>
  )
}
