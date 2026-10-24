import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ReactNode, type RefObject } from 'react'

// Campos dos formulários de perfil, carteiras e pagamento (Figma): rótulo de 15 px com asterisco
// laranja nos obrigatórios, caixa de 40 px com borda de 1 px que fica laranja no foco.
const boxClass =
  'h-10 w-full rounded-[2px] border border-border bg-transparent px-3.5 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:border-primary aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-70 read-only:cursor-default'

function gapOf(roomy?: boolean, snug?: boolean) {
  return roomy ? 'gap-[17px]' : snug ? 'gap-[11px]' : 'gap-[7px]'
}

type BaseProps = {
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  /** Rótulo mais afastado do campo (telas de perfil e carteiras). */
  roomy?: boolean
  /** Distância intermediária (campos de senha do perfil). */
  snug?: boolean
}

function Label({
  htmlFor,
  label,
  required,
  hidden,
  spacedStar,
}: {
  htmlFor: string
  label: string
  required?: boolean
  hidden?: boolean
  spacedStar?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className={hidden ? 'sr-only' : 'block h-[17px] text-[15px] leading-[17px] text-foreground'}>
      {label}
      {required && (
        <span
          aria-hidden="true"
          className={`${spacedStar ? 'ml-[5px]' : 'ml-px'} text-lg leading-[17px] font-bold text-text-accent`}
        >
          *
        </span>
      )}
    </label>
  )
}

function Message({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-text-secondary">
          {hint}
        </p>
      )}
    </>
  )
}

function describedBy(id: string, error?: string, hint?: string) {
  return [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
}

type TextFieldProps = BaseProps & {
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  readOnly?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  /** Mostra o olho de mostrar/ocultar (campos de senha). */
  reveal?: boolean
  /** Rótulo só para leitores de tela (o Figma não mostra o texto). */
  hideLabel?: boolean
}

/** Campo de texto com rótulo, asterisco, erro e ajuda associados. `label` vazio = só leitores de tela. */
export function TextField({
  label,
  required,
  error,
  hint,
  className,
  roomy,
  snug,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  readOnly,
  inputRef,
  reveal,
  hideLabel,
}: TextFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div className={`flex flex-col ${gapOf(roomy, snug)} ${className ?? ''}`}>
      <Label htmlFor={id} label={label} required={required} hidden={hideLabel} />
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={reveal ? (visible ? 'text' : 'password') : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onChange={(event) => onChange(event.target.value)}
          className={`${boxClass} ${reveal ? 'pr-11' : ''}`}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center text-brand-secondary focus-visible:outline-2 focus-visible:outline-ring"
          >
            {visible ? (
              <Eye className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <EyeOff className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      <Message id={id} error={error} hint={hint} />
    </div>
  )
}

type SelectFieldProps = BaseProps & {
  name: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<string | { value: string; label: string }>
  placeholder: string
  disabled?: boolean
  selectRef?: RefObject<HTMLSelectElement | null>
}

/** Select nativo estilizado, com a seta do Figma. */
export function SelectField({
  label,
  required,
  error,
  hint,
  className,
  roomy,
  snug,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  selectRef,
}: SelectFieldProps) {
  const id = useId()

  return (
    <div className={`flex flex-col ${gapOf(roomy, snug)} ${className ?? ''}`}>
      <Label htmlFor={id} label={label} required={required} />
      <div className="relative">
        <select
          ref={selectRef}
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onChange={(event) => onChange(event.target.value)}
          className={`${boxClass} cursor-pointer appearance-none pr-10 ${value ? '' : 'text-brand-secondary'}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => {
            const item = typeof option === 'string' ? { value: option, label: option } : option

            return (
              <option key={item.value} value={item.value} className="bg-card text-foreground">
                {item.label}
              </option>
            )
          })}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
        />
      </div>
      <Message id={id} error={error} hint={hint} />
    </div>
  )
}

type EnsFieldProps = BaseProps & {
  name: string
  value: string
  onChange: (value: string) => void
  suffix: string
  suffixOptions: readonly string[]
  onSuffixChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  /** Espaço antes do asterisco (o Figma do perfil escreve "Nome ENS *"). */
  spacedStar?: boolean
}

/** "Nome ENS": seletor do sufixo (.eth) e o nome, lado a lado (Figma). */
export function EnsField({
  label,
  required,
  error,
  hint,
  className,
  roomy,
  snug,
  name,
  value,
  onChange,
  suffix,
  suffixOptions,
  onSuffixChange,
  inputRef,
  spacedStar,
}: EnsFieldProps) {
  const id = useId()

  return (
    <div className={`flex flex-col ${gapOf(roomy, snug)} ${className ?? ''}`}>
      <Label htmlFor={id} label={label} required={required} spacedStar={spacedStar} />
      <div className="flex gap-2.5">
        <div className="relative w-[79px] shrink-0">
          <select
            aria-label="Sufixo do nome ENS"
            value={suffix}
            onChange={(event) => onSuffixChange(event.target.value)}
            className={`${boxClass} cursor-pointer appearance-none pr-8 pl-3`}
          >
            {suffixOptions.map((option) => (
              <option key={option} value={option} className="bg-card">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
          />
        </div>
        <input
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          autoComplete="off"
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onChange={(event) => onChange(event.target.value)}
          className={`${boxClass} min-w-0 flex-1`}
        />
      </div>
      <Message id={id} error={error} hint={hint} />
    </div>
  )
}

type TextareaFieldProps = BaseProps & {
  name: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

export function TextareaField({
  label,
  required,
  error,
  hint,
  className,
  name,
  value,
  onChange,
  maxLength,
  textareaRef,
}: TextareaFieldProps) {
  const id = useId()

  return (
    <div className={`flex flex-col gap-[11px] ${className ?? ''}`}>
      <Label htmlFor={id} label={label} required={required} />
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event) => onChange(event.target.value)}
        className="h-[152px] w-full resize-none rounded-[2px] border border-border bg-transparent px-3.5 py-3 text-sm text-foreground outline-none focus-visible:border-primary aria-[invalid=true]:border-destructive"
      />
      <Message id={id} error={error} hint={hint} />
    </div>
  )
}

/** Radio/checkbox com anel laranja (Figma: "Usar outra carteira?"). */
export function RingCheck({
  checked,
  onChange,
  children,
  type = 'checkbox',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  type?: 'checkbox' | 'radio'
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[15px] leading-[17px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ring">
      <input
        type={type}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="grid size-4 shrink-0 place-items-center rounded-full border-2 border-primary peer-checked:[&>span]:opacity-100"
      >
        <span className="size-2 rounded-full bg-primary opacity-0" />
      </span>
      {children}
    </label>
  )
}
