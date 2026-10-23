import { HttpResponse, http } from 'msw'
import { ethToWei, weiToEth } from '@/lib/eth'
import type { ApiErrorBody } from '@/types/auth'
import type { Cart, CartItem, CartItemStatus } from '@/types/cart'
import { authenticate } from './auth-handlers'
import { deleteCart, readCart, writeCart, type StoredCart } from './cart-store'
import { mockCoupons } from './fixtures/coupons'
import { currentNft, maxQuantityFor } from './catalog-state'
import { REFERENCE_DATE } from './fixtures/nfts'
import { getScenario } from './scenario'

// Taxa de rede fixa por pedido (qualquer carrinho com itens à venda).
const NETWORK_FEE_ETH = '0.0045'

function error(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

/** Dono do carrinho: o usuário autenticado ou, sem login, o carrinho de visitante. */
function resolveOwner(request: Request): { owner: string } | Response {
  if (getScenario() === 'error') {
    return error(503, { code: 'unavailable', message: 'Serviço indisponível' })
  }

  if (request.headers.get('Authorization')) {
    const result = authenticate(request)

    return result instanceof Response ? result : { owner: `user:${result.id}` }
  }

  return { owner: `guest:${request.headers.get('X-Guest-Cart') ?? 'anonymous'}` }
}

function maxQuantityOf(nftId: string) {
  const nft = currentNft(nftId)

  return nft ? maxQuantityFor(nft) : 0
}

function findCoupon(code: string | undefined) {
  return mockCoupons.find((coupon) => coupon.code === code)
}

/** Calcula a cotação completa a partir do carrinho guardado (tudo em BigInt). */
export function buildCart(stored: StoredCart): Cart {
  const items: CartItem[] = []

  for (const { nftId, quantity } of stored.items) {
    const nft = currentNft(nftId)

    if (!nft) {
      continue
    }

    const maxQuantity = maxQuantityOf(nftId)
    const status: CartItemStatus =
      maxQuantity === 0 ? 'sold_out' : quantity > maxQuantity ? 'insufficient_stock' : 'ok'

    items.push({
      nft,
      quantity,
      maxQuantity,
      unitPriceEth: nft.priceEth,
      lineTotalEth: weiToEth(ethToWei(nft.priceEth) * BigInt(quantity)),
      status,
    })
  }

  // Só itens que podem ser comprados entram nos valores.
  const billable = items.filter((item) => item.status === 'ok')
  const subtotal = billable.reduce(
    (sum, item) => sum + ethToWei(item.unitPriceEth) * BigInt(item.quantity),
    0n,
  )

  const coupon = findCoupon(stored.couponCode)
  const discount = coupon ? (subtotal * BigInt(coupon.discountPercent)) / 100n : 0n
  const fee = billable.length > 0 ? ethToWei(NETWORK_FEE_ETH) : 0n

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    coupon: coupon
      ? {
          code: coupon.code,
          description: coupon.description,
          discountPercent: coupon.discountPercent,
        }
      : null,
    subtotalEth: weiToEth(subtotal),
    discountEth: weiToEth(discount),
    networkFeeEth: weiToEth(fee),
    totalEth: weiToEth(subtotal - discount + fee),
    version: stored.version,
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

function quantityLimitError(max: number) {
  return error(409, {
    code: 'quantity_limit',
    message:
      max === 1
        ? 'Limite de 1 unidade por pedido para este NFT.'
        : `Limite de ${max} unidades por pedido para este NFT.`,
  })
}

const invalidQuantity = () =>
  error(422, { code: 'validation_error', message: 'A quantidade deve ser um número inteiro.' })

export const cartHandlers = [
  http.get('/api/cart', ({ request }) => {
    const resolved = resolveOwner(request)

    return resolved instanceof Response
      ? resolved
      : HttpResponse.json(buildCart(readCart(resolved.owner)))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const resolved = resolveOwner(request)

    if (resolved instanceof Response) {
      return resolved
    }

    const body = (await request.json().catch(() => null)) as {
      nftId?: unknown
      quantity?: unknown
    } | null
    const quantity = body?.quantity ?? 1
    const nft = currentNft(typeof body?.nftId === 'string' ? body.nftId : undefined)

    if (!isPositiveInteger(quantity)) {
      return invalidQuantity()
    }

    if (!nft) {
      return error(404, { code: 'nft_not_found', message: 'NFT não encontrado.' })
    }

    const max = maxQuantityOf(nft.id)

    if (max === 0) {
      return error(409, { code: 'sold_out', message: 'Este NFT está esgotado.' })
    }

    const stored = readCart(resolved.owner)
    const current = stored.items.find((item) => item.nftId === nft.id)

    if ((current?.quantity ?? 0) + quantity > max) {
      return quantityLimitError(max)
    }

    const items = current
      ? stored.items.map((item) =>
          item.nftId === nft.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      : [...stored.items, { nftId: nft.id, quantity }]

    return HttpResponse.json(buildCart(writeCart(resolved.owner, { ...stored, items })))
  }),

  http.patch('/api/cart/items/:nftId', async ({ request, params }) => {
    const resolved = resolveOwner(request)

    if (resolved instanceof Response) {
      return resolved
    }

    const body = (await request.json().catch(() => null)) as { quantity?: unknown } | null
    const stored = readCart(resolved.owner)
    const nftId = String(params.nftId)
    const quantity = body?.quantity

    if (!isPositiveInteger(quantity)) {
      return invalidQuantity()
    }

    if (!stored.items.some((item) => item.nftId === nftId)) {
      return error(404, { code: 'item_not_found', message: 'Este item não está no carrinho.' })
    }

    const max = maxQuantityOf(nftId)

    if (max === 0) {
      return error(409, { code: 'sold_out', message: 'Este NFT está esgotado.' })
    }

    if (quantity > max) {
      return quantityLimitError(max)
    }

    const items = stored.items.map((item) =>
      item.nftId === nftId ? { ...item, quantity } : item,
    )

    return HttpResponse.json(buildCart(writeCart(resolved.owner, { ...stored, items })))
  }),

  http.delete('/api/cart/items/:nftId', ({ request, params }) => {
    const resolved = resolveOwner(request)

    if (resolved instanceof Response) {
      return resolved
    }

    const stored = readCart(resolved.owner)
    const items = stored.items.filter((item) => item.nftId !== String(params.nftId))
    // Sem itens, o cupom também deixa de valer.
    const next = items.length === 0 ? { items, version: stored.version } : { ...stored, items }

    return HttpResponse.json(buildCart(writeCart(resolved.owner, next)))
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const resolved = resolveOwner(request)

    if (resolved instanceof Response) {
      return resolved
    }

    const body = (await request.json().catch(() => null)) as { code?: unknown } | null
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
    const stored = readCart(resolved.owner)

    if (!code) {
      return error(422, { code: 'validation_error', message: 'Informe o código do cupom.' })
    }

    if (stored.items.length === 0) {
      return error(409, { code: 'cart_empty', message: 'Adicione itens antes de aplicar um cupom.' })
    }

    const coupon = findCoupon(code)

    if (!coupon) {
      return error(404, { code: 'coupon_invalid', message: 'Cupom inválido.' })
    }

    if (coupon.expiresAt < REFERENCE_DATE) {
      return error(410, { code: 'coupon_expired', message: 'Este cupom expirou.' })
    }

    return HttpResponse.json(
      buildCart(writeCart(resolved.owner, { ...stored, couponCode: coupon.code })),
    )
  }),

  http.delete('/api/cart/coupon', ({ request }) => {
    const resolved = resolveOwner(request)

    if (resolved instanceof Response) {
      return resolved
    }

    const stored = readCart(resolved.owner)

    return HttpResponse.json(
      buildCart(writeCart(resolved.owner, { items: stored.items, version: stored.version })),
    )
  }),

  // Ao entrar, os itens do visitante passam para o carrinho da conta.
  http.post('/api/cart/merge', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return error(401, { code: 'unauthenticated', message: 'Faça login para continuar.' })
    }

    const resolved = resolveOwner(request)

    if (resolved instanceof Response) {
      return resolved
    }

    const guestOwner = `guest:${request.headers.get('X-Guest-Cart') ?? 'anonymous'}`
    const guest = readCart(guestOwner)
    const stored = readCart(resolved.owner)
    const items = stored.items.map((item) => ({ ...item }))

    for (const { nftId, quantity } of guest.items) {
      const existing = items.find((item) => item.nftId === nftId)
      // Itens indisponíveis seguem no carrinho (sinalizados), por isso o mínimo de 1.
      const max = Math.max(maxQuantityOf(nftId), 1)

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, max)
      } else {
        items.push({ nftId, quantity: Math.min(quantity, max) })
      }
    }

    deleteCart(guestOwner)

    return HttpResponse.json(
      buildCart(
        writeCart(resolved.owner, {
          items,
          couponCode: stored.couponCode ?? guest.couponCode,
          version: stored.version,
        }),
      ),
    )
  }),
]
