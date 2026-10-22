export type MockScenario = 'success' | 'empty' | 'error'

export const SCENARIO_STORAGE_KEY = 'mock-scenario'

/**
 * Cenário ativo dos mocks. Os handlers rodam no navegador, então o cenário é
 * lido do localStorage: testes e desenvolvedores o definem sem tocar no app.
 */
export function getScenario(): MockScenario {
  try {
    const value = window.localStorage.getItem(SCENARIO_STORAGE_KEY)

    if (value === 'empty' || value === 'error') {
      return value
    }
  } catch {
    // localStorage indisponível: segue com o cenário padrão.
  }

  return 'success'
}
