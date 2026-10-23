import type { User } from '@/types/auth'

export type MockUser = User & { password: string }

// Credenciais de demonstração. Existem apenas na camada de mocks.
export const mockUsers: readonly MockUser[] = [
  {
    id: 'user-ana',
    name: 'Ana Souza',
    email: 'ana@kurio.test',
    password: 'kurio123',
  },
  {
    id: 'user-bruno',
    name: 'Bruno Lima',
    email: 'bruno@kurio.test',
    password: 'kurio456',
  },
]
