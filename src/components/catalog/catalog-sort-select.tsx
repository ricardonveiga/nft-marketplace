import { ChevronDown } from 'lucide-react'
import { useCatalogSearch } from '@/hooks/use-catalog-search'
import { DEFAULT_SORT, type CatalogSort } from '@/lib/catalog-search'

const sortOptions: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name', label: 'Nome (A–Z)' },
]

export function CatalogSortSelect({ className }: { className?: string }) {
  const { search, update } = useCatalogSearch()

  return (
    <label className={`items-center gap-1 text-[15px] whitespace-nowrap ${className ?? 'flex'}`}>
      <span>Ordenar por:</span>
      <span className="relative">
        <select
          value={search.sort ?? DEFAULT_SORT}
          onChange={(event) => {
            const sort = event.target.value as CatalogSort

            update({ sort: sort === DEFAULT_SORT ? undefined : sort })
          }}
          className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-[15px] outline-none focus-visible:outline-2 focus-visible:outline-ring"
        >
          {sortOptions.map(({ value, label }) => (
            <option key={value} value={value} className="bg-card">
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2"
        />
      </span>
    </label>
  )
}
