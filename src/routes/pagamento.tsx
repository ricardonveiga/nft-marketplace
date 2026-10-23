import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/components/auth/require-auth'
import { CheckoutPage } from '@/components/checkout/checkout-page'

export const Route = createFileRoute('/pagamento')({
  component: PaymentPage,
})

function PaymentPage() {
  return (
    <RequireAuth>
      {(user) => (
        <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
          <h1 className="mb-6 text-heading">Pagamento</h1>
          <CheckoutPage user={user} />
        </div>
      )}
    </RequireAuth>
  )
}
