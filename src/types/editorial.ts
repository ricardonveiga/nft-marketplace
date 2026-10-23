/** Promoção da Início. Conteúdo editorial: sem destino próprio; o cupom, quando há, é aplicado no carrinho. */
export type Promotion = {
  id: string
  title: string
  description: string
  /** Rótulo curto no topo do card (por exemplo, "Cupom" ou "Em destaque"). */
  badge: string
  /** Código do cupom, quando a promoção tem um. */
  couponCode?: string
}

/** Artigo do "Diário da Cunhagem". Texto completo ainda não publicado: o card não leva a lugar nenhum. */
export type BlogPost = {
  id: string
  title: string
  excerpt: string
  category: string
  /** ISO 8601 (data de publicação). */
  publishedAt: string
  readMinutes: number
  imageUrl: string
}

export type PromotionsResponse = { items: Promotion[] }
export type BlogPostsResponse = { items: BlogPost[] }
