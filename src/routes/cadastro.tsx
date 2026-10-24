import { createFileRoute } from '@tanstack/react-router'
import { AuthLayout } from '@/components/auth/auth-layout'
import { RegisterForm } from '@/components/auth/register-form'
import { getSafeRedirect, validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: validateAuthSearch,
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()

  return (
    <AuthLayout top={158}>
      <RegisterForm redirect={getSafeRedirect(redirect)} />
    </AuthLayout>
  )
}
