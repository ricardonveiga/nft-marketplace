import { Link } from '@tanstack/react-router'

const socialLinks = [
  { label: 'X', href: 'https://x.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Discord', href: 'https://discord.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
]

const linkClass =
  'text-sm text-muted-foreground transition-colors hover:text-foreground'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div className="space-y-3">
          <p className="text-2xl font-bold uppercase tracking-widest text-primary">
            Kurio
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Marketplace para descobrir, colecionar e negociar NFTs.
          </p>
        </div>

        <nav aria-label="Rodapé" className="space-y-3">
          <h2 className="text-sm">Explorar</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/" className={linkClass}>
                Início
              </Link>
            </li>
            <li>
              <Link to="/" hash="mercado" className={linkClass}>
                Mercado
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-sm">Redes sociais</h2>
          <ul className="space-y-2">
            {socialLinks.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kurio. Todos os direitos reservados.
      </div>
    </footer>
  )
}
