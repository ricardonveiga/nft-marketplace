import { useState, type FormEvent } from 'react'
import facebookIcon from '@/assets/icons/facebook.svg'
import instagramIcon from '@/assets/icons/instagram.svg'
import linkedinIcon from '@/assets/icons/linkedin.svg'
import twitterIcon from '@/assets/icons/twitter.svg'
import youtubeIcon from '@/assets/icons/youtube.svg'

const features = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const linkColumns = [
  {
    title: 'Meu perfil',
    links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
]

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: facebookIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: instagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: twitterIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: linkedinIcon },
  { label: 'YouTube', href: 'https://youtube.com', icon: youtubeIcon },
]

const columnsClass = 'lg:grid-cols-[1fr_1fr_1fr_228px]'
const featureColumnsClass = 'lg:grid-cols-[1fr_1fr_1fr_357px]'
const separatedClass = 'lg:border-l lg:border-primary'

function NewsletterForm() {
  const [notice, setNotice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('Inscrição indisponível nesta demonstração.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg leading-4">Antecipe-se ao próximo lançamento</h2>
      <div className="flex h-10 rounded-md bg-surface-dark shadow-[0_0_10px_rgba(10,6,4,0.45)]">
        <input
          type="email"
          name="email"
          aria-label="Seu e-mail"
          placeholder="digite seu e-mail..."
          className="min-w-0 flex-1 rounded-l-md bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="w-[85px] shrink-0 rounded-r-md bg-primary text-lg font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          Enviar
        </button>
      </div>
      <p className="text-[13px] leading-[22px] text-text-secondary">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
      <p role="status" className="text-[13px] leading-[22px] text-text-accent">
        {notice}
      </p>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1264px] px-4 pb-6 md:px-8 print:hidden">
      <div className="overflow-hidden rounded-md">
        <div className="bg-card p-8">
          <div className={`grid gap-8 md:grid-cols-2 lg:gap-0 ${featureColumnsClass}`}>
            {features.map(({ letter, title, text }, index) => (
              <section
                key={title}
                className={`flex flex-col gap-3 px-4 ${index > 0 ? separatedClass : ''}`}
              >
                <div
                  aria-hidden="true"
                  className="grid size-[74px] place-items-center rounded-full bg-primary text-heading font-bold text-primary-foreground"
                >
                  {letter}
                </div>
                <h2 className="text-[17px] leading-4">{title}</h2>
                <p className="max-w-[204px] text-sm leading-[22px] text-text-secondary">
                  {text}
                </p>
              </section>
            ))}
            <div className={`px-4 ${separatedClass}`}>
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="bg-surface-dark p-8">
          <div className={`grid items-center gap-6 md:grid-cols-2 ${columnsClass}`}>
            <p className="text-sm font-bold tracking-[1.4px]">KURIO</p>
            <p className="text-sm leading-[22px]">
              Feito para colecionadores,
              <br />
              criadores e cultura
            </p>
            <a
              href="mailto:contato@email.com"
              className="text-sm leading-[22px] hover:text-text-accent"
            >
              contato@email.com
            </a>
            <p className="text-sm leading-[22px]">+55 11 4002 8922</p>
          </div>
        </div>

        <div className="bg-card p-8">
          <div
            className={`grid gap-8 sm:grid-cols-2 lg:gap-x-10 xl:gap-x-[124px] ${columnsClass}`}
          >
            {linkColumns.map(({ title, links }) => (
              <nav key={title} aria-label={title} className="flex flex-col gap-2">
                <h2 className="text-lg leading-4">{title}</h2>
                <ul>
                  {links.map((label) => (
                    <li
                      key={label}
                      title="Em breve"
                      className="cursor-default text-sm leading-[30px]"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div className="flex flex-col gap-8">
              <section className="flex flex-col gap-5">
                <h2 className="text-lg leading-4">Redes sociais</h2>
                <ul className="flex gap-2">
                  {socialLinks.map(({ label, href, icon }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="block rounded-md focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <img src={icon} alt="" className="size-8" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-lg leading-4">Carteiras compatíveis</h2>
                <p className="flex h-[26px] items-center justify-center whitespace-pre rounded-md border border-border-soft bg-surface-dark text-[9px] font-bold tracking-[0.1px] text-text-accent">
                  {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
                </p>
              </section>
            </div>
          </div>
        </div>

        <p className="bg-background px-4 text-center text-sm leading-[30px]">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
