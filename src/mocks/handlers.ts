import { HttpResponse, http } from 'msw'
import { authHandlers } from './auth-handlers'
import { cartHandlers } from './cart-handlers'
import { explorerHandlers } from './explorer-handlers'
import { favoritesHandlers } from './favorites-handlers'
import { nftsHandlers } from './nfts-handlers'
import { profileHandlers } from './profile-handlers'
import { ordersHandlers } from './orders-handlers'
import { realtimeHandlers } from './realtime'
import { walletsHandlers } from './wallets-handlers'

export const handlers = [
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
