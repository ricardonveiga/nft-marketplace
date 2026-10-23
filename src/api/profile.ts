import { api } from '@/lib/api'
import type { PasswordChangeRequest, ProfileUpdateRequest, User } from '@/types/auth'

function assertUser(data: { user: User } | undefined) {
  if (!data?.user?.id) {
    throw new Error('Resposta de perfil fora do formato esperado')
  }

  return data.user
}

export async function updateProfile(request: ProfileUpdateRequest) {
  const response = await api.patch<{ user: User }>('/profile', request)

  return assertUser(response.data)
}

export async function setAvatar(dataUrl: string) {
  const response = await api.put<{ user: User }>('/profile/avatar', { dataUrl })

  return assertUser(response.data)
}

export async function removeAvatar() {
  const response = await api.delete<{ user: User }>('/profile/avatar')

  return assertUser(response.data)
}

export async function changePassword(request: PasswordChangeRequest) {
  await api.post('/profile/password', request)
}
