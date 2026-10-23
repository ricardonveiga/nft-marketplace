import { HttpResponse, http } from 'msw'
import {
  isEmail,
  normalizePhone,
  validateName,
  validatePassword,
  validatePhone,
} from '@/lib/validation'
import type { ApiErrorBody, PasswordChangeRequest, ProfileUpdateRequest } from '@/types/auth'
import { authenticate } from './auth-handlers'
import { writeProfile } from './profiles-store'
import { hashPassword } from './password'
import { findUserByEmail, listUsers, passwordMatches } from './users-store'

// Foto do perfil: o cliente reduz a imagem antes de enviar; aqui só se confere o formato e o
// tamanho (um limite folgado, para não encher o localStorage).
const AVATAR_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/
const AVATAR_MAX_CHARS = 400_000

function error(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

function currentUser(userId: string) {
  const user = listUsers().find((candidate) => candidate.id === userId)

  return user
    ? { id: user.id, name: user.name, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl }
    : null
}

export const profileHandlers = [
  http.patch('/api/profile', async ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const body = (await request.json().catch(() => null)) as Partial<ProfileUpdateRequest> | null
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''

    const errors: NonNullable<ApiErrorBody['errors']> = {}
    const nameError = validateName(name)
    const phoneError = phone ? validatePhone(phone) : undefined

    if (nameError) {
      errors.name = nameError
    }

    if (!isEmail(email)) {
      errors.email = 'Informe um e-mail válido.'
    }

    if (phoneError) {
      errors.phone = phoneError
    }

    if (Object.keys(errors).length > 0) {
      return error(422, { code: 'validation_error', errors })
    }

    const owner = findUserByEmail(email)

    if (owner && owner.id !== user.id) {
      return error(409, {
        code: 'email_taken',
        message: 'Este e-mail já está cadastrado.',
        errors: { email: 'Este e-mail já está cadastrado.' },
      })
    }

    writeProfile(user.id, { name, email, phone: phone ? normalizePhone(phone) : null })

    return HttpResponse.json({ user: currentUser(user.id) })
  }),

  http.put('/api/profile/avatar', async ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const body = (await request.json().catch(() => null)) as { dataUrl?: unknown } | null
    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : ''

    if (!AVATAR_PATTERN.test(dataUrl)) {
      return error(422, {
        code: 'validation_error',
        errors: { avatar: 'Use uma imagem PNG, JPEG ou WebP.' },
      })
    }

    if (dataUrl.length > AVATAR_MAX_CHARS) {
      return error(422, {
        code: 'validation_error',
        errors: { avatar: 'A imagem é grande demais.' },
      })
    }

    writeProfile(user.id, { avatarUrl: dataUrl })

    return HttpResponse.json({ user: currentUser(user.id) })
  }),

  http.delete('/api/profile/avatar', ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    writeProfile(user.id, { avatarUrl: null })

    return HttpResponse.json({ user: currentUser(user.id) })
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const body = (await request.json().catch(() => null)) as Partial<PasswordChangeRequest> | null
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
    const stored = listUsers().find((candidate) => candidate.id === user.id)

    if (!stored || !(await passwordMatches(stored, currentPassword))) {
      return error(422, {
        code: 'invalid_current_password',
        message: 'A senha atual está incorreta.',
        errors: { currentPassword: 'A senha atual está incorreta.' },
      })
    }

    const passwordError =
      validatePassword(newPassword) ??
      (newPassword === currentPassword ? 'A nova senha deve ser diferente da atual.' : undefined)

    if (passwordError) {
      return error(422, { code: 'validation_error', errors: { newPassword: passwordError } })
    }

    writeProfile(user.id, { passwordHash: await hashPassword(newPassword) })

    return HttpResponse.json({ ok: true })
  }),
]
