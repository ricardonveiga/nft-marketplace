import { HttpResponse, http } from 'msw'
import { nftsHandlers } from './nfts-handlers'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...nftsHandlers,
]
