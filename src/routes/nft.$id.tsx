import { createFileRoute } from '@tanstack/react-router'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

// Página provisória: a tela de detalhe completa ainda será implementada. O botão de
// adicionar ao carrinho já é o definitivo e será reaproveitado por ela.
function NftDetailPage() {
  const { id } = Route.useParams()

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 md:px-8">
      <div>
        <h1 className="text-2xl">NFT</h1>
        <p data-testid="nft-id" className="mt-2 text-muted-foreground">
          {id}
        </p>
      </div>
      <AddToCartButton nftId={id} />
    </section>
  )
}
