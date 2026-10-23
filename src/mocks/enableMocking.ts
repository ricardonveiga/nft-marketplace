export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }

  const { worker } = await import('./browser')
  const { mockControl } = await import('./control')
  const { migratePlainPasswords } = await import('./users-store')

  // Senhas em claro de versões antigas viram hash antes de qualquer resposta do mock.
  await migratePlainPasswords()

  window.__mockControl = mockControl

  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}
