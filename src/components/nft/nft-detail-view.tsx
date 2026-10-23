import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftDetail, NftRarity } from '@/types/nft'
import { FavoriteButton } from './favorite-button'
import { NftGallery } from './nft-gallery'
import { PurchasePanel } from './purchase-panel'

const rarityLabel: Record<NftRarity, string> = {
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

function Chip({ children }: { children: string }) {
  return (
    <li className="rounded-full border border-border-soft px-3 py-1 text-xs text-text-secondary">
      {children}
    </li>
  )
}

export function NftDetailView({ nft }: { nft: NftDetail }) {
  const soldOut = nft.availability === 'esgotado' || nft.maxQuantity === 0

  const attributes: Array<[string, string]> = [
    ['Edição', nft.edition],
    ['Raridade', rarityLabel[nft.rarity]],
    ['Categoria', nft.category],
    ['Rede', nft.network],
    ['Criador', nft.creator],
    ['Listado em', dateFormatter.format(new Date(nft.listedAt))],
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-12">
      <NftGallery key={nft.id} images={nft.gallery} name={nft.name} soldOut={soldOut} />

      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm text-text-secondary">{nft.collection}</p>
            <h1 className="text-heading md:text-[32px] md:leading-10">{nft.name}</h1>
          </div>
          <FavoriteButton nftId={nft.id} name={nft.name} />
        </div>

        <ul aria-label="Características" className="flex flex-wrap gap-2">
          <Chip>{rarityLabel[nft.rarity]}</Chip>
          <Chip>{nft.network}</Chip>
          <Chip>{nft.category}</Chip>
        </ul>

        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-3">
            <span className="text-[32px] leading-10 font-bold text-text-accent" data-testid="detail-price">
              {nft.priceEth} ETH
            </span>
            {nft.previousPriceEth && (
              <span className="text-lg text-brand-secondary line-through">
                <span className="sr-only">Preço anterior: </span>
                {nft.previousPriceEth} ETH
              </span>
            )}
          </p>
          <p className="text-sm text-text-secondary" data-testid="detail-availability">
            {soldOut
              ? `Edição ${nft.edition} esgotada.`
              : `Edição ${nft.edition} · ${nft.availableQuantity} ${nft.availableQuantity === 1 ? 'unidade disponível' : 'unidades disponíveis'}`}
          </p>
        </div>

        <PurchasePanel key={nft.id} nft={nft} />

        <section aria-labelledby="descricao" className="flex flex-col gap-2">
          <h2 id="descricao" className="text-lg leading-4">
            Descrição
          </h2>
          <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
        </section>

        <section aria-labelledby="detalhes" className="flex flex-col gap-3">
          <h2 id="detalhes" className="text-lg leading-4">
            Detalhes
          </h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {attributes.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border pb-2 text-sm">
                <dt className="text-text-secondary">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}

export function NftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando NFT"
      data-testid="detail-loading"
      className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-12"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-[45px] w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

export function BackToMarket() {
  return (
    <Link
      to="/"
      className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Voltar ao mercado
    </Link>
  )
}
