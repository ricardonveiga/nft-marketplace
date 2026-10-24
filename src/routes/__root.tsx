import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { AuthListener } from '@/components/auth/auth-listener'
import { FiltersDrawerProvider } from '@/components/catalog/filters-drawer'
import { NotFound } from '@/components/layout/not-found'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { ConnectionBanner } from '@/components/realtime/connection-banner'
import { RealtimeProvider } from '@/components/realtime/realtime-provider'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

/** Telas que no mobile (Figma) não mostram o cabeçalho, o rodapé nem a barra inferior do site. */
function isChromeless(pathname: string) {
  return pathname === '/carrinho' || pathname === '/pagamento' || pathname.startsWith('/nft/')
}

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const chromeless = isChromeless(pathname)

  return (
    <FiltersDrawerProvider>
      <AuthListener />
      <RealtimeProvider />
      <div data-chromeless={chromeless} className="flex min-h-screen flex-col pb-[95px] data-[chromeless=true]:max-md:pb-0 md:pb-0">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground print:hidden"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <ConnectionBanner />
        <main id="conteudo" className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <MobileTabBar />
      </div>
    </FiltersDrawerProvider>
  )
}
