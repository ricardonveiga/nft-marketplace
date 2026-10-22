import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { id } = Route.useParams()

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <h1 className="text-2xl">NFT</h1>
      <p data-testid="nft-id" className="mt-2 text-muted-foreground">
        {id}
      </p>
    </section>
  )
}
