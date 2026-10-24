import { useState } from 'react'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useRecommendedNfts } from '@/hooks/use-nfts'

const PAGE_SIZE = 5

/** "Colecionadores também viram": 5 cards por vez no desktop, com pontos para trocar de página. */
export function RecommendedNfts() {
  const { data: nfts, isPending, isError } = useRecommendedNfts()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [page, setPage] = useState(0)

  if (isError || (nfts && nfts.length === 0)) {
    return null
  }

  const pages = Math.ceil((nfts?.length ?? 0) / PAGE_SIZE)
  const current = Math.min(page, Math.max(pages - 1, 0))
  const visible = wide ? (nfts ?? []).slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE) : (nfts ?? [])

  return (
    <section aria-labelledby="recomendados" className="mt-[95px]" data-testid="recommended">
      <h2
        id="recomendados"
        className="border-b border-header-line pb-2 text-[17px] leading-5 font-bold text-text-accent"
      >
        Colecionadores também viram
      </h2>

      {isPending ? (
        <div
          role="status"
          aria-label="Carregando sugestões"
          className="mt-[32px] grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-x-[26.25px]"
        >
          {Array.from({ length: wide ? PAGE_SIZE : 2 }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <ul
            aria-label="NFTs sugeridos"
            className="relative mt-[32px] flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:gap-x-[26.25px] lg:overflow-visible lg:pb-0"
          >
            {visible.map((nft) => (
              <li key={nft.id} className="w-[200px] shrink-0 snap-start lg:w-auto">
                <NftCard nft={nft} compact priority={!wide} />
              </li>
            ))}
          </ul>

          {wide && pages > 1 && (
            <div role="group" aria-label="Páginas de sugestões" className="mt-[31px] flex justify-center gap-2">
              {Array.from({ length: pages }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Página ${index + 1} de ${pages}`}
                  aria-current={index === current ? 'true' : undefined}
                  onClick={() => setPage(index)}
                  className={`size-3 rounded-full border border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${index === current ? 'bg-primary' : ''}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
