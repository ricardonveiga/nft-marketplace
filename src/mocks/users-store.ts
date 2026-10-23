import { mockUsers, type MockUser } from './fixtures/users'
import { readProfile } from './profiles-store'

/** Usuário com o perfil já aplicado por cima (nome, e-mail, telefone, foto e senha editados). */
export type StoredUser = MockUser & { phone: string | null; avatarUrl: string | null }

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

export function listUsers(): StoredUser[] {
  return [...mockUsers, ...readRegistered()].map((user) => {
    const profile = readProfile(user.id)

    return {
      ...user,
      name: profile.name ?? user.name,
      email: profile.email ?? user.email,
      password: profile.password ?? user.password,
      phone: profile.phone ?? null,
      avatarUrl: profile.avatarUrl ?? null,
    }
  })
}

export function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase()

  return listUsers().find((user) => user.email.toLowerCase() === normalized)
}

export function addUser(data: Pick<MockUser, 'name' | 'email' | 'password'>): MockUser {
  const registered = readRegistered()
  const user: MockUser = {
    id: `user-${mockUsers.length + registered.length + 1}`,
    name: data.name,
    email: data.email,
    password: data.password,
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...registered, user]))
  } catch {
    // Sem localStorage o usuário vale só até o próximo refresh.
  }

  return user
}

export function resetRegisteredUsers() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada a limpar.
  }
}
