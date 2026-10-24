import { createFileRoute } from '@tanstack/react-router'
import { AuthLayout } from '@/components/auth/auth-layout'
import { LoginForm } from '@/components/auth/login-form'
import { getSafeRedirect, validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  component: LoginPage,
})

function LoginPage() {
  const { redirect, reason } = Route.useSearch()

  return (
    <AuthLayout>
      <LoginForm
        redirect={getSafeRedirect(redirect)}
        expired={reason === 'expired'}
      />
    </AuthLayout>
  )
}
