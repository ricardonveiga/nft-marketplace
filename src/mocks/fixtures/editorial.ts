import type { BlogPost, Promotion } from '@/types/editorial'

// Textos do Figma (Início). As artes são as 4 do arquivo, reaproveitadas como no resto do catálogo.
export const mockPromotions: readonly Promotion[] = [
  {
    id: 'promo-lancamentos-genesis',
    title: 'Lançamentos gênesis\nde edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    imageUrl: '/nfts/emerald.webp',
  },
  {
    id: 'promo-arte-selecionada',
    title: 'Arte digital selecionada\ne muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a identidade da cultura digital.',
    imageUrl: '/nfts/neon.webp',
  },
]

export const mockBlogPosts: readonly BlogPost[] = [
  {
    id: 'post-propriedade-nfts',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    publishedAt: '2026-09-12T12:00:00Z',
    readMinutes: 6,
    imageUrl: '/nfts/neon.webp',
  },
  {
    id: 'post-artistas-digitais',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    publishedAt: '2026-09-13T12:00:00Z',
    readMinutes: 2,
    imageUrl: '/nfts/emerald.webp',
  },
  {
    id: 'post-raridade',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    publishedAt: '2026-09-15T12:00:00Z',
    readMinutes: 3,
    imageUrl: '/nfts/sage.webp',
  },
  {
    id: 'post-proteger-carteira',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    publishedAt: '2026-09-15T13:00:00Z',
    readMinutes: 2,
    imageUrl: '/nfts/golden.webp',
  },
]
