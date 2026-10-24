import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import searchIcon from '@/assets/icons/search.svg'
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

const soonClass = `${navItemClass} hidden cursor-not-allowed hover:text-foreground lg:flex`

function NavLabel({ isActive, children }: { isActive: boolean; children: string }) {
  return (
    <>
      {children}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-[42px] h-[3px] bg-primary"
        />
      )}
    </>
  )
}

/**
 * Busca do cabeçalho desktop: no Figma é só o ícone (20 px). Ao clicar, o campo aparece no lugar
 * dele; fica aberto enquanto houver termo na URL e fecha com Esc quando está vazio.
 */
function HeaderSearch({ query, onSearch }: { query?: string; onSearch: (query: string) => void }) {
  const [open, setOpen] = useState(Boolean(query))

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Abrir busca"
        aria-expanded="false"
        onClick={() => setOpen(true)}
        className="grid size-5 shrink-0 place-items-center rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
      >
        <img src={searchIcon} alt="" className="size-5" />
      </button>
    )
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !query) {
          setOpen(false)
        }
      }}
    >
      <SearchField
        label="Buscar NFTs"
        placeholder="Buscar NFTs"
        defaultValue={query}
        onSearch={onSearch}
        autoFocus
        className="h-[35px] w-[170px] rounded-md border border-border bg-card lg:w-[220px]"
      />
    </div>
  )
}

/** Ícone de filtros do Figma (mobile): dois controles, um com o botão à esquerda e outro à direita. */
function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-6">
      <circle cx="7.5" cy="8" r="2.25" />
      <path d="M12.5 8H20" />
      <path d="M4 16h7.5" />
      <circle cx="16.5" cy="16" r="2.25" />
    </svg>
  )
}

export function SiteHeader() {
  const { search, update } = useCatalogSearch()
  const { openFilters } = useFiltersDrawer()
  const onHome = useRouterState({ select: (state) => state.location.pathname === '/' })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hash = useRouterState({ select: (state) => state.location.hash })
  // Figma: o menu destaca "Mercado" nas telas de compra e "Início" em todas as outras.
  const marketSection =
    (onHome && hash === 'mercado') ||
    pathname === '/carrinho' ||
    pathname === '/pagamento' ||
    pathname.startsWith('/nft/') ||
    pathname.startsWith('/pedido/')
  const currentHref = useRouterState({ select: (state) => state.location.href })
  const session = useSession()
  const cartItemCount = useCart().data?.itemCount ?? 0
  const redirect = getSafeRedirect(currentHref)

  function handleSearch(query: string) {
    update({ q: query.trim() || undefined })
  }

  return (
    <header className="site-chrome sticky top-0 z-50 bg-background print:hidden">
      {/* Desktop (Figma: 69 px de altura; itens a partir de y=24; a linha só cobre o conteúdo) */}
      <div className="mx-auto hidden w-full max-w-[1264px] px-8 pt-6 md:block">
        <div className="relative flex h-[45px] justify-between border-b border-header-line">
          <div className="flex h-[35px] w-[200px] items-center xl:w-[376px]">
            <Link to="/" className="text-sm font-bold tracking-[1.4px] text-foreground">
              KURIO
            </Link>
          </div>

          <nav aria-label="Principal" className="flex h-[35px] gap-6 lg:gap-[41px]">
            <Link
              to="/"
              aria-current={onHome && !hash ? 'page' : undefined}
              className={`${navItemClass} ${!marketSection ? 'font-bold text-text-accent' : ''}`}
            >
              <NavLabel isActive={!marketSection}>Início</NavLabel>
            </Link>
            <Link
              to="/"
              hash="mercado"
              aria-current={onHome && hash === 'mercado' ? 'page' : undefined}
              className={`${navItemClass} ${marketSection ? 'font-bold text-text-accent' : ''}`}
            >
              <NavLabel isActive={marketSection}>Mercado</NavLabel>
            </Link>
            <span aria-disabled="true" title="Em breve" className={soonClass}>
              Criadores
            </span>
            <span aria-disabled="true" title="Em breve" className={soonClass}>
              Aprenda
            </span>
          </nav>

          <div className="ml-auto flex h-[35px] items-center gap-7">
            <HeaderSearch
              key={`desktop-${search.q ?? ''}`}
              query={search.q}
              onSearch={handleSearch}
            />

            <Link
              to="/carrinho"
              aria-label={
                cartItemCount > 0
                  ? `Carrinho, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}`
                  : 'Carrinho'
              }
              className="relative h-6 w-[31px] shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
              <img src={cartIcon} alt="" className="size-6" />
              {cartItemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-[15px] grid size-4 place-items-center rounded-full bg-primary text-tiny font-medium text-primary-foreground"
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
                <Link to="/login" search={redirect === '/' ? {} : { redirect }}>
                  <img src={loginIcon} alt="" className="size-5 object-contain" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-2 px-6 pt-10 pb-4 md:hidden">
        <SearchField
          key={`mobile-${search.q ?? ''}`}
          label="Explorar coleções"
          placeholder="Explorar coleções"
          defaultValue={search.q}
          onSearch={handleSearch}
          variant="mobile"
          className="h-[45px] flex-1 rounded-2xl bg-card"
        />
        {onHome && (
        <button
          type="button"
          aria-label="Filtros"
          onClick={openFilters}
          className="grid size-[45px] shrink-0 place-items-center rounded-2xl bg-linear-to-br from-filter-from to-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <FilterIcon />
        </button>
        )}
      </div>
    </header>
  )
}
