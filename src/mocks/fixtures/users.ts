import type { User } from '@/types/auth'

/**
 * `password` só existe nas credenciais de demonstração abaixo (públicas, no código).
 * Tudo o que é guardado no localStorage (contas cadastradas, senhas trocadas) usa só `passwordHash`.
 */
export type MockUser = Pick<User, 'id' | 'name' | 'email'> &
  Partial<Pick<User, 'username' | 'ensName' | 'walletNickname'>> & { password?: string; passwordHash?: string }

// Credenciais de demonstração. Existem apenas na camada de mocks.
export const mockUsers: readonly MockUser[] = [
  {
    id: 'user-ana',
    name: 'Ana Souza',
    email: 'ana@kurio.test',
    username: 'ana',
    ensName: 'ana-souza.eth',
    walletNickname: 'Carteira principal',
    password: 'kurio123',
  },
  {
    id: 'user-bruno',
    name: 'Bruno Lima',
    email: 'bruno@kurio.test',
    username: 'bruno',
    ensName: 'bruno-lima.eth',
    walletNickname: 'Carteira principal',
    password: 'kurio456',
  },
]
