import { isAxiosError } from 'axios'
import { useRef, useState, type FormEvent } from 'react'
import { PasswordField } from '@/components/auth/auth-field'
import { Button } from '@/components/ui/button'
import { useChangePassword } from '@/hooks/use-profile'
import { isForbidden } from '@/lib/api-error'
import {
  validatePasswordChange,
  type FieldErrors,
  type PasswordChangeFields,
} from '@/lib/validation'
import type { ApiErrorBody } from '@/types/auth'

type FormErrors = FieldErrors<PasswordChangeFields> & { form?: string }

const empty: PasswordChangeFields = { currentPassword: '', newPassword: '', confirmPassword: '' }

/** Alteração de senha: exige a senha atual; ao concluir, os campos são limpos. */
export function PasswordForm() {
  const change = useChangePassword()
  const [values, setValues] = useState<PasswordChangeFields>(empty)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saved, setSaved] = useState('')
  const refs = {
    currentPassword: useRef<HTMLInputElement>(null),
    newPassword: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  }

  function setField(field: keyof PasswordChangeFields, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
    setSaved('')
  }

  function focusFirstError(found: FormErrors) {
    const field = (['currentPassword', 'newPassword', 'confirmPassword'] as const).find((key) => found[key])

    if (field) {
      refs[field].current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (change.isPending) {
      return
    }

    setSaved('')
    const found = validatePasswordChange(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setValues(empty)
          setSaved('Senha alterada.')
        },
        onError: (error) => {
          const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined
          const fieldErrors: FormErrors = { ...body?.errors }

          if (isForbidden(error)) {
            fieldErrors.form = 'Você não tem permissão para alterar a senha desta conta.'
          } else if (!body?.errors) {
            fieldErrors.form = 'Não foi possível alterar a senha. Tente novamente.'
          }

          setErrors(fieldErrors)
          focusFirstError(fieldErrors)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-lg bg-card p-6">
      <h2 className="text-lg leading-4">Alterar senha</h2>

      <PasswordField
        showLabel
        label="Senha atual"
        toggleLabel="senha atual"
        name="currentPassword"
        placeholder="***********"
        autoComplete="current-password"
        value={values.currentPassword}
        error={errors.currentPassword}
        onChange={(value) => setField('currentPassword', value)}
        inputRef={refs.currentPassword}
      />
      <PasswordField
        showLabel
        label="Nova senha"
        toggleLabel="nova senha"
        name="newPassword"
        placeholder="***********"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com letras e números."
        value={values.newPassword}
        error={errors.newPassword}
        onChange={(value) => setField('newPassword', value)}
        inputRef={refs.newPassword}
      />
      <PasswordField
        showLabel
        label="Confirmar nova senha"
        toggleLabel="confirmação da nova senha"
        name="confirmPassword"
        placeholder="***********"
        autoComplete="new-password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={(value) => setField('confirmPassword', value)}
        inputRef={refs.confirmPassword}
      />

      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={change.isPending}
          aria-busy={change.isPending}
          className="h-[45px] rounded-md px-6 text-base font-bold"
        >
          {change.isPending ? 'Alterando…' : 'Alterar senha'}
        </Button>
        <p role="status" className="text-sm text-text-accent">
          {saved}
        </p>
      </div>
    </form>
  )
}
