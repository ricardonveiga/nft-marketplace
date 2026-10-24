import type { User } from '@/types/auth'
import { mockUsers, type MockUser } from './fixtures/users'
import { hashPassword } from './password'
import { readProfile } from './profiles-store'

/** Usuário com o perfil já aplicado por cima (nome, e-mail, telefone, foto e senha editados). */
export type StoredUser = MockUser &
  Pick<User, 'username' | 'ensName' | 'walletNickname'> & { avatarUrl: string | null }

// Usuários criados pelo cadastro. Ficam no localStorage para sobreviver ao refresh
// e voltam ao cenário conhecido (só os usuários das fixtures) com resetRegisteredUsers().
const STORAGE_KEY = 'mock-users'

function readRegistered(): MockUser[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    return raw ? (JSON.parse(raw) as MockUser[]) : []
  } catch {
    return []
  }
}

/** Contas novas ainda não escolheram usuário, ENS nem apelido: parte do e-mail, já válida. */
function defaultsOf(user: MockUser) {
  const username = (user.email.split('@')[0].replace(/[^A-Za-z0-9_.]/g, '') || 'colecionador').slice(0, 30)

  return {
    username: user.username ?? username,
    ensName: user.ensName ?? `${username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'colecionador'}.eth`,
    walletNickname: user.walletNickname ?? 'Minha carteira',
  }
}

export function listUsers(): StoredUser[] {
  return [...mockUsers, ...readRegistered()].map((user) => {
    const profile = readProfile(user.id)

    return {
      ...user,
      name: profile.name ?? user.name,
      email: profile.email ?? user.email,
      // Uma senha trocada no perfil vale no lugar da de demonstração (que sai de cena).
      password: profile.passwordHash ? undefined : user.password,
      passwordHash: profile.passwordHash ?? user.passwordHash,
      username: profile.username ?? defaultsOf(user).username,
      ensName: profile.ensName ?? defaultsOf(user).ensName,
      walletNickname: profile.walletNickname ?? defaultsOf(user).walletNickname,
      avatarUrl: profile.avatarUrl ?? null,
    }
  })
}

export function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase()

  return listUsers().find((user) => user.email.toLowerCase() === normalized)
}

export function addUser(data: Pick<MockUser, 'name' | 'email'> & { passwordHash: string }): MockUser {
  const registered = readRegistered()
  const user: MockUser = {
    id: `user-${mockUsers.length + registered.length + 1}`,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...registered, user]))
  } catch {
    // Sem localStorage o usuário vale só até o próximo refresh.
  }

  return user
}

/** Confere a senha comparando hashes; as credenciais de demonstração são "hasheadas" na hora. */
export async function passwordMatches(user: StoredUser, candidate: string) {
  const expected = user.passwordHash ?? (user.password ? await hashPassword(user.password) : undefined)

  return expected !== undefined && (await hashPassword(candidate)) === expected
}

/**
 * Navegadores que já visitaram uma versão anterior podem ter senhas em claro guardadas
 * (`mock-users` e `mock-profile:*`). Troca cada uma pelo hash, uma vez, antes de o mock responder.
 */
export async function migratePlainPasswords() {
  try {
    const storage = window.localStorage

    for (const key of Object.keys(storage)) {
      if (key !== STORAGE_KEY && !key.startsWith('mock-profile:')) {
        continue
      }

      const parsed = JSON.parse(storage.getItem(key) ?? 'null') as unknown
      const records = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
      let changed = false

      for (const record of records as Array<Record<string, unknown>>) {
        if (typeof record.password === 'string') {
          record.passwordHash = await hashPassword(record.password)
          delete record.password
          changed = true
        }
      }

      if (changed) {
        storage.setItem(key, JSON.stringify(parsed))
      }
    }
  } catch {
    // Sem localStorage (ou com dados ilegíveis) não há senha guardada para migrar.
  }
}

export function resetRegisteredUsers() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada a limpar.
  }
}
