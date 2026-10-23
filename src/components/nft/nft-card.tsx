import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft, NftRarity } from '@/types/nft'

const rarityLabel: Record<NftRarity, string> = {
  comum: 'COMUM',
  raro: 'RARO',
  epico: 'ÉPICO',
  lendario: 'LENDÁRIO',
}

export function NftCard({ nft }: { nft: Nft }) {
  const soldOut = nft.availability === 'esgotado'

  return (
    <Link
      to="/nft/$id"
      params={{ id: nft.id }}
      data-testid="nft-card"
      className="group flex w-full flex-col gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:gap-3"
    >
      <div className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(139.5deg,var(--card)_12%,var(--surface-raised)_106.6%)] md:aspect-[258/300] md:h-auto md:rounded-none md:bg-none md:bg-card">
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={600}
          height={600}
          loading="lazy"
          className={`size-[168px] rounded-2xl object-cover md:aspect-square md:size-auto md:w-[calc(100%-8px)] md:max-w-[250px] md:rounded-[15px] ${soldOut ? 'opacity-60' : ''}`}
        />

        {nft.rarity !== 'comum' && (
          <span className="absolute top-4 left-0 flex h-8 items-center bg-primary px-2 text-[13px] font-medium text-primary-foreground md:hidden">
            {rarityLabel[nft.rarity]}
          </span>
        )}

        {soldOut && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0 pl-2 md:gap-1.5 md:pl-0">
        <h3 className="text-[15px] font-normal md:text-base md:leading-4">
          {nft.name}
        </h3>
        <p className="flex items-center gap-3 text-base leading-4 font-bold text-text-accent md:text-lg">
          {nft.priceEth} ETH
          {nft.previousPriceEth && (
            <span className="font-normal text-brand-secondary">
              <span className="sr-only">Preço anterior: </span>
              {nft.previousPriceEth} ETH
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}

export function NftCardSkeleton() {
  return (
    <div
      data-testid="nft-card-skeleton"
      className="flex flex-col gap-2 md:gap-3"
    >
      <Skeleton className="h-[200px] w-full rounded-[20px] md:aspect-[258/300] md:h-auto md:rounded-none" />
      <div className="flex flex-col gap-1.5 pl-2 md:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
