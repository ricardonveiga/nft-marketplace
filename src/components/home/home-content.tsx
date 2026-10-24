import { useEffect } from 'react'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar'
import { FiltersPanel } from '@/components/catalog/filters-panel'
import { BlogSection } from '@/components/home/blog-section'
import { Hero } from '@/components/home/hero'
import { PromotionsSection } from '@/components/home/promotions-section'
import { FeaturedNftCard } from '@/components/nft/featured-nft-card'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import {
  CATALOG_PAGE_SIZE,
  useCatalogNfts,
  useCatalogSearch,
} from '@/hooks/use-catalog-search'
import { hasActiveFilters } from '@/lib/catalog-search'

// 2 colunas escalonadas no mobile; 3 colunas (258 px, gap 34 × 71) no desktop.
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 [&>*:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[71px] md:pb-0 md:[&>*:nth-child(even)]:translate-y-0'

/** Conteúdo da Início. Também aparece (inerte) atrás do modal de login e de cadastro, como no Figma. */
export function HomeContent() {
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
    <div className="mx-auto w-full max-w-[1264px] px-6 pt-0 pb-8 md:px-8 md:pt-8 md:pb-24">
      <Hero />

      <section
        id="mercado"
        tabIndex={-1}
        aria-label="Catálogo de NFTs"
        className="mt-4 scroll-mt-24 outline-none md:mt-24 xl:grid xl:grid-cols-[310px_1fr] xl:gap-12"
      >
        <div className="hidden flex-col gap-6 xl:flex">
          <aside aria-label="Filtros">
            <FiltersPanel />
          </aside>
          <FeaturedNftCard />
        </div>

        <div className="flex flex-col gap-4 md:gap-[27px]">
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
              {data.items.map((nft, index) => (
                <li key={nft.id} className="flex">
                  <NftCard nft={nft} priority={index < 3} />
                </li>
              ))}
            </ul>
          )}

          {data && (
            <CatalogPagination page={data.page} totalPages={data.totalPages} />
          )}
        </div>
      </section>

      <PromotionsSection />
      <BlogSection />
    </div>
  )
}
