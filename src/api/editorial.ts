import { api } from '@/lib/api'
import type { BlogPostsResponse, PromotionsResponse } from '@/types/editorial'

export async function fetchPromotions() {
  const response = await api.get<PromotionsResponse>('/promotions')

  if (!Array.isArray(response.data?.items)) {
    throw new Error('Resposta de /promotions fora do formato esperado')
  }

  return response.data.items
}

export async function fetchBlogPosts() {
  const response = await api.get<BlogPostsResponse>('/blog/posts')

  if (!Array.isArray(response.data?.items)) {
    throw new Error('Resposta de /blog/posts fora do formato esperado')
  }

  return response.data.items
}
