import { HttpResponse, http } from 'msw'
import { isEmail } from '@/lib/validation'
import type { ApiErrorBody, LoginRequest, LoginResponse, User } from '@/types/auth'
import { mockUsers } from './fixtures/users'
import { getScenario } from './scenario'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000

function toPublicUser({ id, name, email }: User): User {
  return { id, name, email }
}

// Token sem estado ("kurio.<usuário>.<expira em ms>"): sobrevive ao refresh dos mocks.
function createToken(userId: string) {
  return `kurio.${userId}.${Date.now() + SESSION_TTL_MS}`
}

function error(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

/** Resolve o usuário do cabeçalho Authorization ou devolve a resposta de erro. */
export function authenticate(request: Request): User | Response {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const [prefix, userId, expiresAt] = token.split('.')

  if (prefix !== 'kurio' || !userId) {
    return error(401, { code: 'unauthenticated', message: 'Faça login para continuar.' })
  }

  if (getScenario() === 'session-expired' || Number(expiresAt) <= Date.now()) {
    return error(401, { code: 'session_expired', message: 'Sua sessão expirou.' })
  }

  const user = mockUsers.find((candidate) => candidate.id === userId)

  return user
    ? toPublicUser(user)
    : error(401, { code: 'unauthenticated', message: 'Faça login para continuar.' })
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<LoginRequest> | null
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    const errors: NonNullable<ApiErrorBody['errors']> = {}

    if (!isEmail(email)) {
      errors.email = 'Informe um e-mail válido.'
    }

    if (!password) {
      errors.password = 'Informe sua senha.'
    }

    if (errors.email || errors.password) {
      return error(422, { code: 'validation_error', errors })
    }

    const user = mockUsers.find(
      (candidate) =>
        candidate.email.toLowerCase() === email.toLowerCase() &&
        candidate.password === password,
    )

    if (!user) {
      return error(401, {
        code: 'invalid_credentials',
        message: 'E-mail ou senha incorretos.',
      })
    }

    const response: LoginResponse = {
      user: toPublicUser(user),
      token: createToken(user.id),
    }

    return HttpResponse.json(response)
  }),

  http.get('/api/auth/session', ({ request }) => {
    const result = authenticate(request)

    return result instanceof Response ? result : HttpResponse.json({ user: result })
  }),

  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
]
