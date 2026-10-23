import { mockWallets, type MockWallet } from './fixtures/wallets'

// Carteiras por usuário no localStorage. Na primeira leitura de cada usuário o mock é semeado
// com as fixtures (Ana: 2, Bruno: 1; contas novas: nenhuma); depois disso a lista é do usuário.
// resetMockWallets() volta ao cenário conhecido.
const PREFIX = 'mock-wallets:'

export function readWallets(userId: string): MockWallet[] {
  try {
    const raw = window.localStorage.getItem(PREFIX + userId)

    if (raw) {
      return JSON.parse(raw) as MockWallet[]
    }
  } catch {
    // Sem localStorage cai nas fixtures.
  }

  return mockWallets.filter((wallet) => wallet.userId === userId)
}

export function writeWallets(userId: string, wallets: MockWallet[]) {
  try {
    window.localStorage.setItem(PREFIX + userId, JSON.stringify(wallets))
  } catch {
    // Sem localStorage as mudanças valem só até o próximo refresh.
  }
}

let sequence = 0

export function nextWalletId() {
  sequence += 1

  return `wallet-${Date.now().toString(36)}-${sequence}`
}

export function resetMockWallets() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Nada a limpar.
  }
}
