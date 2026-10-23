import axios, { isAxiosError } from 'axios'
import { getGuestCartId } from './guest-cart'
import { emitSessionExpired, getSessionToken } from './session-token'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
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
