import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/components/auth/require-auth'
import { CheckoutPage } from '@/components/checkout/checkout-page'
import { Breadcrumb } from '@/components/layout/breadcrumb'

export const Route = createFileRoute('/pagamento')({
  component: PaymentPage,
})

function PaymentPage() {
  return (
    <RequireAuth>
      {(user) => (
        <div className="mx-auto w-full max-w-[1264px] px-7 pt-[32px] pb-24 md:px-8 md:pt-[33px]">
          <Breadcrumb
            className="max-lg:hidden"
            items={[
              { label: 'Início', to: '/' },
              { label: 'Mercado', to: '/', hash: 'mercado' },
              { label: 'Pagamento' },
            ]}
          />
          <h1 className="sr-only max-lg:hidden">Pagamento</h1>
          <CheckoutPage user={user} />
        </div>
      )}
    </RequireAuth>
  )
}
