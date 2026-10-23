export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }

  const { worker } = await import('./browser')
  const { mockControl } = await import('./control')

  window.__mockControl = mockControl

  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}
