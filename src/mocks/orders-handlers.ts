import { HttpResponse, http } from 'msw'
import { validateCollector, type CollectorFields } from '@/lib/validation'
import type { CollectorData, Order, CreateOrderRequest, OrderErrorBody } from '@/types/order'
import { authenticate } from './auth-handlers'
import { buildCart } from './cart-handlers'
import { readCart } from './cart-store'
import {
  SETTLE_AFTER_MS,
  listOrders,
  nextOrderId,
  readIdempotency,
  saveIdempotency,
  saveOrder,
  toPublicOrder,
  type StoredOrder,
} from './orders-store'
import { scheduleOrderSettlement } from './realtime'
import { getScenario } from './scenario'
import { readConnectedWalletId, walletsOf } from './wallets-handlers'

/** Campos de texto do colecionador, aparados e com "" no lugar de ausentes (a API não confia no cliente). */
function toCollectorFields(collector: Partial<CollectorData>): CollectorFields {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

  return {
    name: text(collector.name),
    username: text(collector.username),
    profileName: text(collector.profileName),
    email: text(collector.email),
    walletType: text(collector.walletType),
    walletAddress: text(collector.walletAddress),
    secondary: text(collector.secondary),
    referralCode: text(collector.referralCode),
    ensName: text(collector.ensName),
    notes: typeof collector.notes === 'string' ? collector.notes : '',
  }
}

function error(status: number, body: OrderErrorBody) {
  return HttpResponse.json(body, { status })
}

export const ordersHandlers = [
  http.post('/api/orders', async ({ request }) => {
    if (getScenario() === 'error') {
      return error(503, { code: 'unavailable', message: 'Serviço indisponível' })
    }

    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const key = request.headers.get('Idempotency-Key')

    if (!key) {
      return error(400, {
        code: 'idempotency_key_required',
        message: 'Chave de idempotência obrigatória.',
      })
    }

    const body = (await request.json().catch(() => null)) as CreateOrderRequest | null
    const hash = JSON.stringify(body)

    // Mesma chave + mesmo conteúdo: devolve o mesmo pedido, sem criar outro.
    const previous = readIdempotency(user.id, key)

    if (previous) {
      const existing = listOrders(user.id).find((order) => order.id === previous.orderId)

      if (previous.hash !== hash || !existing) {
        return error(409, {
          code: 'idempotency_conflict',
          message: 'Esta chave já foi usada com outro conteúdo.',
        })
      }

      return HttpResponse.json(
        { order: toPublicOrder(existing) },
        { status: 200, headers: { 'Idempotent-Replayed': 'true' } },
      )
    }

    if (!body?.collector || !body.walletId || !body.network || !body.quote) {
      return error(422, { code: 'validation_error', message: 'Pedido incompleto.' })
    }

    const inProgress = listOrders(user.id).find((order) => order.status === 'pending')

    if (inProgress) {
      return error(409, {
        code: 'order_in_progress',
        message: 'Você já tem um pedido em processamento.',
        orderId: inProgress.id,
      })
    }

    const collector = toCollectorFields(body.collector)
    const collectorErrors = validateCollector(collector)
    const wallet = walletsOf(user.id).find((candidate) => candidate.id === body.walletId)

    if (!wallet) {
      return error(404, { code: 'wallet_not_found', message: 'Carteira não encontrada.' })
    }

    const errors: NonNullable<OrderErrorBody['errors']> = { ...collectorErrors }

    if (!wallet.networks.includes(body.network)) {
      errors.network = 'Esta carteira não opera na rede escolhida.'
    }

    if (Object.keys(errors).length > 0) {
      return error(422, { code: 'validation_error', errors })
    }

    if (readConnectedWalletId(user.id) !== wallet.id) {
      return error(409, {
        code: 'wallet_not_connected',
        message: 'Conecte a carteira para concluir o pagamento.',
      })
    }

    // Revalida preço, disponibilidade, cupom e taxas: qualquer diferença exige nova confirmação.
    const cart = buildCart(readCart(`user:${user.id}`))

    if (cart.items.length === 0) {
      return error(409, { code: 'cart_empty', message: 'Seu carrinho está vazio.' })
    }

    if (cart.items.some((item) => item.status !== 'ok')) {
      return error(409, {
        code: 'items_unavailable',
        message: 'Alguns itens ficaram indisponíveis.',
        cart,
      })
    }

    if (cart.version !== body.quote.version || cart.totalEth !== body.quote.totalEth) {
      return error(409, {
        code: 'quote_changed',
        message: 'Os valores do pedido mudaram. Revise e confirme novamente.',
        cart,
      })
    }

    const order: StoredOrder = {
      id: nextOrderId(),
      status: 'pending',
      version: 1,
      createdAt: new Date().toISOString(),
      items: cart.items.map(({ nft, quantity, unitPriceEth, lineTotalEth }) => ({
        nftId: nft.id,
        name: nft.name,
        collection: nft.collection,
        edition: nft.edition,
        tokenId: nft.tokenId,
        imageUrl: nft.imageUrl,
        quantity,
        unitPriceEth,
        lineTotalEth,
      })),
      couponCode: cart.coupon?.code ?? null,
      subtotalEth: cart.subtotalEth,
      discountEth: cart.discountEth,
      networkFeeEth: cart.networkFeeEth,
      totalEth: cart.totalEth,
      collector: {
        name: collector.name,
        username: collector.username,
        profileName: collector.profileName,
        email: collector.email,
        walletType: collector.walletType as CollectorData['walletType'],
        walletAddress: collector.walletAddress,
        referralCode: collector.referralCode,
        ensName: collector.ensName,
        // Opcionais: só entram no retrato quando informados.
        ...(collector.secondary ? { secondary: collector.secondary } : {}),
        ...(collector.notes.trim() ? { notes: collector.notes.trim() } : {}),
      },
      wallet: { id: wallet.id, label: wallet.label, address: wallet.address },
      network: body.network,
      settledAt: null,
      transactionHash: null,
      declineReason: null,
      settleAt: Date.now() + SETTLE_AFTER_MS,
    }

    saveOrder(user.id, order)
    saveIdempotency(user.id, key, { hash, orderId: order.id })
    scheduleOrderSettlement(user.id, order.id)

    // Timeout simulado: o pedido FOI criado, mas a resposta não chega. Vale uma vez só;
    // reenviar com a mesma chave recupera o mesmo pedido.
    if (getScenario() === 'order-timeout') {
      window.localStorage.removeItem('mock-scenario')

      return HttpResponse.error()
    }

    return HttpResponse.json({ order: toPublicOrder(order) }, { status: 201 })
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const user = authenticate(request)

    if (user instanceof Response) {
      return user
    }

    const order = listOrders(user.id).find((candidate) => candidate.id === params.id)

    if (!order) {
      return error(404, { code: 'order_not_found', message: 'Pedido não encontrado.' })
    }

    const body: { order: Order } = { order: toPublicOrder(order) }

    return HttpResponse.json(body)
  }),
]
