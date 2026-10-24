/**
 * Promoção da Início. Conteúdo editorial: o botão "Explorar" leva ao catálogo (como o do hero).
 * `title` aceita quebras de linha (\n), como no Figma.
 */
export type Promotion = {
  id: string
  title: string
  description: string
  imageUrl: string
}

/** Artigo do "Diário da Cunhagem". Texto completo ainda não publicado: o card não leva a lugar nenhum. */
export type BlogPost = {
  id: string
  title: string
  excerpt: string
  /** ISO 8601 (data de publicação). */
  publishedAt: string
  readMinutes: number
  imageUrl: string
}

export type PromotionsResponse = { items: Promotion[] }
export type BlogPostsResponse = { items: BlogPost[] }
