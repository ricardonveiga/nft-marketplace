import { WALLET_TYPES } from '@/types/wallet'

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

/** Campos do "Perfil do colecionador" do pagamento (Figma). Os de asterisco são obrigatórios. */
export type CollectorFields = {
  name: string
  username: string
  profileName: string
  email: string
  walletType: string
  walletAddress: string
  secondary: string
  referralCode: string
  /** Nome ENS completo, com o sufixo (ex.: "ana.eth"); vazio = não informado. */
  ensName: string
  notes: string
}

export const NOTES_MAX_LENGTH = 280

export function validateUsername(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Informe o nome de usuário.'
  }

  return /^[A-Za-z0-9_.]{3,30}$/.test(trimmed)
    ? undefined
    : 'Use de 3 a 30 letras, números, ponto ou sublinhado.'
}

export function validateProfileName(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Informe o nome do perfil.'
  }

  return trimmed.length < 2 || trimmed.length > 40 ? 'O nome do perfil deve ter de 2 a 40 caracteres.' : undefined
}

export function validateEnsName(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Informe o nome ENS.'
  }

  return /^([a-z0-9-]+\.)+eth$/i.test(trimmed) ? undefined : 'Use letras, números e hífens no nome ENS.'
}

/** "ENS ou carteira secundária": opcional; se vier, é um nome .eth ou um endereço 0x. */
export function validateSecondary(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  return /^0x[0-9a-fA-F]{40}$/.test(trimmed) || /^([a-z0-9-]+\.)+eth$/i.test(trimmed)
    ? undefined
    : 'Informe um nome ENS (.eth) ou um endereço 0x válido.'
}

export function validateReferralCode(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Informe o código de indicação.'
  }

  return /^[A-Za-z0-9]{4,12}$/.test(trimmed) ? undefined : 'O código tem de 4 a 12 letras ou números.'
}

export function validateNotes(value: string): string | undefined {
  return value.length > NOTES_MAX_LENGTH ? `Use no máximo ${NOTES_MAX_LENGTH} caracteres.` : undefined
}

export function validateWalletType(value: string): string | undefined {
  return (WALLET_TYPES as readonly string[]).includes(value) ? undefined : 'Selecione o tipo de carteira.'
}

/** Validação do colecionador no pagamento: a mesma no formulário e na API simulada. */
export function validateCollector(values: CollectorFields): FieldErrors<CollectorFields> {
  const errors: FieldErrors<CollectorFields> = {}
  const email = values.email.trim()

  errors.name = validateName(values.name)
  errors.username = validateUsername(values.username)
  errors.profileName = validateProfileName(values.profileName)

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  errors.walletType = validateWalletType(values.walletType)
  errors.walletAddress = validateWalletAddress(values.walletAddress)
  errors.secondary = validateSecondary(values.secondary)
  errors.referralCode = validateReferralCode(values.referralCode)
  errors.ensName = validateEnsName(values.ensName)
  errors.notes = validateNotes(values.notes)

  for (const key of Object.keys(errors) as Array<keyof CollectorFields>) {
    if (!errors[key]) {
      delete errors[key]
    }
  }

  return errors
}

export type WalletFields = {
  displayName: string
  label: string
  network: string
  profileName: string
  address: string
  secondary: string
  walletType: string
  referralCode: string
  email: string
  /** Nome ENS completo, com o sufixo (ex.: "ana.eth"). */
  ensName: string
}

export function validateDisplayName(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Informe o nome de exibição.'
  }

  return trimmed.length < 2 || trimmed.length > 40 ? 'O nome deve ter de 2 a 40 caracteres.' : undefined
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
  const email = values.email.trim()
  const errors: FieldErrors<WalletFields> = {
    displayName: validateDisplayName(values.displayName),
    label: validateWalletLabel(values.label),
    network: values.network ? undefined : 'Selecione uma rede.',
    profileName: validateProfileName(values.profileName),
    address: validateWalletAddress(values.address),
    secondary: validateSecondary(values.secondary),
    walletType: validateWalletType(values.walletType),
    referralCode: validateReferralCode(values.referralCode),
    email: !email ? 'Informe seu e-mail.' : isEmail(email) ? undefined : 'Informe um e-mail válido.',
    ensName: validateEnsName(values.ensName),
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
  username: string
  email: string
  /** Nome ENS completo, com o sufixo (ex.: "ana.eth"); vazio = não informado. */
  ensName: string
  walletNickname: string
}

export function validateWalletNickname(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Informe o apelido da carteira.'
  }

  return trimmed.length < 2 || trimmed.length > 30
    ? 'O apelido deve ter de 2 a 30 caracteres.'
    : undefined
}

/** Perfil do colecionador: todos os campos com asterisco do Figma são obrigatórios. */
export function validateProfile(values: ProfileFields): FieldErrors<ProfileFields> {
  const errors: FieldErrors<ProfileFields> = {}
  const email = values.email.trim()

  errors.name = validateName(values.name)
  errors.username = validateUsername(values.username)
  errors.ensName = validateEnsName(values.ensName)
  errors.walletNickname = validateWalletNickname(values.walletNickname)

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
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
