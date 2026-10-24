import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePromotions } from '@/hooks/use-editorial'
import { exploreCatalog } from '@/lib/explore-catalog'

/**
 * Promoções da Início (Figma: dois cards de 586 × 250, arte à esquerda e texto alinhado à
 * direita). São conteúdo editorial: o botão "Explorar" leva ao catálogo, como o do hero.
 */
export function PromotionsSection() {
  const { data, isPending, isError, refetch } = usePromotions()

  // Sem promoções (lista vazia) a seção some: não há o que mostrar.
  if (data && data.length === 0) {
    return null
  }

  return (
    <section aria-label="Promoções" data-testid="promotions" className="mt-16 md:mt-24">
      {isPending && (
        <div role="status" aria-label="Carregando promoções" className="grid gap-4 md:gap-7 min-[1264px]:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-[176px] rounded-lg md:h-[250px]" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-card p-6 text-sm">
          <p>Não foi possível carregar as promoções.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && (
        <ul className="grid gap-4 md:gap-7 min-[1264px]:grid-cols-2">
          {data.map((promotion) => (
            <li key={promotion.id} className="flex">
              <article
                data-testid="promotion"
                className="flex w-full flex-col overflow-hidden rounded-lg bg-card md:h-[250px] md:flex-row"
              >
                <img
                  src={promotion.imageUrl}
                  alt=""
                  width={600}
                  height={600}
                  loading="lazy"
                  className="h-[200px] w-full shrink-0 object-cover md:h-full md:w-[287px] md:rounded-r-[16px]"
                />
                <div className="flex min-w-0 flex-1 flex-col items-start p-6 text-left md:items-end md:p-0 md:pt-[37px] md:pr-[31px] md:text-right">
                  <h3 className="text-lg leading-6 font-bold whitespace-pre-line">{promotion.title}</h3>
                  <p className="mt-[9px] max-h-[72px] max-w-full md:w-[262px] overflow-hidden text-sm leading-6 text-text-secondary">
                    {promotion.description}
                  </p>
                  <a
                    href="#mercado"
                    onClick={exploreCatalog}
                    className="mt-4 inline-flex md:-mt-[2px] h-10 w-[140px] items-center justify-center gap-1 rounded-md bg-primary text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Explorar
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
