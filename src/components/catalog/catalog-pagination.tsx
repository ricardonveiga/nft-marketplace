import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildCatalogSearch } from '@/lib/catalog-search'

type CatalogPaginationProps = {
  page: number
  totalPages: number
}

const cellClass =
  'grid size-[35px] place-items-center rounded-[6px] border border-border text-lg leading-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Páginas visíveis: todas até 7; acima disso, primeira, última e vizinhas da atual. */
function visiblePages(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)

  return sorted.flatMap((value, index) =>
    index > 0 && value - sorted[index - 1] > 1 ? ['gap' as const, value] : [value],
  )
}

function PageLink({ to, children, label, current }: {
  to: number
  children: React.ReactNode
  label: string
  current?: boolean
}) {
  return (
    <Link
      to="/"
      search={(previous: unknown) =>
        buildCatalogSearch(previous, { page: to }, { keepPage: true })
      }
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      className={
        current
          ? 'grid size-[35px] place-items-center rounded-[6px] bg-primary text-lg leading-4 font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
          : cellClass
      }
    >
      {children}
    </Link>
  )
}

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Paginação" className="flex justify-end md:mt-[60px]">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <PageLink to={page - 1} label="Página anterior">
              <ChevronLeft className="size-[18px]" aria-hidden="true" />
            </PageLink>
          </li>
        )}
        {visiblePages(page, totalPages).map((value, index) =>
          value === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1">
              …
            </li>
          ) : (
            <li key={value}>
              <PageLink to={value} label={`Página ${value}`} current={value === page}>
                {value}
              </PageLink>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <PageLink to={page + 1} label="Próxima página">
              <ChevronRight className="size-[18px]" aria-hidden="true" />
            </PageLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
