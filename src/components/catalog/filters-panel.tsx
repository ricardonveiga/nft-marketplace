import { Check } from 'lucide-react'
import { useId, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useCatalogNfts, useCatalogSearch } from '@/hooks/use-catalog-search'
import { centiToEth, ethToCenti, formatEthBr } from '@/lib/eth'
import type { NftFacetOption } from '@/types/nft'

type FilterGroupProps = {
  title: string
  options: NftFacetOption[]
  selected: readonly string[]
  onToggle: (name: string) => void
  boldCount?: boolean
  /** Sem recuo à direita (a lista de Rede, no Figma, vai até a borda do bloco). */
  flushRight?: boolean
}

function FilterGroup({ title, options, selected, onToggle, boldCount, flushRight }: FilterGroupProps) {
  const titleId = useId()

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-lg leading-4">
        {title}
      </h3>
      <ul className={`flex flex-col pl-3 ${flushRight ? 'pr-0' : 'pr-3'}`}>
        {options.map(({ name, count }) => {
          const checked = selected.includes(name)

          return (
            <li key={name}>
              <label
                className={`group/row relative flex cursor-pointer items-start justify-between text-[15px] leading-10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring ${checked ? 'text-text-accent' : 'text-text-secondary'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(name)}
                  className="sr-only"
                />
                <Check
                  aria-hidden="true"
                  className="absolute top-1/2 -left-3 hidden size-3 -translate-y-1/2 group-has-[:checked]/row:block"
                />
                <span>{name}</span>
                <span className={boldCount ? 'font-bold' : undefined}>
                  <span className="sr-only">, </span>({count})
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type PriceFilterProps = {
  bounds: { min: string; max: string }
  minPrice?: string
  maxPrice?: string
  onApply: (range: { minPrice?: string; maxPrice?: string }) => void
}

function PriceFilter({ bounds, minPrice, maxPrice, onApply }: PriceFilterProps) {
  const boundMin = ethToCenti(bounds.min)
  const boundMax = ethToCenti(bounds.max)
  const [range, setRange] = useState<[number, number]>([
    Math.max(minPrice ? ethToCenti(minPrice) : boundMin, boundMin),
    Math.min(maxPrice ? ethToCenti(maxPrice) : boundMax, boundMax),
  ])
  const titleId = useId()
  const disabled = boundMin >= boundMax

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-lg leading-4">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={boundMin}
          max={boundMax}
          step={1}
          minStepsBetweenThumbs={0}
          value={range}
          disabled={disabled}
          onValueChange={(value) => setRange([value[0], value[1]])}
        />
        <p className="-mt-px text-[15px]">
          Preço: {formatEthBr(centiToEth(range[0]))} -{' '}
          {formatEthBr(centiToEth(range[1]))} ETH
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onApply({
              minPrice: range[0] > boundMin ? centiToEth(range[0]) : undefined,
              maxPrice: range[1] < boundMax ? centiToEth(range[1]) : undefined,
            })
          }
          className="-mt-0.5 w-[92px] self-start rounded-md bg-primary py-2 text-base leading-5 font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

function toggle<T extends string>(list: readonly T[] | undefined, value: T) {
  const current = list ?? []
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]

  return next.length > 0 ? next : undefined
}

export function FiltersPanel() {
  const { search, update } = useCatalogSearch()
  const { data } = useCatalogNfts()

  return (
    <div className="flex w-full flex-col gap-10 bg-card p-5">
      {!data ? (
        <div role="status" aria-label="Carregando filtros" className="flex flex-col gap-3">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <>
          <FilterGroup
            title="Coleções"
            options={data.facets.categories}
            selected={search.category ?? []}
            onToggle={(name) => update({ category: toggle(search.category, name) })}
            boldCount
          />
          {/* A chave reinicia o slider quando a URL muda (voltar/avançar, limpar filtros). */}
          <PriceFilter
            key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}-${data.facets.price.min}-${data.facets.price.max}`}
            bounds={data.facets.price}
            minPrice={search.minPrice}
            maxPrice={search.maxPrice}
            onApply={update}
          />
          <FilterGroup
            title="Rede"
            flushRight
            options={data.facets.networks}
            selected={search.network ?? []}
            onToggle={(name) =>
              update({ network: toggle(search.network, name as 'Ethereum') })
            }
          />
        </>
      )}
    </div>
  )
}
