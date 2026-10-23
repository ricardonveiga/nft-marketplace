import { HttpResponse, http } from 'msw'
import { authHandlers } from './auth-handlers'
import { cartHandlers } from './cart-handlers'
import { explorerHandlers } from './explorer-handlers'
import { favoritesHandlers } from './favorites-handlers'
import { nftsHandlers } from './nfts-handlers'
import { profileHandlers } from './profile-handlers'
import { ordersHandlers } from './orders-handlers'
import { realtimeHandlers } from './realtime'
import { scenarioHandlers } from './scenario-effects'
import { walletsHandlers } from './wallets-handlers'

export const handlers = [
  // Primeiro: aplica o cenário ativo (latência, falhas) e deixa o handler da rota responder.
  ...scenarioHandlers,
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...authHandlers,
  ...profileHandlers,
  ...cartHandlers,
  ...favoritesHandlers,
  ...explorerHandlers,
  ...nftsHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
  ...realtimeHandlers,
]
