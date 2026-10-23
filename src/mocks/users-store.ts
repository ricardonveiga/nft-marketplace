import { mockUsers, type MockUser } from './fixtures/users'

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

export function listUsers(): MockUser[] {
  return [...mockUsers, ...readRegistered()]
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
