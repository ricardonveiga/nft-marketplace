import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useCatalogSearch } from '@/hooks/use-catalog-search'
import {
  DEFAULT_TAB,
  buildCatalogSearch,
  type CatalogTab,
} from '@/lib/catalog-search'
import { CatalogSortSelect } from './catalog-sort-select'
import { useFiltersDrawer } from './filters-drawer'

const tabs: ReadonlyArray<{ value: CatalogTab; label: string }> = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'novos', label: 'Novos lançamentos' },
  { value: 'em-alta', label: 'Em alta' },
]

export function CatalogToolbar() {
  const { search } = useCatalogSearch()
  const { openFilters } = useFiltersDrawer()
  const activeTab = search.tab ?? DEFAULT_TAB

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <nav
        aria-label="Abas do catálogo"
        className="-mx-1 flex max-w-full gap-[5px] overflow-x-auto px-1 md:gap-[22px]"
      >
        {tabs.map(({ value, label }) => {
          const active = value === activeTab

          return (
            <Link
              key={value}
              to="/"
              search={(previous: unknown) =>
                buildCatalogSearch(previous, {
                  tab: value === DEFAULT_TAB ? undefined : value,
                })
              }
              aria-current={active ? 'page' : undefined}
              className={`relative h-5 pt-0 text-sm leading-4 whitespace-nowrap md:h-[23px] md:pt-[3px] md:text-[15px] ${value === 'em-alta' ? 'max-md:ml-[11px]' : ''} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${active ? 'font-medium text-text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full md:after:w-[calc(100%-16px)] after:bg-primary' : 'font-normal text-foreground hover:text-text-accent'}`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={openFilters}
          className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-[15px] focus-visible:outline-2 focus-visible:outline-ring md:flex xl:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filtros
        </button>
        <CatalogSortSelect className="hidden md:flex" />
      </div>
    </div>
  )
}
