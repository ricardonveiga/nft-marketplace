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
          className="block aspect-[310/368] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
        >
          <img
            src={nft.imageUrl}
            alt={`${nft.name}, da coleção ${nft.collection}`}
            width={600}
            height={600}
            className="size-full rounded-[20px] object-cover"
          />
          {/* No Figma a foto não tem texto sobreposto: nome e preço ficam só para leitores de tela. */}
          <span className="sr-only">
            {nft.name}, {nft.priceEth} ETH
          </span>
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
