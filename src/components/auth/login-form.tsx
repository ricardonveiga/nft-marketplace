import { isAxiosError } from 'axios'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useLogin } from '@/hooks/use-session'
import {
  validateLogin,
  type FieldErrors,
  type LoginFields,
} from '@/lib/validation'
import type { ApiErrorBody } from '@/types/auth'
import { AuthCard } from './auth-card'
import { AuthField, PasswordField } from './auth-field'
import { FacebookMark, GoogleMark } from './social-icons'

type LoginFormProps = {
  /** Caminho interno para onde voltar depois de entrar. */
  redirect: string
  expired?: boolean
}

function SocialButton({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Em breve"
      onClick={(event) => event.preventDefault()}
      className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-[2px] border border-border text-[13px] font-medium text-text-secondary"
    >
      {icon}
      {children}
    </button>
  )
}

export function LoginForm({ redirect, expired }: LoginFormProps) {
  const login = useLogin()

  const [values, setValues] = useState<LoginFields>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<LoginFields>>({})
  const [formError, setFormError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

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
    <AuthCard
      mode="login"
      redirect={redirect}
      expired={expired}
      subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-[340px] flex-col gap-3 px-6 pt-6 sm:px-0"
      >
        <AuthField
          tone="outline"
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
        <PasswordField
          tone="outline"
          label="Senha"
          name="password"
          placeholder="***********"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={(value) => setField('password', value)}
          inputRef={passwordRef}
        />

        <p
          aria-disabled="true"
          title="Em breve"
          className="cursor-not-allowed self-end text-sm leading-4 text-text-accent"
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
          className="mt-3 h-[45px] w-full rounded-[7px] text-base font-bold"
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      {/* Login social está fora do escopo: os botões aparecem como no Figma, mas ficam inertes. */}
      <div className="pb-8">
        <div role="separator" className="mt-[23px] flex items-center gap-3 text-[13px] leading-4">
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          Ou continue com
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
        <div className="mx-auto mt-[13px] flex w-full max-w-[340px] flex-col gap-3 px-6 sm:px-0">
          <SocialButton icon={<GoogleMark />}>Continuar com Google</SocialButton>
          <SocialButton icon={<FacebookMark />}>Continuar com Facebook</SocialButton>
        </div>
      </div>
    </AuthCard>
  )
}
