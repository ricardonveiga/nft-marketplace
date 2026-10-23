import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changePassword, removeAvatar, setAvatar, updateProfile } from '@/api/profile'
import type { User } from '@/types/auth'
import { SESSION_QUERY_KEY } from './use-session'

/** O perfil faz parte do usuário da sessão: ao salvar, o cache da sessão (e o header) se atualiza. */
function useProfileMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<User>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['profile', 'mutation'],
    mutationFn,
    onSuccess: (user) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
  })
}

export function useUpdateProfile() {
  return useProfileMutation(updateProfile)
}

export function useSetAvatar() {
  return useProfileMutation(setAvatar)
}

export function useRemoveAvatar() {
  return useProfileMutation(() => removeAvatar())
}

export function useChangePassword() {
  return useMutation({
    mutationKey: ['profile', 'mutation'],
    mutationFn: changePassword,
  })
}
