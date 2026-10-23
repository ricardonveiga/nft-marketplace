import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedNft } from '@/hooks/use-nfts'

/**
 * Card "NFT em destaque" da barra lateral (Figma: Featured NFT Banner, 310 × 470).
 * O destaque é o NFT mais caro entre os disponíveis (ver o handler do mock).
 */
export function FeaturedNftCard() {
  const titleId = useId()
  const { data: nft, isPending } = useFeaturedNft()

  // Sem destaque (erro ou catálogo vazio) o card some: não é essencial para a página.
  if (!isPending && !nft) {
    return null
  }

  return (
    <section
      aria-labelledby={titleId}
      data-testid="featured-nft"
      className="flex w-full flex-col gap-4 overflow-hidden rounded-lg bg-surface-dark pt-6"
    >
      <div className="flex flex-col gap-4 px-5">
        <h2 id={titleId} className="text-heading leading-8 text-text-accent">
          NFT em destaque
        </h2>
        <p className="text-center text-base leading-4 font-bold tracking-[0.2em] text-foreground uppercase">
          Oferta limitada
        </p>
      </div>

      {nft ? (
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="group relative block aspect-[310/368] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
        >
          <img
            src={nft.imageUrl}
            alt={`${nft.name}, da coleção ${nft.collection}`}
            width={600}
            height={600}
            className="size-full rounded-[20px] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 rounded-b-[20px] bg-linear-to-t from-background/90 via-background/60 to-transparent px-5 pt-12 pb-5">
            <p className="text-base leading-4 font-bold text-foreground">{nft.name}</p>
            <p className="text-lg leading-5 font-bold text-text-accent">{nft.priceEth} ETH</p>
          </div>
        </Link>
      ) : (
        <div
          role="status"
          aria-label="Carregando NFT em destaque"
          data-testid="featured-nft-loading"
        >
          <Skeleton className="aspect-[310/368] w-full rounded-[20px]" />
        </div>
      )}
    </section>
  )
}
