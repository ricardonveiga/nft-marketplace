import { HttpResponse, http } from 'msw'
import type { NftListResponse } from '@/types/nft'
import { nfts } from './fixtures/nfts'
import { getScenario } from './scenario'

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const nftsHandlers = [
  http.get('/api/nfts', ({ request }) => {
    const scenario = getScenario()

    if (scenario === 'error') {
      return HttpResponse.json(
        { message: 'Serviço indisponível' },
        { status: 503 },
      )
    }

    const url = new URL(request.url)
    const page = parsePositiveInt(url.searchParams.get('page'), 1)
    const pageSize = Math.min(
      parsePositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    )

    const source = scenario === 'empty' ? [] : nfts
    const start = (page - 1) * pageSize

    const body: NftListResponse = {
      items: source.slice(start, start + pageSize),
      page,
      pageSize,
      total: source.length,
      totalPages: Math.ceil(source.length / pageSize),
    }

    return HttpResponse.json(body)
  }),
]
