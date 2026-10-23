import axios, { isAxiosError } from 'axios'
import { getGuestCartId } from './guest-cart'
import { whenMocksReady } from './mocks-ready'
import { emitSessionExpired, getSessionToken } from './session-token'

export const api = axios.create({
  baseURL: '/api',
  // Sem resposta nesse prazo a requisição falha (e entra na política de nova tentativa).
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  await whenMocksReady()

  const token = getSessionToken()

  config.headers['X-Guest-Cart'] = getGuestCartId()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (
    isAxiosError(error) &&
    error.response?.status === 401 &&
    error.response.data?.code === 'session_expired'
  ) {
    emitSessionExpired()
  }

  return Promise.reject(error)
})
