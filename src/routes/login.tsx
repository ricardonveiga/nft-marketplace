import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/login-form'
import { getSafeRedirect, validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  component: LoginPage,
})

function LoginPage() {
  const { redirect, reason } = Route.useSearch()

  return (
    <div className="mx-auto w-full max-w-[1264px] px-4 py-10 md:px-8 md:py-16">
      <LoginForm
        redirect={getSafeRedirect(redirect)}
        expired={reason === 'expired'}
      />
    </div>
  )
}
