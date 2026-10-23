import { HttpResponse, http } from 'msw'
import { authHandlers } from './auth-handlers'
import { cartHandlers } from './cart-handlers'
import { favoritesHandlers } from './favorites-handlers'
import { nftsHandlers } from './nfts-handlers'
import { ordersHandlers } from './orders-handlers'
import { walletsHandlers } from './wallets-handlers'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...authHandlers,
  ...cartHandlers,
  ...favoritesHandlers,
  ...nftsHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
]
