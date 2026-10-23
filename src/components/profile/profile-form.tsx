import { isAxiosError } from 'axios'
import { useRef, useState, type FormEvent } from 'react'
import { AuthField } from '@/components/auth/auth-field'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/hooks/use-profile'
import { isForbidden } from '@/lib/api-error'
import { formatPhone } from '@/lib/phone'
import {
  normalizePhone,
  validateProfile,
  type FieldErrors,
  type ProfileFields,
} from '@/lib/validation'
import type { ApiErrorBody, User } from '@/types/auth'

type FormErrors = FieldErrors<ProfileFields> & { form?: string }

function fieldsOf(user: User): ProfileFields {
  return { name: user.name, email: user.email, phone: user.phone ? formatPhone(user.phone) : '' }
}

/** Dados pessoais do colecionador (nome, e-mail e telefone opcional). */
export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [values, setValues] = useState<ProfileFields>(() => fieldsOf(user))
  const [errors, setErrors] = useState<FormErrors>({})
  const [saved, setSaved] = useState('')
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
  }

  const original = fieldsOf(user)
  const dirty =
    values.name.trim() !== original.name ||
    values.email.trim() !== original.email ||
    normalizePhone(values.phone) !== normalizePhone(original.phone)

  function setField(field: keyof ProfileFields, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
    setSaved('')
  }

  function focusFirstError(found: FormErrors) {
    const field = (['name', 'email', 'phone'] as const).find((key) => found[key])

    if (field) {
      refs[field].current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (update.isPending || !dirty) {
      return
    }

    setSaved('')
    const found = validateProfile(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    update.mutate(
      { name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() },
      {
        onSuccess: (updated) => {
          setValues(fieldsOf(updated))
          setSaved('Dados atualizados.')
        },
        onError: (error) => {
          const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined
          const fieldErrors: FormErrors = { ...body?.errors }

          if (isForbidden(error)) {
            fieldErrors.form = 'Você não tem permissão para alterar este perfil.'
          } else if (!body?.errors) {
            fieldErrors.form = 'Não foi possível salvar os dados. Tente novamente.'
          }

          setErrors(fieldErrors)
          focusFirstError(fieldErrors)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-lg bg-card p-6">
      <h2 className="text-lg leading-4">Dados pessoais</h2>

      <AuthField
        showLabel
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
        showLabel
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
      <AuthField
        showLabel
        label="Telefone (opcional)"
        name="phone"
        type="tel"
        placeholder="(11) 91234-5678"
        autoComplete="tel"
        value={values.phone}
        error={errors.phone}
        onChange={(value) => setField('phone', value)}
        inputRef={refs.phone}
      />

      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={!dirty || update.isPending}
          aria-busy={update.isPending}
          className="h-[45px] rounded-md px-6 text-base font-bold"
        >
          {update.isPending ? 'Salvando…' : 'Salvar alterações'}
        </Button>
        <p role="status" className="text-sm text-text-accent">
          {saved}
        </p>
      </div>
    </form>
  )
}
