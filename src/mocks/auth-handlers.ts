import { HttpResponse, http } from 'msw'
import { isEmail, validateName, validatePassword } from '@/lib/validation'
import type {
  ApiErrorBody,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from '@/types/auth'
import { getScenario } from './scenario'
import { addUser, findUserByEmail, listUsers, type StoredUser } from './users-store'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000

function toPublicUser({ id, name, email, phone, avatarUrl }: StoredUser): User {
  return { id, name, email, phone, avatarUrl }
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

  const user = listUsers().find((candidate) => candidate.id === userId)

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

    const found = findUserByEmail(email)
    const user = found?.password === password ? found : undefined

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

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<RegisterRequest> | null
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    const errors: NonNullable<ApiErrorBody['errors']> = {}
    const nameError = validateName(name)
    const passwordError = validatePassword(password)

    if (nameError) {
      errors.name = nameError
    }

    if (!isEmail(email)) {
      errors.email = 'Informe um e-mail válido.'
    }

    if (passwordError) {
      errors.password = passwordError
    }

    if (Object.keys(errors).length > 0) {
      return error(422, { code: 'validation_error', errors })
    }

    if (findUserByEmail(email)) {
      return error(409, {
        code: 'email_taken',
        message: 'Este e-mail já está cadastrado.',
        errors: { email: 'Este e-mail já está cadastrado.' },
      })
    }

    const user = addUser({ name, email, password })
    const response: LoginResponse = {
      user: toPublicUser({ ...user, phone: null, avatarUrl: null }),
      token: createToken(user.id),
    }

    return HttpResponse.json(response, { status: 201 })
  }),

  http.get('/api/auth/session', ({ request }) => {
    const result = authenticate(request)

    return result instanceof Response ? result : HttpResponse.json({ user: result })
  }),

  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
]
