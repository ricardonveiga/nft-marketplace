export type LoginFields = {
  email: string
  password: string
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmail(value: string) {
  return EMAIL_PATTERN.test(value)
}

export function validateLogin(values: LoginFields): FieldErrors<LoginFields> {
  const errors: FieldErrors<LoginFields> = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!values.password) {
    errors.password = 'Informe sua senha.'
  }

  return errors
}
