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

export type RegisterFields = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const PASSWORD_MIN_LENGTH = 8

/** Regra de senha usada no cadastro (cliente) e na API simulada (servidor). */
export function validatePassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Use letras e números na senha.'
  }

  return undefined
}

export function validateName(name: string): string | undefined {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'Informe seu nome.'
  }

  return trimmed.length < 2 ? 'O nome deve ter pelo menos 2 caracteres.' : undefined
}

export function validateRegister(values: RegisterFields): FieldErrors<RegisterFields> {
  const errors: FieldErrors<RegisterFields> = {}
  const email = values.email.trim()

  errors.name = validateName(values.name)

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  errors.password = values.password
    ? validatePassword(values.password)
    : 'Crie uma senha.'

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme sua senha.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'As senhas não conferem.'
  }

  // Remove as chaves sem erro para `Object.keys(errors).length` refletir a validade.
  for (const key of Object.keys(errors) as Array<keyof RegisterFields>) {
    if (!errors[key]) {
      delete errors[key]
    }
  }

  return errors
}

export type CollectorFields = {
  name: string
  email: string
  phone: string
}

/** Telefone brasileiro com DDD: 10 ou 11 dígitos (aceita máscara, espaços e +55). */
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '')

  return digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
}

export function validatePhone(value: string): string | undefined {
  if (!value.trim()) {
    return 'Informe seu telefone.'
  }

  const digits = normalizePhone(value)

  return digits.length === 10 || digits.length === 11
    ? undefined
    : 'Informe um telefone válido com DDD.'
}

export function validateCollector(values: CollectorFields): FieldErrors<CollectorFields> {
  const errors: FieldErrors<CollectorFields> = {}
  const email = values.email.trim()

  errors.name = validateName(values.name)

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  errors.phone = validatePhone(values.phone)

  for (const key of Object.keys(errors) as Array<keyof CollectorFields>) {
    if (!errors[key]) {
      delete errors[key]
    }
  }

  return errors
}

export type WalletFields = {
  label: string
  address: string
  networks: string[]
}

export function validateWalletLabel(label: string): string | undefined {
  const trimmed = label.trim()

  if (!trimmed) {
    return 'Informe um apelido para a carteira.'
  }

  return trimmed.length < 2 || trimmed.length > 30
    ? 'O apelido deve ter de 2 a 30 caracteres.'
    : undefined
}

export function validateWalletAddress(address: string): string | undefined {
  const trimmed = address.trim()

  if (!trimmed) {
    return 'Informe o endereço da carteira.'
  }

  return /^0x[0-9a-fA-F]{40}$/.test(trimmed)
    ? undefined
    : 'Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais.'
}

export function validateWallet(values: WalletFields): FieldErrors<WalletFields> {
  const errors: FieldErrors<WalletFields> = {}

  errors.label = validateWalletLabel(values.label)
  errors.address = validateWalletAddress(values.address)

  if (values.networks.length === 0) {
    errors.networks = 'Selecione ao menos uma rede.'
  }

  for (const key of Object.keys(errors) as Array<keyof WalletFields>) {
    if (!errors[key]) {
      delete errors[key]
    }
  }

  return errors
}

export type ProfileFields = {
  name: string
  email: string
  phone: string
}

/** Perfil: como no checkout, mas o telefone é opcional. */
export function validateProfile(values: ProfileFields): FieldErrors<ProfileFields> {
  const errors: FieldErrors<ProfileFields> = {}
  const email = values.email.trim()

  errors.name = validateName(values.name)

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (values.phone.trim()) {
    errors.phone = validatePhone(values.phone)
  }

  for (const key of Object.keys(errors) as Array<keyof ProfileFields>) {
    if (!errors[key]) {
      delete errors[key]
    }
  }

  return errors
}

export type PasswordChangeFields = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function validatePasswordChange(values: PasswordChangeFields): FieldErrors<PasswordChangeFields> {
  const errors: FieldErrors<PasswordChangeFields> = {}

  if (!values.currentPassword) {
    errors.currentPassword = 'Informe sua senha atual.'
  }

  if (!values.newPassword) {
    errors.newPassword = 'Crie uma nova senha.'
  } else {
    errors.newPassword =
      validatePassword(values.newPassword) ??
      (values.newPassword === values.currentPassword
        ? 'A nova senha deve ser diferente da atual.'
        : undefined)
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme a nova senha.'
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'As senhas não conferem.'
  }

  for (const key of Object.keys(errors) as Array<keyof PasswordChangeFields>) {
    if (!errors[key]) {
      delete errors[key]
    }
  }

  return errors
}
