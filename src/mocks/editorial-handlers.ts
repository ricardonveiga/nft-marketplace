import { HttpResponse, http } from 'msw'
import { getScenario } from './scenario'
import { mockBlogPosts, mockPromotions } from './fixtures/editorial'

// No cenário "empty" não há conteúdo editorial; falhas de rede e 5xx vêm do handler de cenários.
export const editorialHandlers = [
  http.get('/api/promotions', () =>
    HttpResponse.json({ items: getScenario() === 'empty' ? [] : mockPromotions }),
  ),

  http.get('/api/blog/posts', () =>
    HttpResponse.json({ items: getScenario() === 'empty' ? [] : mockBlogPosts }),
  ),
]
