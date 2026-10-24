import { isAxiosError } from 'axios'
import { useRef, useState, type FormEvent } from 'react'
import { EnsField, TextField } from '@/components/forms/fields'
import { AvatarEditor } from '@/components/profile/avatar-editor'
import { Button } from '@/components/ui/button'
import { useChangePassword, useUpdateProfile } from '@/hooks/use-profile'
import { isForbidden } from '@/lib/api-error'
import {
  validatePasswordChange,
  validateProfile,
  type FieldErrors,
  type PasswordChangeFields,
  type ProfileFields,
} from '@/lib/validation'
import type { ApiErrorBody, User } from '@/types/auth'
import { ENS_SUFFIXES } from '@/types/wallet'

type Field = keyof ProfileFields | keyof PasswordChangeFields
type FormErrors = FieldErrors<ProfileFields> & FieldErrors<PasswordChangeFields> & { form?: string }

const FOCUS_ORDER: Field[] = [
  'name',
  'username',
  'email',
  'ensName',
  'walletNickname',
  'currentPassword',
  'newPassword',
  'confirmPassword',
]

const emptyPassword: PasswordChangeFields = { currentPassword: '', newPassword: '', confirmPassword: '' }

const [ENS_SUFFIX] = ENS_SUFFIXES

type ProfileValues = Omit<ProfileFields, 'ensName'> & { ensLabel: string }

function valuesOf(user: User): ProfileValues {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    ensLabel: user.ensName.endsWith(ENS_SUFFIX) ? user.ensName.slice(0, -ENS_SUFFIX.length) : user.ensName,
    walletNickname: user.walletNickname,
  }
}

function toFields(values: ProfileValues): ProfileFields {
  const label = values.ensLabel.trim()

  return {
    name: values.name,
    username: values.username,
    email: values.email,
    ensName: label ? `${label}${ENS_SUFFIX}` : '',
    walletNickname: values.walletNickname,
  }
}

function errorsOf(error: unknown): FormErrors {
  const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined

  if (isForbidden(error)) {
    return { form: 'Você não tem permissão para alterar este perfil.' }
  }

  return body?.errors ? { ...body.errors } : { form: 'Não foi possível salvar os dados. Tente novamente.' }
}

