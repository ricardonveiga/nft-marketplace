import { isAxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/auth'

/** Mensagem de erro devolvida pela API, ou o texto de reserva (rede fora do ar, 5xx...). */
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? fallback
  }

  return fallback
}

/** 403: o usuário está autenticado, mas não tem permissão para o recurso. */
export function isForbidden(error: unknown) {
  return isAxiosError(error) && error.response?.status === 403
}

export function getApiErrorCode(error: unknown) {
  return isAxiosError<ApiErrorBody>(error) ? error.response?.data?.code : undefined
}
