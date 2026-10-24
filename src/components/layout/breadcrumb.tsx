import { Link } from '@tanstack/react-router'

type Crumb = { label: string; to?: '/' | '/carrinho'; hash?: string }

/** Trilha "Início / Mercado / Pagamento" do Figma; o último item é a página atual. */
export function Breadcrumb({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-x-2 text-[15px] leading-4 font-bold">
        {items.map((item, index) => {
          const last = index === items.length - 1

          return (
            <li key={item.label} className="flex items-center gap-2">
              {last || !item.to ? (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              ) : (
                <Link to={item.to} hash={item.hash} className="hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring">
                  {item.label}
                </Link>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
