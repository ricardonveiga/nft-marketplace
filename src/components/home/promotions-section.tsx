import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePromotions } from '@/hooks/use-editorial'

/**
 * Promoções da Início (estrutura inferida: o Figma estava inacessível). São conteúdo editorial:
 * os cards não são links. O código do cupom aparece como texto, para o colecionador aplicar no
 * carrinho; nada aqui aparenta uma ação que não existe.
 */
export function PromotionsSection() {
  const { data, isPending, isError, refetch } = usePromotions()

  // Sem promoções (lista vazia) a seção some: não há o que mostrar.
  if (data && data.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="promocoes-titulo" data-testid="promotions" className="mt-16 md:mt-[120px]">
      <h2 id="promocoes-titulo" className="text-heading mb-6 md:mb-8">
        Promoções
      </h2>

      {isPending && (
        <div role="status" aria-label="Carregando promoções" className="grid gap-4 md:grid-cols-3 md:gap-6">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[176px] rounded-lg" />
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
        <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
          {data.map((promotion) => (
            <li key={promotion.id} className="flex">
              <article
                data-testid="promotion"
                className="flex w-full flex-col gap-3 rounded-lg bg-card p-6"
              >
                <p className="text-sm font-bold text-text-accent uppercase">{promotion.badge}</p>
                <h3 className="text-lg leading-6 font-bold">{promotion.title}</h3>
                <p className="text-sm leading-[22px] text-text-secondary">{promotion.description}</p>
                {promotion.couponCode && (
                  <p className="mt-auto pt-2 text-sm text-text-secondary">
                    Cupom{' '}
                    <code
                      data-testid="promotion-coupon"
                      className="rounded-md bg-surface-dark px-2 py-1 font-bold text-foreground"
                    >
                      {promotion.couponCode}
                    </code>
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
