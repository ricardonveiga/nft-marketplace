import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useHighlights } from '@/hooks/use-nfts'
import type { Nft } from '@/types/nft'

function exploreCatalog(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()

  const catalog = document.getElementById('mercado')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  catalog?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  // Leva o foco junto: quem navega por teclado ou leitor de tela continua de onde rolou.
  catalog?.focus({ preventScroll: true })
}

function HeroArt({ nft, preview, position, total }: { nft: Nft; preview?: Nft; position: number; total: number }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${position} de ${total}`}
      data-testid="hero-slide"
      className="relative size-[138px] shrink-0 md:absolute md:inset-y-0 md:right-1 md:size-auto md:w-[446px]"
    >
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="group relative block size-full overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:rounded-3xl"
      >
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={600}
          height={600}
          fetchPriority="high"
          className="size-full object-cover"
        />
        {/* Nome e preço: visíveis no desktop; no mobile ficam só para leitores de tela. */}
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-background/90 via-background/60 to-transparent px-6 pt-16 pb-6 max-md:sr-only">
          <span data-testid="hero-name" className="text-base leading-4 font-bold text-foreground">
            {nft.name}
          </span>
          <span data-testid="hero-price" className="text-lg leading-5 font-bold text-text-accent">
            {nft.priceEth} ETH
          </span>
        </span>
      </Link>

      {preview && (
        <img
          src={preview.imageUrl}
          alt=""
          aria-hidden="true"
          width={58}
          height={58}
          className="absolute -bottom-2 -left-4 size-[58px] rounded-xl border-2 border-surface-dark object-cover md:hidden"
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
      className="relative h-[190px] overflow-hidden rounded-[20px] bg-surface-dark md:h-[450px] md:rounded-xl"
    >
      {/* Círculos decorativos (Figma: Ellipse 49/50 no mobile). */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-8 -left-20 size-[248px] rounded-full bg-primary/10 md:-top-24 md:-left-24 md:size-[420px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-2.5 left-[73px] size-[248px] rounded-full bg-primary/10 md:top-auto md:-bottom-32 md:left-1/3 md:size-[380px]" />

      <div className="relative flex h-full items-center justify-between gap-2 px-4 md:gap-4 md:px-10">
        <div className="flex max-w-[188px] flex-col gap-3 md:max-w-[600px] md:gap-6">
          <div className="flex flex-col gap-1.5 md:gap-4">
            <p className="text-sm leading-4 md:text-base">Bem-vindo à Kurio</p>
            <h1
              data-testid="hero-title"
              className="text-[20px] leading-[29px] uppercase md:text-display md:leading-[70px]"
            >
              <span className="hidden md:inline">
                Seja dono do futuro
                <br />
                da arte digital
              </span>
              <span className="md:hidden">Seja dono da cultura digital</span>
            </h1>
          </div>

          <p className="text-[13px] leading-[18px] text-text-secondary md:max-w-[557px] md:text-sm md:leading-6">
            <span className="hidden md:inline">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </span>
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          </p>

          <a
            href="#mercado"
            onClick={exploreCatalog}
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:h-10 md:rounded-md md:bg-primary md:px-6 md:text-base md:text-primary-foreground"
          >
            EXPLORAR
            <ArrowRight className="size-4 md:hidden" aria-hidden="true" />
          </a>
        </div>

        {isPending && (
          <div
            role="status"
            aria-label="Carregando destaques"
            data-testid="hero-loading"
            className="size-[138px] shrink-0 md:absolute md:inset-y-0 md:right-1 md:size-auto md:w-[446px]"
          >
            <Skeleton className="size-full rounded-2xl md:rounded-3xl" />
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
          className="absolute inset-x-0 bottom-1 flex justify-center md:bottom-3"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ver destaque ${index + 1} de ${slides.length}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => setRequested(index)}
              className="grid size-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                className={`size-[7px] rounded-full ${index === active ? 'bg-primary' : 'bg-primary/40'}`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
