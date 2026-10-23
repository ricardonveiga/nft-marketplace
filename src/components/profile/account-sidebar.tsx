import { Link } from '@tanstack/react-router'
import { useLogout } from '@/hooks/use-session'

const itemClass = 'flex h-11 items-center rounded-md px-4 text-sm'
const activeClass = `${itemClass} bg-surface-dark font-bold text-text-accent`
const linkClass = `${itemClass} hover:bg-surface-dark`
const soonClass = `${itemClass} cursor-not-allowed opacity-60`

const soonItems = ['Atividade', 'Lista de interesse', 'Ofertas', 'Arquivos baixados', 'Suporte']

/** Menu lateral "Meu perfil" das telas de conta. Itens fora do escopo ficam inertes ("Em breve"). */
export function AccountSidebar() {
  const logout = useLogout()

  return (
    <nav aria-label="Meu perfil" className="rounded-lg bg-card p-4 lg:sticky lg:top-6">
      <h2 className="px-4 pb-3 pt-1 text-lg leading-4">Meu perfil</h2>
      <ul className="flex flex-col gap-1">
        <li>
          <Link to="/perfil" className={linkClass} activeProps={{ className: activeClass, 'aria-current': 'page' }}>
            Dados do perfil
          </Link>
        </li>
        <li>
          <Link
            to="/carteiras"
            className={linkClass}
            activeProps={{ className: activeClass, 'aria-current': 'page' }}
          >
            Carteiras
          </Link>
        </li>
        {soonItems.map((label) => (
          <li key={label}>
            <span aria-disabled="true" title="Em breve" className={soonClass}>
              {label}
            </span>
          </li>
        ))}
        <li>
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            className={`${linkClass} w-full text-left disabled:opacity-60`}
          >
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
