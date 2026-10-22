import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft } from '@/types/nft'

export function NftCard({ nft }: { nft: Nft }) {
  const soldOut = nft.availability === 'esgotado'

  return (
    <Link
      to="/nft/$id"
      params={{ id: nft.id }}
      data-testid="nft-card"
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={600}
          height={600}
          loading="lazy"
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">{nft.collection}</p>
        <h3 className="text-base">{nft.name}</h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Edição {nft.edition}
          </span>
          <span className="font-bold text-primary">{nft.priceEth} ETH</span>
        </div>
      </div>
    </Link>
  )
}

export function NftCardSkeleton() {
  return (
    <div
      data-testid="nft-card-skeleton"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <div className="mt-2 flex justify-between gap-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  )
}
