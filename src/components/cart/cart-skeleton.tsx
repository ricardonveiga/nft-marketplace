import { Skeleton } from '@/components/ui/skeleton'

/** Mesmas dimensões da tabela e do resumo reais, para a página não "pular" ao carregar. */
export function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando carrinho"
      data-testid="cart-loading"
      className="grid gap-8 lg:min-h-[390px] lg:grid-cols-[782px_332px] lg:gap-x-[86px]"
    >
      <div className="flex flex-col gap-3">
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-[70px] w-full rounded-none" />
        ))}
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
