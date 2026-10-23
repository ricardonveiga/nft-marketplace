import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar'
import { FiltersPanel } from '@/components/catalog/filters-panel'
import { FeaturedNftCard } from '@/components/nft/featured-nft-card'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import {
  CATALOG_PAGE_SIZE,
  useCatalogNfts,
  useCatalogSearch,
} from '@/hooks/use-catalog-search'
import { hasActiveFilters, validateCatalogSearch } from '@/lib/catalog-search'

// 2 colunas escalonadas no mobile; 3 colunas (258 px, gap 34 × 72) no desktop.
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 [&>*:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px] md:pb-0 md:[&>*:nth-child(even)]:translate-y-0'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  component: HomePage,
})

function HomePage() {
  const { search, update } = useCatalogSearch()
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useCatalogNfts()

  // Página além do fim (URL editada ou filtro que reduziu o resultado): volta à última.
  useEffect(() => {
    if (data && !isPlaceholderData && data.totalPages > 0 && data.page > data.totalPages) {
      update({ page: data.totalPages }, { keepPage: true })
    }
  }, [data, isPlaceholderData, update])

  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
      <h1 className="sr-only">Descubra NFTs</h1>

      <section
        id="mercado"
        aria-label="Catálogo de NFTs"
        className="scroll-mt-24 xl:grid xl:grid-cols-[310px_1fr] xl:gap-12"
      >
        <div className="hidden flex-col gap-6 xl:flex">
          <aside aria-label="Filtros">
            <FiltersPanel />
          </aside>
          <FeaturedNftCard />
        </div>

        <div className="flex flex-col gap-8">
          <CatalogToolbar />

          {data && !isPlaceholderData && (
            <p role="status" className="sr-only">
              {data.total} {data.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}
            </p>
          )}

          {isPending && (
            <div
              role="status"
              aria-label="Carregando NFTs"
              data-testid="nft-grid-loading"
              className={gridClass}
            >
              {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
                <NftCardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <p>Não foi possível carregar os NFTs.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}

          {data && data.items.length === 0 && !isPlaceholderData && (
            <div
              data-testid="nft-empty"
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <p className="text-muted-foreground">Nenhum NFT encontrado.</p>
              {hasActiveFilters(search) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    update({
                      q: undefined,
                      category: undefined,
                      network: undefined,
                      minPrice: undefined,
                      maxPrice: undefined,
                      tab: undefined,
                    })
                  }
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}

          {data && data.items.length > 0 && (
            <ul
              data-testid="nft-grid"
              aria-busy={isPlaceholderData}
              className={`${gridClass} ${isPlaceholderData ? 'opacity-60 transition-opacity' : ''}`}
            >
              {data.items.map((nft) => (
                <li key={nft.id} className="flex">
                  <NftCard nft={nft} />
                </li>
              ))}
            </ul>
          )}

          {data && (
            <CatalogPagination page={data.page} totalPages={data.totalPages} />
          )}
        </div>
      </section>
    </div>
  )
}
