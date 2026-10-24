// Alterações de perfil por usuário (nome, e-mail, usuário, ENS, apelido, foto e senha), no localStorage:
// sobrevivem ao refresh e valem tanto para usuários das fixtures quanto para os cadastrados.
// resetProfiles() volta ao cenário conhecido.
const PREFIX = 'mock-profile:'

export type ProfileOverride = Partial<{
  name: string
  email: string
  username: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  /** Hash SHA-256 da senha nova (nunca a senha em claro). */
  passwordHash: string
}>

export function readProfile(userId: string): ProfileOverride {
  try {
    const raw = window.localStorage.getItem(PREFIX + userId)

    return raw ? (JSON.parse(raw) as ProfileOverride) : {}
  } catch {
    return {}
  }
}

export function writeProfile(userId: string, patch: ProfileOverride) {
  try {
    window.localStorage.setItem(PREFIX + userId, JSON.stringify({ ...readProfile(userId), ...patch }))
  } catch {
    // Sem localStorage as alterações valem só até o próximo refresh.
  }
}

export function resetProfiles() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Nada a limpar.
  }
}
