import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/register-form'
import { getSafeRedirect, validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: validateAuthSearch,
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()

  return (
    <div className="mx-auto w-full max-w-[1264px] px-4 py-10 md:px-8 md:py-16">
      <RegisterForm redirect={getSafeRedirect(redirect)} />
    </div>
  )
}
