import { Skeleton } from '@/components/ui/skeleton'

/** Mesmas dimensões da lista e do resumo reais, para a página não "pular" ao carregar. */
export function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando carrinho"
      data-testid="cart-loading"
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      <div className="flex flex-col gap-4">
        {[0, 1].map((index) => (
          <div key={index} className="grid grid-cols-[96px_1fr] gap-4 rounded-lg bg-card p-4 sm:grid-cols-[96px_1fr_auto]">
            <Skeleton className="size-24 rounded-2xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="col-span-2 h-9 w-40 sm:col-span-1" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5 rounded-lg bg-card p-6">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-[45px] w-full" />
      </div>
    </div>
  )
}
