import { useQuery } from '@tanstack/react-query'
import { fetchBlogPosts, fetchPromotions } from '@/api/editorial'

// Conteúdo editorial muda pouco: pode ficar em cache por bastante tempo.
const STALE_TIME = 10 * 60 * 1000

export function usePromotions() {
  return useQuery({ queryKey: ['editorial', 'promotions'], queryFn: fetchPromotions, staleTime: STALE_TIME })
}

export function useBlogPosts() {
  return useQuery({ queryKey: ['editorial', 'blog'], queryFn: fetchBlogPosts, staleTime: STALE_TIME })
}
