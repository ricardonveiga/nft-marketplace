import { createFileRoute } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import { useNfts } from '@/hooks/use-nfts'

const PAGE_SIZE = 24
const gridClass = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isPending, isError, refetch } = useNfts({
    page: 1,
    pageSize: PAGE_SIZE,
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <section id="mercado" aria-labelledby="titulo-mercado" className="scroll-mt-32">
        <h1 id="titulo-mercado" className="mb-8 text-3xl md:text-5xl">
          Descubra NFTs
        </h1>

        {isPending && (
          <div
            role="status"
            aria-label="Carregando NFTs"
            data-testid="nft-grid-loading"
            className={gridClass}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <NftCardSkeleton key={index} />
            ))}
          </div>
        )}

        {isError && (
          <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
            <p>Não foi possível carregar os NFTs.</p>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <p data-testid="nft-empty" className="py-16 text-center text-muted-foreground">
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
      </section>
    </div>
  )
}
