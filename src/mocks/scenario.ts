export type MockScenario =
  | 'success'
  | 'empty'
  | 'error'
  | 'session-expired'
  | 'favorites-error'
  | 'payment-declined'
  | 'order-timeout'

export const SCENARIO_STORAGE_KEY = 'mock-scenario'

const SCENARIOS: readonly MockScenario[] = [
  'empty',
  'error',
  'session-expired',
  'favorites-error',
  'payment-declined',
  'order-timeout',
]

/**
 * Cenário ativo dos mocks. Os handlers rodam no navegador, então o cenário é
 * lido do localStorage: testes e desenvolvedores o definem sem tocar no app.
 */
export function getScenario(): MockScenario {
  try {
    const value = window.localStorage.getItem(SCENARIO_STORAGE_KEY)

    if (SCENARIOS.includes(value as MockScenario)) {
      return value as MockScenario
    }
  } catch {
    // localStorage indisponível: segue com o cenário padrão.
  }

  return 'success'
}
