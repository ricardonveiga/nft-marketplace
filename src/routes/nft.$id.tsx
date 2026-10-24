import { createFileRoute } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { RecommendedNfts } from '@/components/cart/recommended-nfts'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { NftDetailSkeleton, NftDetailView } from '@/components/nft/nft-detail-view'
import { RealtimeNotices } from '@/components/realtime/realtime-notices'
import { Button } from '@/components/ui/button'
import { useNft } from '@/hooks/use-nfts'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { id } = Route.useParams()
  const { data: nft, isPending, isError, error, refetch } = useNft(id)
  const notFound = isError && isAxiosError(error) && error.response?.status === 404

  useEffect(() => {
    const previous = document.title

    document.title = nft ? `${nft.name} | Kurio` : notFound ? 'NFT não encontrado | Kurio' : previous

    return () => {
      document.title = previous
    }
  }, [nft, notFound])

  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 pt-[32px] pb-24 md:px-8">
      <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/', hash: 'mercado' }]} />
      <div className="mt-3 empty:hidden">
        <RealtimeNotices nftIds={[id]} />
      </div>

      {isPending && <NftDetailSkeleton />}

      {notFound && (
        <div
          data-testid="detail-not-found"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <h1 className="text-heading">NFT não encontrado</h1>
          <p className="text-text-secondary">
            Este NFT não existe ou foi removido do catálogo.
          </p>
        </div>
      )}

      {isError && !notFound && (
        <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
          <p>Não foi possível carregar este NFT.</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      )}

      {nft && <NftDetailView nft={nft} />}

      {(isPending || nft) && (
        <RecommendedNfts title="Mais desta coleção" excludeId={id} testId="related" tight className="mt-[95px]" />
      )}
    </div>
  )
}
