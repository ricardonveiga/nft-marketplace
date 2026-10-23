import { createFileRoute } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import { useNfts } from '@/hooks/use-nfts'

const PAGE_SIZE = 9

// 2 colunas escalonadas no mobile; 3 colunas (258 px, gap 34 × 72) no desktop.
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 [&>*:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px] md:pb-0 md:[&>*:nth-child(even)]:translate-y-0'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isPending, isError, refetch } = useNfts({
    page: 1,
    pageSize: PAGE_SIZE,
  })

  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
      <h1 className="sr-only">Descubra NFTs</h1>

      <section
        id="mercado"
        aria-label="Catálogo de NFTs"
        className="scroll-mt-24 xl:grid xl:grid-cols-[310px_1fr] xl:gap-12"
      >
        <div className="xl:col-start-2">
          {isPending && (
            <div
              role="status"
              aria-label="Carregando NFTs"
              data-testid="nft-grid-loading"
              className={gridClass}
            >
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
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

          {data && data.items.length === 0 && (
            <p
              data-testid="nft-empty"
              className="py-16 text-center text-muted-foreground"
            >
              Nenhum NFT encontrado.
            </p>
          )}

          {data && data.items.length > 0 && (
            <ul data-testid="nft-grid" className={gridClass}>
              {data.items.map((nft) => (
                <li key={nft.id} className="flex">
                  <NftCard nft={nft} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
