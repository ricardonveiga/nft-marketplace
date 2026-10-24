import { isAxiosError } from 'axios'
import { useRef, useState, type FormEvent } from 'react'
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
import { SocialLogin } from './social-login'

type LoginFormProps = {
  /** Caminho interno para onde voltar depois de entrar. */
  redirect: string
  expired?: boolean
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
        className="mx-auto flex w-full max-w-[340px] flex-col gap-3 px-6 pt-6 sm:px-0 max-md:max-w-none max-md:px-7 max-md:pt-[37px]"
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
          className="mt-3 h-[45px] w-full rounded-[7px] text-base font-bold max-md:mt-[28px] max-md:h-[60px] max-md:rounded-xl"
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <SocialLogin />
    </AuthCard>
  )
}
