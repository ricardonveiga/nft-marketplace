import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '@/components/auth/require-auth'
import { AccountSidebar } from '@/components/profile/account-sidebar'
import { ProfileForm } from '@/components/profile/profile-form'

export const Route = createFileRoute('/perfil')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <RequireAuth>
      {(user) => (
        <div className="mx-auto grid w-full max-w-[1264px] items-start gap-8 px-6 pt-[32px] pb-24 md:px-8 lg:grid-cols-[310px_1fr] lg:gap-x-[28px]">
          <AccountSidebar />

          <section aria-labelledby="perfil-titulo">
            <h1 id="perfil-titulo" className="-mt-[2px] mb-[34px] text-base leading-5 font-bold">
              Perfil do colecionador
            </h1>
            <ProfileForm user={user} />
          </section>
        </div>
      )}
    </RequireAuth>
  )
}
