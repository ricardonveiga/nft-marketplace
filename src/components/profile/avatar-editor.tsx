import { useRef, useState, type ChangeEvent } from 'react'
import { Image as ImageIcon } from 'lucide-react'
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
    <div className="-mt-[6px] flex flex-col gap-[9px]">
      <span className="text-[15px] leading-[17px]">Avatar</span>

      <div className="flex items-center">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Foto de perfil de ${user.name}`}
            data-testid="profile-avatar"
            width={50}
            height={50}
            className="size-[50px] rounded-full border border-border object-cover"
          />
        ) : (
          <div
            data-testid="profile-avatar-fallback"
            role="img"
            aria-label={`Sem foto de perfil. Iniciais de ${user.name}`}
            title={initialsOf(user.name)}
            className="grid size-[50px] place-items-center rounded-full border border-border bg-avatar text-primary"
          >
            <ImageIcon className="size-[22px]" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}

        <input
          ref={inputRef}
          id="avatar-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          disabled={busy}
          title="PNG, JPEG ou WebP, até 2 MB."
          className="peer sr-only"
        />
        <label
          htmlFor="avatar-input"
          title="PNG, JPEG ou WebP, até 2 MB."
          className="ml-6 inline-flex h-10 w-[98px] cursor-pointer items-center rounded-[3px] bg-primary pr-3 pl-[25px] text-sm font-bold text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Alterar'}
        </label>

        <button
          type="button"
          disabled={busy || !user.avatarUrl}
          onClick={handleRemove}
          className="ml-[21px] text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Remover
        </button>
      </div>

      <p role="status" className="text-sm text-text-accent empty:hidden">
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
