import { Mail, Star } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { NftDetail } from '@/types/nft'
import { FavoriteButton } from './favorite-button'
import { NftGallery } from './nft-gallery'
import { PurchasePanel } from './purchase-panel'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

function Stars({ value, className = 'size-[18px]' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, value - index))

        return (
          <span key={index} className="relative inline-grid">
            <Star className={`${className} text-text-secondary`} strokeWidth={0} fill="currentColor" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${className} text-text-accent`} strokeWidth={0} fill="currentColor" />
            </span>
          </span>
        )
      })}
    </span>
  )
}

function ShareIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      role="img"
      aria-label={`${label} (em breve)`}
      title="Em breve"
      className="inline-grid size-[18px] cursor-not-allowed place-items-center"
    >
      {children}
    </span>
  )
}

const tabClass =
  'relative -mb-px pb-2 text-[17px] leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=active]:font-bold data-[state=active]:text-text-accent data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-[3px] data-[state=active]:after:bg-primary'

export function NftDetailView({ nft }: { nft: NftDetail }) {
  const wide = useMediaQuery('(min-width: 1024px)')
  const soldOut = nft.availability === 'esgotado' || nft.maxQuantity === 0

  return (
    <>
      <div className="grid lg:grid-cols-[100px_444px_1fr] lg:gap-x-[28px]">
        <NftGallery key={nft.id} images={nft.gallery} name={nft.name} soldOut={soldOut} />

        <div className="relative z-10 flex min-w-0 flex-col max-lg:-mx-7 max-md:-mr-[25px] max-lg:-mt-[35px] max-lg:rounded-t-[36px] max-lg:bg-card max-lg:px-6 max-lg:pt-[32px] max-lg:pb-[190px] max-md:pr-[27px] lg:ml-[5px]">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl leading-8 font-bold max-lg:pt-0 lg:pt-[3px] lg:text-[27px]">{nft.name}</h1>
            <p
              data-testid="detail-rating-pill"
              className="flex h-[27px] shrink-0 items-center gap-1 rounded-full border border-primary px-[5px] text-[13px] lg:hidden"
            >
              <Star className="size-3 text-text-accent" fill="currentColor" strokeWidth={0} aria-hidden="true" />
              <span>
                {nft.ratingAverage.toFixed(1)}
                <span className="sr-only"> de 5, </span>
                <span className="text-text-secondary">({nft.reviewCount})</span>
              </span>
            </p>
          </div>

          {wide && (
          <div className="mt-[11px] flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="flex items-baseline gap-3">
              <span className="text-[22px] leading-7 font-bold text-text-accent" data-testid="detail-price">
                {nft.priceEth} ETH
              </span>
              {nft.previousPriceEth && (
                <span className="text-base text-brand-secondary line-through">
                  <span className="sr-only">Preço anterior: </span>
                  {nft.previousPriceEth} ETH
                </span>
              )}
            </p>
            <p className="flex items-center gap-[3px] text-[15px] leading-5" data-testid="detail-rating">
              <Stars value={nft.ratingAverage} />
              <span>
                {nft.reviewCount} avaliações de colecionadores
                <span className="sr-only">, nota média {nft.ratingAverage.toString().replace('.', ',')} de 5</span>
              </span>
            </p>
          </div>

          )}

          <div className="mt-[6px] h-px bg-header-line max-lg:hidden lg:mr-[22px]" />

          <h2 className="mt-3 text-[15px] leading-5 font-bold max-lg:hidden">Sobre este NFT:</h2>
          <p className="mt-[9px] text-sm leading-6 text-text-secondary max-lg:hidden">{nft.about}</p>
          <p className="mt-[7px] text-sm leading-6 text-text-secondary lg:hidden">{nft.summary}</p>

          <h2 className="mt-[6px] text-sm leading-5 font-bold max-lg:mt-2 max-lg:text-[15px]">Edição:</h2>
          <ul aria-label="Edições" className="mt-[9px] flex flex-wrap gap-[6px] max-lg:mt-[7px] max-lg:gap-[13px]">
            {nft.editionOptions.map((option) => {
              const selected = option === nft.edition

              return (
                <li
                  key={option}
                  aria-current={selected ? 'true' : undefined}
                  className={`flex h-[29px] items-center rounded-full border px-[5px] text-sm text-text-secondary ${selected ? 'border-primary font-bold text-text-accent' : 'border-border'}`}
                >
                  {option}
                </li>
              )
            })}
          </ul>

          <p className="sr-only" data-testid="detail-availability">
            {soldOut
              ? `Edição ${nft.edition} esgotada.`
              : `Edição ${nft.edition} · ${nft.availableQuantity} ${nft.availableQuantity === 1 ? 'unidade disponível' : 'unidades disponíveis'}`}
          </p>

          <div className="mt-[13px] max-lg:mt-0">
            <PurchasePanel
              key={`${nft.id}-${wide}`}
              nft={nft}
              variant={wide ? 'panel' : 'bar'}
              favorite={wide ? <FavoriteButton nftId={nft.id} name={nft.name} /> : null}
            />
          </div>

          <dl className="mt-[15px] flex flex-col gap-3 text-sm leading-5 text-brand-secondary max-lg:mt-[10px] max-lg:gap-[12px] max-lg:text-[15px]">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{nft.collection}</dd>
            </div>
            <div>
              <dt className="inline">Atributos: </dt>
              <dd className="inline">{nft.attributes.join(', ')}</dd>
            </div>
          </dl>

          <p className="mt-[10px] flex items-center gap-2 text-sm leading-5 font-bold max-lg:hidden">
            Compartilhar este NFT:
            <ShareIcon label="LinkedIn">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.5H3V9.75Zm6.5 0h3.83v1.57h.06c.53-1 1.84-2.07 3.78-2.07 4.04 0 4.78 2.66 4.78 6.12v5.88h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75v5.29h-4V9.75Z" />
              </svg>
            </ShareIcon>
            <ShareIcon label="E-mail">
              <Mail className="size-[18px]" strokeWidth={1.5} />
            </ShareIcon>
            <ShareIcon label="Twitter">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                <path d="M22 5.9c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.8.1.5 1.6 2 2.8 3.8 2.8A8.3 8.3 0 0 1 2 18.3 11.7 11.7 0 0 0 8.3 20c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.2Z" />
              </svg>
            </ShareIcon>
          </p>
        </div>
      </div>

      <Tabs.Root defaultValue="detalhes" className="mt-[95px]">
        <Tabs.List aria-label="Informações do NFT" className="flex gap-[41px] border-b border-header-line">
          <Tabs.Trigger value="detalhes" className={tabClass}>
            Detalhes do NFT
          </Tabs.Trigger>
          <Tabs.Trigger value="avaliacoes" className={tabClass}>
            Avaliações de colecionadores ({nft.reviewCount})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="detalhes" className="mt-[13px] text-sm leading-6 text-text-secondary outline-none">
          {nft.story.map((paragraph) => (
            <p key={paragraph} className="mb-6">
              {paragraph}
            </p>
          ))}
          <div className="-mt-3 flex flex-col gap-3 text-text-secondary">
            <div>
              <h3 className="font-bold text-foreground">Rede:</h3>
              <p>{nft.networkNote}</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Contrato:</h3>
              <p>{nft.contractNote}</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Direitos autorais:</h3>
              <p>{nft.copyrightNote}</p>
            </div>
          </div>
          <p className="sr-only">
            Criador: {nft.creator}. Listado em {dateFormatter.format(new Date(nft.listedAt))}.
          </p>
        </Tabs.Content>

        <Tabs.Content value="avaliacoes" className="mt-[17px] outline-none">
          <ul aria-label="Avaliações" className="flex flex-col gap-4">
            {nft.reviews.map((review) => (
              <li key={review.id} className="bg-card p-4">
                <p className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-bold">{review.author}</span>
                  <span className="flex items-center gap-2 text-text-secondary">
                    <Stars value={review.rating} className="size-4" />
                    <span className="sr-only">Nota {review.rating} de 5</span>
                    {dateFormatter.format(new Date(review.createdAt))}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{review.text}</p>
              </li>
            ))}
          </ul>
        </Tabs.Content>
      </Tabs.Root>
    </>
  )
}

export function NftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando NFT"
      data-testid="detail-loading"
      className="grid gap-8 lg:grid-cols-[100px_444px_1fr] lg:gap-x-[28px]"
    >
      <div className="flex gap-3 lg:flex-col lg:gap-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="size-[100px] rounded-[3px]" />
        ))}
      </div>
      <Skeleton className="aspect-square w-full rounded-none lg:size-[444px]" />
      <div className="flex flex-col gap-6 lg:ml-[5px]">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
