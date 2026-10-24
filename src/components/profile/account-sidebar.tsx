import { Link } from '@tanstack/react-router'
import {
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  SquareActivity,
  TriangleAlert,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useLogout } from '@/hooks/use-session'

// Figma: itens de 45 px, ícone laranja de 18 px e texto de 15 px. A largura da área do ícone varia
// por item (o texto não começa sempre no mesmo x), por isso cada um traz a sua.
const itemClass = 'relative flex h-[45px] w-full items-center pl-4 text-[15px] leading-5 text-text-accent'
const activeBar =
  'before:absolute before:top-0 before:left-0 before:h-full before:w-1.5 before:bg-primary'

function Icon({ icon: Component, width }: { icon: LucideIcon; width: number }) {
  return (
    <span aria-hidden="true" style={{ width }} className="flex shrink-0 items-center text-primary">
      <Component className="size-[18px]" strokeWidth={1.5} />
    </span>
  )
}

const soonItems: Array<{ label: string; icon: LucideIcon; width: number }> = [
  { label: 'Atividade', icon: ShoppingCart, width: 29 },
  { label: 'Lista de interesse', icon: Heart, width: 28 },
  { label: 'Ofertas', icon: SquareActivity, width: 29 },
  { label: 'Arquivos baixados', icon: Download, width: 29 },
  { label: 'Suporte', icon: TriangleAlert, width: 29 },
]

/** Menu lateral "Meu perfil" das telas de conta. Itens fora do escopo ficam inertes ("Em breve"). */
export function AccountSidebar() {
  const logout = useLogout()

  return (
    <nav aria-label="Meu perfil" className="bg-card lg:sticky lg:top-6">
      <h2 className="h-11 px-2.5 pt-4 text-lg leading-5 font-bold">Meu perfil</h2>
      <ul>
        <li>
          <Link
            to="/perfil"
            className={itemClass}
            activeProps={{ className: `${itemClass} ${activeBar}`, 'aria-current': 'page' }}
          >
            <Icon icon={User} width={34} />
            Dados do perfil
          </Link>
        </li>
        <li>
          <Link
            to="/carteiras"
            className={itemClass}
            activeProps={{ className: `${itemClass} ${activeBar}`, 'aria-current': 'page' }}
          >
            <Icon icon={MapPin} width={31} />
            Carteiras
          </Link>
        </li>
        {soonItems.map(({ label, icon, width }) => (
          <li key={label}>
            <span aria-disabled="true" title="Em breve" className={`${itemClass} cursor-not-allowed`}>
              <Icon icon={icon} width={width} />
              {label}
            </span>
          </li>
        ))}
      </ul>
      <div className="-mt-px border-t border-sidebar-line">
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className={`${itemClass} h-12 pb-[7px] text-left font-bold disabled:opacity-60`}
        >
          <Icon icon={LogOut} width={27} />
          Sair
        </button>
      </div>
    </nav>
  )
}
