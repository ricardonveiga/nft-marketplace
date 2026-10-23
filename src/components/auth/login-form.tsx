import { useRouter } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useLogin, useSession } from '@/hooks/use-session'
import {
  validateLogin,
  type FieldErrors,
  type LoginFields,
} from '@/lib/validation'
import type { ApiErrorBody } from '@/types/auth'

type LoginFormProps = {
  /** Caminho interno para onde voltar depois de entrar. */
  redirect: string
  expired?: boolean
}

const inputClass =
  'h-10 w-full rounded-md bg-surface-dark px-4 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive'

type FieldProps = {
  label: string
  name: keyof LoginFields
  type: string
  placeholder: string
  autoComplete: string
  value: string
  error?: string
  onChange: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  trailing?: React.ReactNode
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  value,
  error,
  onChange,
  inputRef,
  trailing,
}: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
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
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} ${trailing ? 'pr-12' : ''}`}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function LoginForm({ redirect, expired }: LoginFormProps) {
  const router = useRouter()
  const login = useLogin()
  const { data: user } = useSession()

  const [values, setValues] = useState<LoginFields>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<LoginFields>>({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Entrou (agora ou em outra aba): retoma o fluxo de onde o usuário veio.
  useEffect(() => {
    if (user) {
      router.history.replace(redirect)
    }
  }, [user, redirect, router])

  function setField(name: keyof LoginFields, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function focusFirstError(found: FieldErrors<LoginFields>) {
    if (found.email) {
      emailRef.current?.focus()
    } else if (found.password) {
      passwordRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (login.isPending) {
      return
    }

    setFormError('')
    const found = validateLogin(values)
    setErrors(found)

    if (found.email || found.password) {
      focusFirstError(found)

      return
    }

    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onError: (error) => {
          const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined

          if (body?.code === 'validation_error' && body.errors) {
            setErrors(body.errors)
            focusFirstError(body.errors)
          } else if (body?.code === 'invalid_credentials') {
            setFormError(body.message ?? 'E-mail ou senha incorretos.')
          } else {
            setFormError('Não foi possível entrar agora. Tente novamente.')
          }
        },
      },
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-[500px] overflow-hidden rounded-xl border-b-[10px] border-primary bg-card shadow-[0_0_30px_rgba(10,6,4,0.45)]">
      <button
        type="button"
        aria-label="Fechar e voltar"
        onClick={() => router.history.replace(redirect)}
        className="absolute top-3 right-3 grid size-[18px] place-items-center text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <X className="size-[18px]" aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center gap-10 px-6 pt-12">
        <div className="flex items-center gap-4">
          <h1 className="text-base text-text-accent">Entrar</h1>
          <span aria-hidden="true" className="h-5 w-px bg-border-soft" />
          <span
            aria-disabled="true"
            title="Em breve"
            className="cursor-not-allowed text-base text-foreground/60"
          >
            Criar conta
          </span>
        </div>
        <p className="max-w-[404px] text-center text-sm leading-4 text-text-secondary">
          Entre para gerenciar sua carteira, coleção e perfil de criador.
        </p>
      </div>

      {expired && (
        <p
          role="status"
          className="mx-auto mt-6 w-full max-w-[340px] px-6 text-center text-sm text-text-accent sm:px-0"
        >
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-[340px] flex-col gap-3 px-6 pt-6 pb-10 sm:px-0"
      >
        <Field
          label="E-mail"
          name="email"
          type="email"
          placeholder="contato@email.com"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => setField('email', value)}
          inputRef={emailRef}
        />
        <Field
          label="Senha"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="***********"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={(value) => setField('password', value)}
          inputRef={passwordRef}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center text-text-secondary focus-visible:outline-2 focus-visible:outline-ring"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          }
        />

        <p
          aria-disabled="true"
          title="Em breve"
          className="cursor-not-allowed self-end text-sm leading-4 text-text-secondary"
        >
          Esqueceu a senha?
        </p>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={login.isPending}
          aria-busy={login.isPending}
          className="mt-3 h-[45px] w-full rounded-md text-base font-bold"
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
