import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useHighlights } from '@/hooks/use-nfts'
import { exploreCatalog } from '@/lib/explore-catalog'
import type { Nft } from '@/types/nft'

function HeroArt({ nft, preview, position, total }: { nft: Nft; preview?: Nft; position: number; total: number }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${position} de ${total}`}
      data-testid="hero-slide"
      className="absolute top-[10px] right-4 size-[138px] md:inset-y-0 md:top-0 md:right-0 md:size-auto md:w-[450px]"
    >
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="group relative block size-full overflow-hidden rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:rounded-[24px]"
      >
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={600}
          height={600}
          fetchPriority="high"
          className="size-full object-cover"
        />
        {/* No Figma a arte não tem texto sobreposto: nome e preço ficam só para leitores de tela. */}
        <span className="sr-only">
          <span data-testid="hero-name">{nft.name}</span>
          <span data-testid="hero-price">{nft.priceEth} ETH</span>
        </span>
      </Link>

      {preview && (
        <img
          src={preview.imageUrl}
          alt=""
          aria-hidden="true"
          width={58}
          height={58}
          className="absolute top-[100px] left-[14px] size-[58px] rounded-2xl object-cover md:hidden"
        />
      )}
    </div>
  )
}

/**
 * Hero da Início (Figma: Hero 1200 × 450 no desktop; banner 366 × 190 no mobile).
 * A arte é um carrossel com os destaques; o primeiro é o NFT do card "em destaque"
 * (o mais caro entre os disponíveis). Sem rotação automática: a troca é só pelos
 * indicadores, o que evita conteúdo em movimento que o usuário não controla.
 */
export function Hero() {
  const { data: highlights, isPending } = useHighlights()
  const [requested, setRequested] = useState(0)

  const slides = highlights ?? []
  const active = Math.min(requested, Math.max(slides.length - 1, 0))
  const current = slides[active]
  const next = slides[(active + 1) % Math.max(slides.length, 1)]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques"
      className="relative h-[190px] overflow-hidden rounded-[32px] bg-hero-base md:h-[450px] md:overflow-visible md:rounded-none md:bg-transparent"
    >
      {/* Só no mobile (Figma: Ellipse 49/50 do frame mobile, 248 px). O desktop tem fundo liso. */}
      <div
        aria-hidden="true"
        data-testid="hero-circle"
        style={{ background: 'var(--hero-circle-a)' }}
        className="pointer-events-none absolute -top-8 -left-20 size-[248px] rounded-full opacity-[.63] md:hidden"
      />
      <div
        aria-hidden="true"
        data-testid="hero-circle"
        style={{ background: 'var(--hero-circle-b)' }}
        className="pointer-events-none absolute -top-2.5 left-[73px] size-[248px] rounded-full opacity-[.384] md:hidden"
      />

      <div className="relative flex h-full items-start px-4 md:gap-4 md:px-10">
        <div className="flex max-w-[188px] flex-col pt-1.5 md:max-w-[600px] md:pt-[43px]">
          <div className="flex flex-col">
            <p className="text-xs leading-4 md:text-base">Bem-vindo à Kurio</p>
            <h1
              data-testid="hero-title"
              className="mt-[5px] text-lg leading-[29px] uppercase md:mt-[9px] md:text-display md:leading-[70px]"
            >
              <span className="hidden md:inline">
                Seja dono do futuro
                <br />
                da arte digital
              </span>
              <span className="md:hidden">Seja dono da cultura digital</span>
            </h1>
          </div>

          <p className="mt-1.5 text-xs leading-[18.5px] text-text-secondary md:mt-[3px] md:max-w-[557px] md:text-sm md:leading-6">
            <span className="hidden md:inline">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </span>
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          </p>

          <a
            href="#mercado"
            onClick={exploreCatalog}
            className="-mt-px inline-flex w-fit items-center gap-2 text-xs leading-4 font-bold text-text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:mt-8 md:h-10 md:w-[140px] md:justify-center md:rounded-md md:bg-primary md:text-base md:text-primary-foreground"
          >
            EXPLORAR
            <ArrowRight className="size-[14px] md:hidden" aria-hidden="true" />
          </a>
        </div>

        {isPending && (
          <div
            role="status"
            aria-label="Carregando destaques"
            data-testid="hero-loading"
            className="absolute top-[10px] right-4 size-[138px] md:inset-y-0 md:top-0 md:right-0 md:size-auto md:w-[450px]"
          >
            <Skeleton className="size-full rounded-[20px] md:rounded-[24px]" />
          </div>
        )}

        {current && (
          <HeroArt
            key={current.id}
            nft={current}
            preview={slides.length > 1 ? next : undefined}
            position={active + 1}
            total={slides.length}
          />
        )}
      </div>

      {slides.length > 1 && (
        <div
          role="group"
          aria-label="Escolher destaque"
          className="absolute inset-x-0 top-[168px] flex justify-center md:inset-x-auto md:left-[596px] md:top-[391px]"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ver destaque ${index + 1} de ${slides.length}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => setRequested(index)}
              className="grid h-6 w-[13px] place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-ring md:w-4"
            >
              <span
                className="size-1.5 rounded-full bg-primary md:size-2"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
