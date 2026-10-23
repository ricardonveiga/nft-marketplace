export type User = {
  id: string
  name: string
  email: string
  /** Telefone com DDD, só dígitos; opcional no perfil. */
  phone: string | null
  /** Foto do perfil como data URL (WebP/JPEG/PNG reduzido); null = sem foto. */
  avatarUrl: string | null
}

export type ProfileUpdateRequest = {
  name: string
  email: string
  phone: string
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
      | 'phone'
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
