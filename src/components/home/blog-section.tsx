import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBlogPosts } from '@/hooks/use-editorial'
import { formatDate } from '@/lib/format'

/**
 * "Diário da Cunhagem" (estrutura inferida: o Figma estava inacessível). Os artigos completos
 * ainda não existem, então os cards não são links: o "Ler artigo" aparece como "Em breve",
 * no mesmo padrão dos itens inertes do cabeçalho e do rodapé.
 */
export function BlogSection() {
  const { data, isPending, isError, refetch } = useBlogPosts()

  if (data && data.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="diario-titulo" data-testid="blog" className="mt-16 md:mt-[120px]">
      <h2 id="diario-titulo" className="text-heading mb-6 md:mb-8">
        Diário da Cunhagem
      </h2>

      {isPending && (
        <div role="status" aria-label="Carregando artigos" className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[360px] rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-card p-6 text-sm">
          <p>Não foi possível carregar os artigos.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && (
        <ul className="grid gap-6 md:grid-cols-3">
          {data.map((post) => (
            <li key={post.id} className="flex">
              <article data-testid="blog-post" className="flex w-full flex-col overflow-hidden rounded-lg bg-card">
                <img
                  src={post.imageUrl}
                  alt=""
                  width={600}
                  height={600}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <p className="text-sm font-bold text-text-accent uppercase">{post.category}</p>
                  <h3 className="text-lg leading-6 font-bold">{post.title}</h3>
                  <p className="text-sm leading-[22px] text-text-secondary">{post.excerpt}</p>
                  <div className="mt-auto flex flex-col gap-1 pt-2 text-sm text-text-secondary">
                    <p>
                      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> ·{' '}
                      {post.readMinutes} min de leitura
                    </p>
                    <span aria-disabled="true" title="Em breve" className="cursor-not-allowed opacity-60">
                      Ler artigo (em breve)
                    </span>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
