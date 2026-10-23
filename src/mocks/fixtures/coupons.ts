import { REFERENCE_DATE } from './nfts'

export type MockCoupon = {
  code: string
  description: string
  discountPercent: number
  /** Último instante (ms) em que o cupom vale. */
  expiresAt: number
}

const YEAR = 365 * 24 * 60 * 60 * 1000

export const mockCoupons: readonly MockCoupon[] = [
  {
    code: 'KURIO10',
    description: '10% de desconto no pedido',
    discountPercent: 10,
    expiresAt: REFERENCE_DATE + 2 * YEAR,
  },
  {
    code: 'GENESIS15',
    description: '15% de desconto em lançamentos',
    discountPercent: 15,
    expiresAt: REFERENCE_DATE + 2 * YEAR,
  },
  {
    // Cenário determinístico de cupom expirado.
    code: 'EXPIRADO20',
    description: '20% de desconto (encerrado)',
    discountPercent: 20,
    expiresAt: REFERENCE_DATE - YEAR,
  },
]
