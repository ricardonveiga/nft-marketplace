import type { BlogPost, Promotion } from '@/types/editorial'
import { mockCoupons } from './coupons'

const coupon = (code: string) => {
  const found = mockCoupons.find((candidate) => candidate.code === code)

  if (!found) {
    throw new Error(`Cupom ${code} não existe nas fixtures`)
  }

  return found
}

// As promoções com cupom usam os cupons reais do carrinho: o que o card promete, o carrinho aplica.
export const mockPromotions: readonly Promotion[] = [
  {
    id: 'promo-primeiro-pedido',
    badge: 'Cupom',
    title: `${coupon('KURIO10').discountPercent}% no seu pedido`,
    description: 'Aplique o cupom no carrinho e receba desconto em qualquer NFT disponível.',
    couponCode: 'KURIO10',
  },
  {
    id: 'promo-lancamentos',
    badge: 'Cupom',
    title: `${coupon('GENESIS15').discountPercent}% em lançamentos`,
    description: 'Para quem acompanha as novas coleções desde a primeira cunhagem.',
    couponCode: 'GENESIS15',
  },
  {
    id: 'promo-golden-signals',
    badge: 'Em destaque',
    title: 'Coleção Golden Signals',
    description: 'Edições limitadas em tons de ouro, reunidas em um só lugar no catálogo.',
  },
]

export const mockBlogPosts: readonly BlogPost[] = [
  {
    id: 'post-primeira-cunhagem',
    category: 'Guia',
    title: 'Sua primeira cunhagem: o que observar antes de comprar',
    excerpt: 'Edição, raridade, rede e taxa: um roteiro curto para revisar antes de confirmar o pagamento.',
    publishedAt: '2026-10-15T12:00:00Z',
    readMinutes: 5,
    imageUrl: '/nfts/emerald.webp',
  },
  {
    id: 'post-raridade',
    category: 'Coleções',
    title: 'Como a raridade muda o valor de uma coleção',
    excerpt: 'Do comum ao lendário: o que cada nível diz sobre a oferta e o interesse dos colecionadores.',
    publishedAt: '2026-10-08T12:00:00Z',
    readMinutes: 4,
    imageUrl: '/nfts/neon.webp',
  },
  {
    id: 'post-carteiras',
    category: 'Segurança',
    title: 'Carteiras e redes: boas práticas para colecionar com tranquilidade',
    excerpt: 'Por que conferir endereço e rede, e como manter uma carteira principal e outra de reserva.',
    publishedAt: '2026-10-01T12:00:00Z',
    readMinutes: 6,
    imageUrl: '/nfts/sage.webp',
  },
]
