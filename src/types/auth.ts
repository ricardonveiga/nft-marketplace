export type User = {
  id: string
  name: string
  email: string
  /** Nome de usuário público (letras, números, ponto ou sublinhado). */
  username: string
  /** Nome ENS completo, com o sufixo (ex.: "ana-souza.eth"). */
  ensName: string
  /** Apelido da carteira principal, mostrado no perfil. */
  walletNickname: string
  /** Foto do perfil como data URL (WebP/JPEG/PNG reduzido); null = sem foto. */
  avatarUrl: string | null
}

export type ProfileUpdateRequest = {
  name: string
  email: string
  username: string
  ensName: string
  walletNickname: string
}

export type PasswordChangeRequest = {
  currentPassword: string
  newPassword: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type LoginResponse = {
  user: User
  token: string
}

/** Corpo dos erros da API (401, 422...). */
export type ApiErrorBody = {
  code: string
  message?: string
  errors?: Partial<
    Record<
      | 'name'
      | 'email'
      | 'password'
      | 'username'
      | 'ensName'
      | 'walletNickname'
      | 'avatar'
      | 'currentPassword'
      | 'newPassword'
      | 'label'
      | 'address'
      | 'networks',
      string
    >
  >
}
