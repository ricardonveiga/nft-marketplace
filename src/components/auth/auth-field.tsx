import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ReactNode, type RefObject } from 'react'

const inputClass =
  'h-10 w-full rounded-md bg-surface-dark px-4 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive'

export type AuthFieldProps = {
  label: string
  name: string
  type?: string
  placeholder: string
  autoComplete: string
  value: string
  error?: string
  /** Texto de ajuda, associado ao campo por aria-describedby. */
  hint?: string
  /** Mostra o rótulo (por padrão é só para leitores de tela, como no Figma do login). */
  showLabel?: boolean
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  trailing?: ReactNode
}

/** Campo dos formulários de autenticação: rótulo (oculto), erro e ajuda associados. */
export function AuthField({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  error,
  hint,
  showLabel,
  onChange,
  inputRef,
  trailing,
}: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={showLabel ? 'text-sm' : 'sr-only'}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClass} ${trailing ? 'pr-12' : ''}`}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      )}
    </div>
  )
}

type PasswordFieldProps = Omit<AuthFieldProps, 'type' | 'trailing'> & {
  /** Nome usado no botão de mostrar/ocultar ("senha", "confirmação de senha"). */
  toggleLabel?: string
}

export function PasswordField({ toggleLabel = 'senha', ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <AuthField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${toggleLabel}`}
          aria-pressed={visible}
          className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center text-text-secondary focus-visible:outline-2 focus-visible:outline-ring"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      }
    />
  )
}
