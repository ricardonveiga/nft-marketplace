import { Link, useRouterState } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import cartIcon from '@/assets/icons/cart.svg'
import loginIcon from '@/assets/icons/login.svg'
import { AccountMenu } from '@/components/auth/account-menu'
import { useFiltersDrawer } from '@/components/catalog/filters-drawer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart } from '@/hooks/use-cart'
import { useCatalogSearch } from '@/hooks/use-catalog-search'
import { useSession } from '@/hooks/use-session'
import { getSafeRedirect } from '@/lib/redirect'
import { getSessionToken } from '@/lib/session-token'
import { SearchField } from './search-field'

const navItemClass =
  'relative flex h-full items-center text-base text-foreground transition-colors hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring'

const soonClass = `${navItemClass} hidden cursor-not-allowed opacity-60 hover:text-foreground lg:flex`

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

export function SiteHeader() {
  const { search, update } = useCatalogSearch()
  const { openFilters } = useFiltersDrawer()
  const onHome = useRouterState({ select: (state) => state.location.pathname === '/' })
  const currentHref = useRouterState({ select: (state) => state.location.href })
  const session = useSession()
  const cartItemCount = useCart().data?.itemCount ?? 0
  const redirect = getSafeRedirect(currentHref)

  function handleSearch(query: string) {
    update({ q: query.trim() || undefined })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      {/* Desktop */}
      <div className="mx-auto hidden h-[45px] w-full max-w-[1264px] items-stretch justify-between px-8 md:flex">
        <div className="flex items-center lg:w-40">
          <Link
            to="/"
            className="text-sm font-bold tracking-[1.4px] text-foreground"
          >
            KURIO
          </Link>
        </div>

        <nav aria-label="Principal" className="flex gap-6 lg:gap-10">
          <Link
            to="/"
            activeOptions={{ exact: true, includeHash: true, includeSearch: false }}
            activeProps={{ className: 'font-bold text-text-accent' }}
            className={navItemClass}
          >
            {({ isActive }) => <NavLabel isActive={isActive}>Início</NavLabel>}
          </Link>
          <Link
            to="/"
            hash="mercado"
            activeOptions={{ exact: true, includeHash: true, includeSearch: false }}
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

        <div className="flex items-center gap-4 lg:gap-7">
          <SearchField
            key={`desktop-${search.q ?? ''}`}
            label="Buscar NFTs"
            placeholder="Buscar NFTs"
            defaultValue={search.q}
            onSearch={handleSearch}
            className="h-[35px] w-[170px] rounded-md border border-border bg-card lg:w-[220px]"
          />

          <Link
            to="/carrinho"
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
          </Link>

          {session.data ? (
            <AccountMenu user={session.data} variant="header" />
          ) : session.isPending && getSessionToken() ? (
            <Skeleton className="h-[35px] w-[100px] rounded-md" />
          ) : (
            <Button
              asChild
              className="h-[35px] w-[100px] gap-1 rounded-md px-0 text-base font-medium"
            >
              <Link
                to="/login"
                search={redirect === '/' ? {} : { redirect }}
              >
                <img src={loginIcon} alt="" className="size-5 object-contain" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-2 px-6 py-4 md:hidden">
        <SearchField
          key={`mobile-${search.q ?? ''}`}
          label="Explorar coleções"
          placeholder="Explorar coleções"
          defaultValue={search.q}
          onSearch={handleSearch}
          className="h-[45px] flex-1 rounded-xl bg-card"
        />
        {onHome && (
        <button
          type="button"
          aria-label="Filtros"
          onClick={openFilters}
          className="grid size-[45px] shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary to-surface-dark text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <SlidersHorizontal className="size-[22px]" aria-hidden="true" />
        </button>
        )}
      </div>
    </header>
  )
}
