import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { clearSessionToken, getSessionToken } from '@/lib/session-token'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from '@/types/auth'

export async function login(credentials: LoginRequest) {
  const response = await api.post<LoginResponse>('/auth/login', credentials)

  if (!response.data?.token || !response.data.user) {
    throw new Error('Resposta de /auth/login fora do formato esperado')
  }

  return response.data
}

export async function register(data: RegisterRequest) {
  const response = await api.post<LoginResponse>('/auth/register', data)

  if (!response.data?.token || !response.data.user) {
    throw new Error('Resposta de /auth/register fora do formato esperado')
  }

  return response.data
}

/** Devolve o usuário da sessão atual, ou null se não houver sessão válida. */
export async function fetchSession(): Promise<User | null> {
  if (!getSessionToken()) {
    return null
  }

  try {
    const response = await api.get<{ user: User }>('/auth/session')

    return response.data.user
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearSessionToken()

      return null
    }

    throw error
  }
}

export async function logout() {
  await api.post('/auth/logout')
}
