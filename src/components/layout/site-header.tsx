import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import cartIcon from '@/assets/icons/cart.svg'
import loginIcon from '@/assets/icons/login.svg'
import { Button } from '@/components/ui/button'
import { SearchField } from './search-field'

type SiteHeaderProps = {
  cartItemCount?: number
}

const navItemClass =
  'relative flex h-full items-center text-base text-foreground transition-colors hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring'

const soonClass = `${navItemClass} cursor-not-allowed opacity-60 hover:text-foreground`

function NavLabel({ isActive, children }: { isActive: boolean; children: string }) {
  return (
    <>
      {children}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-primary"
        />
      )}
    </>
  )
}

export function SiteHeader({ cartItemCount = 0 }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      {/* Desktop */}
      <div className="mx-auto hidden h-[45px] w-full max-w-[1264px] items-stretch justify-between px-8 md:flex">
        <div className="flex w-40 items-center">
          <Link
            to="/"
            className="text-sm font-bold tracking-[1.4px] text-foreground"
          >
            KURIO
          </Link>
        </div>

        <nav aria-label="Principal" className="flex gap-10">
          <Link
            to="/"
            activeOptions={{ exact: true, includeHash: true }}
            activeProps={{ className: 'font-bold text-text-accent' }}
            className={navItemClass}
          >
            {({ isActive }) => <NavLabel isActive={isActive}>Início</NavLabel>}
          </Link>
          <Link
            to="/"
            hash="mercado"
            activeOptions={{ exact: true, includeHash: true }}
            activeProps={{ className: 'font-bold text-text-accent' }}
            className={navItemClass}
          >
            {({ isActive }) => <NavLabel isActive={isActive}>Mercado</NavLabel>}
          </Link>
          <span aria-disabled="true" title="Em breve" className={soonClass}>
            Criadores
          </span>
          <span aria-disabled="true" title="Em breve" className={soonClass}>
            Aprenda
          </span>
        </nav>

        <div className="flex items-center gap-7">
          <SearchField
            label="Buscar NFTs"
            placeholder="Buscar NFTs"
            className="h-[35px] w-[220px] rounded-md border border-border bg-card"
          />

          <button
            type="button"
            aria-label={
              cartItemCount > 0
                ? `Carrinho, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}`
                : 'Carrinho'
            }
            className="relative size-6 shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
          >
            <img src={cartIcon} alt="" className="size-6" />
            {cartItemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 left-[13px] grid size-5 place-items-center rounded-full border-2 border-background bg-primary text-tiny font-medium text-primary-foreground"
              >
                {cartItemCount}
              </span>
            )}
          </button>

          <Button className="h-[35px] w-[100px] gap-1 rounded-md px-0 text-base font-medium">
            <img src={loginIcon} alt="" className="size-5 object-contain" />
            Entrar
          </Button>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-2 px-6 py-4 md:hidden">
        <SearchField
          label="Explorar coleções"
          placeholder="Explorar coleções"
          className="h-[45px] flex-1 rounded-xl bg-card"
        />
        <button
          type="button"
          aria-label="Filtros"
          className="grid size-[45px] shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary to-surface-dark text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <SlidersHorizontal className="size-[22px]" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
