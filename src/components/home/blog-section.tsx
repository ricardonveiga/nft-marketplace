import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBlogPosts } from '@/hooks/use-editorial'

const dayMonthFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

/**
 * "Diário da Cunhagem" (Figma: quatro cards de 268 px, com arte, data e tempo de leitura, título
 * e resumo). Os artigos completos ainda não existem, então os cards não são links: o "Ler mais"
 * aparece inerte, como "Em breve", no mesmo padrão dos itens do cabeçalho e do rodapé.
 */
export function BlogSection() {
  const { data, isPending, isError, refetch } = useBlogPosts()

  if (data && data.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="diario-titulo" data-testid="blog" className="mt-16 md:mt-[99px]">
      <div className="text-center">
        <h2 id="diario-titulo" className="text-[28px] leading-8 font-bold">
          Diário da Cunhagem
        </h2>
        <p className="mt-[15px] text-sm leading-4 text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      {isPending && (
        <div role="status" aria-label="Carregando artigos" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,268px))]">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[369px] rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="mt-8 flex flex-col items-start gap-3 rounded-lg bg-card p-6 text-sm">
          <p>Não foi possível carregar os artigos.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 md:mt-[41px] lg:grid-cols-[repeat(4,minmax(0,268px))]">
          {data.map((post) => (
            <li key={post.id} className="flex">
              <article data-testid="blog-post" className="flex w-full flex-col overflow-hidden rounded-lg bg-card">
                <img
                  src={post.imageUrl}
                  alt=""
                  width={600}
                  height={600}
                  loading="lazy"
                  className="h-[195px] w-full object-cover"
                />
                <div className="flex flex-1 flex-col px-4 pt-[11px] pb-[18px]">
                  <p className="text-xs leading-4 whitespace-pre-wrap text-text-secondary">
                    <time dateTime={post.publishedAt}>{dayMonthFormatter.format(new Date(post.publishedAt))}</time>
                    {'  |  '}Leitura de {post.readMinutes} min
                  </p>
                  <h3 className="mt-2 text-base leading-[22px] font-bold">{post.title}</h3>
                  <p className="mt-[7px] text-xs leading-[15px] text-text-secondary">{post.excerpt}</p>
                  <span
                    aria-disabled="true"
                    title="Em breve"
                    className="mt-auto flex cursor-not-allowed items-center gap-[7px] pt-[10px] text-xs leading-[14px] font-medium text-text-accent"
                  >
                    Ler mais
                    <ArrowRight className="size-[9px]" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
