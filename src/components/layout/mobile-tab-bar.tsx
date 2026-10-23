import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AccountMenu } from '@/components/auth/account-menu'
import ellipseBackground from '@/assets/tabbar/ellipse.svg'
import heartIcon from '@/assets/tabbar/heart.svg'
import homeIcon from '@/assets/tabbar/home.svg'
import scanIcon from '@/assets/tabbar/scan.svg'
import shopIcon from '@/assets/tabbar/shop.svg'
import userIcon from '@/assets/tabbar/user.svg'
import { useSession } from '@/hooks/use-session'
import { getSafeRedirect } from '@/lib/redirect'

const itemClass =
  'grid size-10 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-ring'

function SoonItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`${label} (em breve)`}
      title="Em breve"
      className={`${itemClass} cursor-not-allowed opacity-70`}
    >
      {children}
    </button>
  )
}

/**
 * Forma do recorte curvo da barra, extraída do Figma (viewBox 151,7 × 94,95).
 * O resto da barra é preenchido por dois blocos flexíveis nas laterais.
 */
function Notch() {
  return (
    <svg
      aria-hidden="true"
      width="151.7"
      height="94.95"
      viewBox="161.15 40 151.7 94.95"
      className="-mx-px shrink-0 text-card"
    >
      <path
        fill="currentColor"
        d="M161.15 40C174.9 40 187.13 48.2 192.98 60.65C200.74 77.18 217.54 88.62 237 88.62C256.46 88.62 273.26 77.17 281.02 60.65C286.87 48.2 299.09 40 312.85 40V134.95H161.15Z"
      />
    </svg>
  )
}

export function MobileTabBar() {
  const session = useSession()
  const href = useRouterState({ select: (state) => state.location.href })
  const redirect = getSafeRedirect(href)

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 h-[95px] md:hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex drop-shadow-[0_-10px_30px_rgba(10,6,4,0.45)]"
      >
        <div className="flex-1 rounded-tl-[29px] bg-card" />
        <Notch />
        <div className="flex-1 rounded-tr-[29px] bg-card" />
      </div>

      <button
        type="button"
        aria-disabled="true"
        aria-label="Escanear (em breve)"
        title="Em breve"
        className="absolute -top-[31px] left-1/2 grid size-[65px] -translate-x-1/2 cursor-not-allowed place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
      >
        <img
          src={ellipseBackground}
          alt=""
          className="absolute inset-0 size-full"
        />
        <img src={scanIcon} alt="" className="relative h-6 w-[26.82px]" />
      </button>

      <ul className="relative flex justify-between pt-[35px]">
        <li className="flex gap-8 pl-[26px]">
          <Link to="/" aria-label="Início" className={itemClass}>
            <img src={homeIcon} alt="" />
          </Link>
          <SoonItem label="Favoritos">
            <img src={heartIcon} alt="" />
          </SoonItem>
        </li>
        <li className="flex gap-[22px] pr-[30px]">
          <SoonItem label="Carrinho">
            <img src={shopIcon} alt="" className="size-5" />
          </SoonItem>
          {session.data ? (
            <AccountMenu user={session.data} variant="tab-bar" />
          ) : (
            <Link
              to="/login"
              search={redirect === '/' ? {} : { redirect }}
              aria-label="Entrar"
              className={itemClass}
            >
              <img src={userIcon} alt="" className="size-5" />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
