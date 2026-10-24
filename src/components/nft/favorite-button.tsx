import { Link, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites'
import { useSession } from '@/hooks/use-session'
import { getSafeRedirect } from '@/lib/redirect'

// Figma: botão vazado de 129 × 40 com o coração e o texto "Favoritar".
const buttonClass =
  'inline-flex h-10 w-[129px] items-center justify-center gap-2 rounded-[3px] border border-primary text-sm text-foreground transition-colors hover:bg-surface-featured focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Favoritar. Visitantes são levados ao login e voltam para o mesmo NFT;
 * usuários autenticados alternam o favorito (com reversão se a API falhar).
 */
export function FavoriteButton({ nftId, name }: { nftId: string; name: string }) {
  const { data: user } = useSession()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const href = useRouterState({ select: (state) => state.location.href })
  const [error, setError] = useState('')
  const redirect = getSafeRedirect(href)

  if (!user) {
    return (
      <Link
        to="/login"
        search={redirect === '/' ? {} : { redirect }}
        aria-label={`Entrar para favoritar ${name}`}
        className={buttonClass}
      >
        <Heart className="size-5 text-text-accent" strokeWidth={1.5} aria-hidden="true" />
        Favoritar
      </Link>
    )
  }

  const favorited = favorites.data?.includes(nftId) ?? false

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        aria-label={`Favoritar ${name}`}
        aria-pressed={favorited}
        disabled={toggle.isPending || favorites.isPending}
        onClick={() => {
          setError('')
          toggle.mutate(
            { nftId, favorite: !favorited },
            {
              onError: () =>
                setError('Não foi possível atualizar seus favoritos. Tente novamente.'),
            },
          )
        }}
        className={`${buttonClass} disabled:opacity-60`}
      >
        <Heart
          className={`size-5 text-text-accent ${favorited ? 'fill-current' : ''}`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        Favoritar
      </button>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
