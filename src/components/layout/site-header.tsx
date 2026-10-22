import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navLinkClass =
  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring'

const soonClass = `${navLinkClass} cursor-not-allowed opacity-60`

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
        <Link
          to="/"
          className="text-2xl font-bold uppercase tracking-widest text-primary"
        >
          Kurio
        </Link>

        <nav
          aria-label="Principal"
          className="order-last -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto"
        >
          <Link
            to="/"
            className={navLinkClass}
            activeProps={{ className: 'text-foreground' }}
            activeOptions={{ exact: true }}
          >
            Início
          </Link>
          <Link to="/" hash="mercado" className={navLinkClass}>
            Mercado
          </Link>
          <span aria-disabled="true" title="Em breve" className={soonClass}>
            Criadores
          </span>
          <span aria-disabled="true" title="Em breve" className={soonClass}>
            Aprender
          </span>
        </nav>

        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="relative ml-auto min-w-0 flex-1 md:max-w-xs"
        >
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            name="q"
            aria-label="Buscar NFTs"
            placeholder="Buscar NFTs"
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-lg" aria-label="Carrinho">
            <ShoppingCart />
          </Button>
          <Button size="lg">Entrar</Button>
        </div>
      </div>
    </header>
  )
}
