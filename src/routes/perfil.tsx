import { Link, createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/components/auth/require-auth'
import { AvatarEditor } from '@/components/profile/avatar-editor'
import { PasswordForm } from '@/components/profile/password-form'
import { ProfileForm } from '@/components/profile/profile-form'

export const Route = createFileRoute('/perfil')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <RequireAuth>
      {(user) => (
        <div className="mx-auto w-full max-w-[1264px] px-6 py-8 md:px-8 md:py-12">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-heading">Perfil do colecionador</h1>
            <p className="text-sm text-text-secondary">
              Atualize seus dados e sua foto. Para pagar, veja também suas{' '}
              <Link to="/carteiras" className="underline underline-offset-4 hover:text-foreground">
                carteiras
              </Link>
              .
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
            <section aria-label="Foto e identificação" className="flex flex-col gap-6 rounded-lg bg-card p-6">
              <AvatarEditor user={user} />
              <div className="flex flex-col items-center gap-1 border-t border-border pt-4 text-center">
                <p data-testid="profile-name" className="text-base font-bold">
                  {user.name}
                </p>
                <p data-testid="profile-email" className="text-sm text-text-secondary">
                  {user.email}
                </p>
              </div>
            </section>

            <div className="flex flex-col gap-6">
              <ProfileForm user={user} />
              <PasswordForm />
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  )
}
