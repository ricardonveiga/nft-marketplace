import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useRemoveAvatar, useSetAvatar } from '@/hooks/use-profile'
import { getApiErrorMessage } from '@/lib/api-error'
import { AvatarError, prepareAvatar } from '@/lib/image'
import type { User } from '@/types/auth'

type Feedback = { kind: 'success' | 'error'; text: string }

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Foto do perfil: escolher, trocar e remover (a imagem é reduzida no navegador antes de enviar). */
export function AvatarEditor({ user }: { user: User }) {
  const setAvatar = useSetAvatar()
  const removeAvatar = useRemoveAvatar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const busy = setAvatar.isPending || removeAvatar.isPending

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    // Limpa o campo: escolher o mesmo arquivo de novo precisa disparar a mudança outra vez.
    event.target.value = ''

    if (!file) {
      return
    }

    setFeedback(null)

    try {
      const dataUrl = await prepareAvatar(file)

      setAvatar.mutate(dataUrl, {
        onSuccess: () => setFeedback({ kind: 'success', text: 'Foto atualizada.' }),
        onError: (error) =>
          setFeedback({
            kind: 'error',
            text: getApiErrorMessage(error, 'Não foi possível salvar a foto. Tente novamente.'),
          }),
      })
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof AvatarError ? error.message : 'Não foi possível processar esta imagem.',
      })
    }
  }

  function handleRemove() {
    setFeedback(null)
    removeAvatar.mutate(undefined, {
      onSuccess: () => setFeedback({ kind: 'success', text: 'Foto removida.' }),
      onError: (error) =>
        setFeedback({
          kind: 'error',
          text: getApiErrorMessage(error, 'Não foi possível remover a foto. Tente novamente.'),
        }),
    })
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`Foto de perfil de ${user.name}`}
          data-testid="profile-avatar"
          width={128}
          height={128}
          className="size-32 rounded-full object-cover"
        />
      ) : (
        <div
          data-testid="profile-avatar-fallback"
          role="img"
          aria-label={`Sem foto de perfil. Iniciais de ${user.name}`}
          className="grid size-32 place-items-center rounded-full bg-primary text-heading font-bold text-primary-foreground"
        >
          {initialsOf(user.name)}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <input
          ref={inputRef}
          id="avatar-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          disabled={busy}
          className="peer sr-only"
        />
        <label
          htmlFor="avatar-input"
          className="inline-flex h-9 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Alterar foto'}
        </label>

        {user.avatarUrl && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={handleRemove}
            className="h-9 rounded-md px-4 text-sm font-bold"
          >
            Remover foto
          </Button>
        )}
      </div>

      <p className="text-xs text-text-secondary">PNG, JPEG ou WebP, até 2 MB.</p>

      <p role="status" className="min-h-5 text-sm text-text-accent">
        {feedback?.kind === 'success' ? feedback.text : ''}
      </p>
      {feedback?.kind === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          {feedback.text}
        </p>
      )}
    </div>
  )
}
