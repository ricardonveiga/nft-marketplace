import { normalizePhone } from './validation'

/** "11912345678" -> "(11) 91234-5678" (telefone brasileiro com DDD). */
export function formatPhone(value: string) {
  const digits = normalizePhone(value)

  return digits.length === 11
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : digits.length === 10
      ? `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
      : value
}
