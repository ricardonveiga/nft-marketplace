export type User = {
  id: string
  name: string
  email: string
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
  errors?: Partial<Record<'name' | 'email' | 'password', string>>
}
