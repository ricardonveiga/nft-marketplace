import { isAxiosError } from 'axios'
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/hooks/use-session'
import {
  validateRegister,
  type FieldErrors,
  type RegisterFields,
} from '@/lib/validation'
import type { ApiErrorBody } from '@/types/auth'
import { AuthCard } from './auth-card'
import { AuthField, PasswordField } from './auth-field'

type RegisterFormProps = {
  /** Caminho interno para onde voltar depois de criar a conta. */
  redirect: string
}

const emptyValues: RegisterFields = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegisterForm({ redirect }: RegisterFormProps) {
  const register = useRegister()

  const [values, setValues] = useState<RegisterFields>(emptyValues)
  const [errors, setErrors] = useState<FieldErrors<RegisterFields>>({})
  const [formError, setFormError] = useState('')
  const refs: Record<keyof RegisterFields, RefObject<HTMLInputElement | null>> = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  }

  function setField(name: keyof RegisterFields, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function focusFirstError(found: FieldErrors<RegisterFields>) {
    const order: Array<keyof RegisterFields> = ['name', 'email', 'password', 'confirmPassword']
    const first = order.find((field) => found[field])

    if (first) {
      refs[first].current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (register.isPending) {
      return
    }

    setFormError('')
    const found = validateRegister(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    register.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      {
        onError: (error) => {
          const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined

          if (body?.errors && (body.code === 'validation_error' || body.code === 'email_taken')) {
            // Conflito de e-mail e erros de validação do servidor ficam no próprio campo.
            setErrors(body.errors)
            focusFirstError(body.errors)
          } else {
            setFormError('Não foi possível criar a conta agora. Tente novamente.')
          }
        },
      },
    )
  }

  return (
    <AuthCard
      mode="register"
      redirect={redirect}
      subtitle="Crie sua conta para colecionar, comprar e acompanhar seus NFTs."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-[340px] flex-col gap-3 px-6 pt-6 pb-10 sm:px-0"
      >
        <AuthField
          tone="outline"
          label="Nome completo"
          name="name"
          placeholder="Seu nome completo"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(value) => setField('name', value)}
          inputRef={refs.name}
        />
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
          inputRef={refs.email}
        />
        <PasswordField
          tone="outline"
          label="Senha"
          name="password"
          placeholder="***********"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          value={values.password}
          error={errors.password}
          onChange={(value) => setField('password', value)}
          inputRef={refs.password}
        />
        <PasswordField
          tone="outline"
          label="Confirmar senha"
          toggleLabel="confirmação de senha"
          name="confirmPassword"
          placeholder="***********"
          autoComplete="new-password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(value) => setField('confirmPassword', value)}
          inputRef={refs.confirmPassword}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={register.isPending}
          aria-busy={register.isPending}
          className="mt-3 h-[45px] w-full rounded-[7px] text-base font-bold"
        >
          {register.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
    </AuthCard>
  )
}
