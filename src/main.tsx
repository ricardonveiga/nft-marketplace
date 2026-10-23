import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setMocksReady } from './lib/mocks-ready'
import { retryDelay, shouldRetry } from './lib/query-retry'
import { enableMocking } from './mocks/enableMocking'
import { parseSearch, stringifySearch } from './lib/search-params'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree, parseSearch, stringifySearch })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry, retryDelay } },
})

// O MSW sobe em paralelo: a tela já renderiza os esqueletos e as requisições esperam o worker.
setMocksReady(enableMocking())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