/** "Perfil do colecionador" (Figma): dados, avatar e alteração de senha, com um único "Salvar". */
export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const change = useChangePassword()
  const [values, setValues] = useState<ProfileValues>(() => valuesOf(user))
  const [password, setPassword] = useState<PasswordChangeFields>(emptyPassword)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saved, setSaved] = useState('')
  const [pending, setPending] = useState(false)
  const refs = {
    name: useRef<HTMLInputElement>(null),
    username: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    ensName: useRef<HTMLInputElement>(null),
    walletNickname: useRef<HTMLInputElement>(null),
    currentPassword: useRef<HTMLInputElement>(null),
    newPassword: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  }

  const original = valuesOf(user)
  const profileDirty = (Object.keys(original) as Array<keyof ProfileValues>).some(
    (key) => values[key].trim() !== original[key],
  )
  const passwordFilled = Object.values(password).some(Boolean)

  function clear(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
    setSaved('')
  }

  function setValue(field: keyof ProfileValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    clear(field === 'ensLabel' ? 'ensName' : field)
  }

  function setPasswordField(field: keyof PasswordChangeFields, value: string) {
    setPassword((current) => ({ ...current, [field]: value }))
    clear(field)
  }

  function focusFirstError(found: FormErrors) {
    const field = FOCUS_ORDER.find((key) => found[key])

    if (field) {
      refs[field].current?.focus()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending) {
      return
    }

    setSaved('')

    if (!profileDirty && !passwordFilled) {
      setErrors({})
      setSaved('Nenhuma alteração para salvar.')

      return
    }

    // Os dados do perfil são sempre validados (são obrigatórios); a senha, só se foi preenchida.
    const found: FormErrors = {
      ...validateProfile(toFields(values)),
      ...(passwordFilled ? validatePasswordChange(password) : {}),
    }
    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    const messages: string[] = []
    setPending(true)

    try {
      if (profileDirty) {
        const fields = toFields(values)
        const updated = await update.mutateAsync({
          name: fields.name.trim(),
          email: fields.email.trim(),
          username: fields.username.trim(),
          ensName: fields.ensName,
          walletNickname: fields.walletNickname.trim(),
        })

        setValues(valuesOf(updated))
        messages.push('Dados atualizados.')
      }

      if (passwordFilled) {
        await change.mutateAsync({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        })
        setPassword(emptyPassword)
        messages.push('Senha alterada.')
      }

      setSaved(messages.join(' '))
    } catch (error) {
      const fieldErrors = errorsOf(error)

      // Os dados já salvos antes da falha continuam avisados.
      setSaved(messages.join(' '))
      setErrors(fieldErrors)
      focusFirstError(fieldErrors)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-x-[28px] gap-y-[29px] lg:grid-cols-2">
      <div className="flex flex-col gap-[29px]">
        <TextField
          labelGap={17}
          required
          label="Nome de exibição"
          name="name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(value) => setValue('name', value)}
          inputRef={refs.name}
        />
        <TextField
          labelGap={17}
          required
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => setValue('email', value)}
          inputRef={refs.email}
        />
        <TextField
          labelGap={17}
          required
          label="Apelido da carteira"
          name="walletNickname"
          value={values.walletNickname}
          error={errors.walletNickname}
          onChange={(value) => setValue('walletNickname', value)}
          inputRef={refs.walletNickname}
        />

        <fieldset className="mt-px flex flex-col gap-[23px]">
          <legend className="mb-[21px] text-base leading-5 font-bold">Alterar senha</legend>
          <TextField
            labelGap={11}
            reveal
            label="Senha atual"
            name="currentPassword"
            autoComplete="current-password"
            value={password.currentPassword}
            error={errors.currentPassword}
            onChange={(value) => setPasswordField('currentPassword', value)}
            inputRef={refs.currentPassword}
          />
          <TextField
            labelGap={11}
            reveal
            label="Nova senha"
            name="newPassword"
            autoComplete="new-password"
            value={password.newPassword}
            error={errors.newPassword}
            onChange={(value) => setPasswordField('newPassword', value)}
            inputRef={refs.newPassword}
          />
          <TextField
            labelGap={11}
            reveal
            label="Confirmar nova senha"
            name="confirmPassword"
            autoComplete="new-password"
            value={password.confirmPassword}
            error={errors.confirmPassword}
            onChange={(value) => setPasswordField('confirmPassword', value)}
            inputRef={refs.confirmPassword}
          />
        </fieldset>

      </div>

      <div className="flex flex-col gap-[29px]">
        <TextField
          labelGap={17}
          required
          label="Nome de usuário"
          name="username"
          autoComplete="username"
          value={values.username}
          error={errors.username}
          onChange={(value) => setValue('username', value)}
          inputRef={refs.username}
        />
        <EnsField
          labelGap={17}
          required
          spacedStar
          label="Nome ENS"
          name="ensName"
          value={values.ensLabel}
          error={errors.ensName}
          onChange={(value) => setValue('ensLabel', value)}
          suffix={ENS_SUFFIX}
          suffixOptions={ENS_SUFFIXES}
          onSuffixChange={() => undefined}
          inputRef={refs.ensName}
        />
        <AvatarEditor user={user} />
      </div>

      <div className="flex flex-col gap-[29px] lg:col-start-1">
        {errors.form && (
          <p role="alert" className="text-sm text-destructive">
            {errors.form}
          </p>
        )}

        <div className="mt-[3px] flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="h-10 w-[131px] rounded-[3px] text-sm font-bold"
          >
            {pending ? 'Salvando…' : 'Salvar'}
          </Button>
          <p role="status" className="text-sm text-text-accent empty:hidden">
            {saved}
          </p>
        </div>
      </div>
    </form>
  )
}
