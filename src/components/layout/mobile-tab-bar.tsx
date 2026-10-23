import { Link } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingBag, User } from 'lucide-react'
import type { ReactNode } from 'react'

const idleClass = 'text-brand-secondary'

function SoonItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`${label} (em breve)`}
      title="Em breve"
      className={`grid size-10 cursor-not-allowed place-items-center rounded-md ${idleClass} opacity-70 focus-visible:outline-2 focus-visible:outline-ring`}
    >
      {children}
    </button>
  )
}

export function MobileTabBar() {
  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 h-[95px] rounded-t-[40px] border-t border-border bg-card px-8 pt-10 md:hidden"
    >
      <button
        type="button"
        aria-disabled="true"
        aria-label="Escanear (em breve)"
        title="Em breve"
        className="absolute top-0 left-1/2 grid size-[65px] -translate-x-1/2 -translate-y-1/2 cursor-not-allowed place-items-center rounded-full border-8 border-background bg-linear-to-br from-primary to-surface-dark text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ScanLine className="size-6" aria-hidden="true" />
      </button>

      <ul className="flex items-start justify-between">
        <li>
          <Link
            to="/"
            aria-label="Início"
            className="grid size-10 place-items-center rounded-md text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <House className="size-5 fill-current" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <SoonItem label="Favoritos">
            <Heart className="size-5 fill-current" aria-hidden="true" />
          </SoonItem>
        </li>
        <li aria-hidden="true" className="w-16" />
        <li>
          <SoonItem label="Carrinho">
            <ShoppingBag className="size-5 fill-current" aria-hidden="true" />
          </SoonItem>
        </li>
        <li>
          <SoonItem label="Perfil">
            <User className="size-5 fill-current" aria-hidden="true" />
          </SoonItem>
        </li>
      </ul>
    </nav>
  )
}
