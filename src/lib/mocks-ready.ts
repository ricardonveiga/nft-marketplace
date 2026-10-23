let ready: Promise<void> = Promise.resolve()

/**
 * Registra a inicialização dos mocks. A tela renderiza (esqueletos) sem esperar o MSW, e
 * quem fala com a "rede" (Axios e Socket.IO) espera esta promessa antes de começar: assim
 * a primeira requisição já é interceptada, sem atrasar o primeiro desenho.
 */
export function setMocksReady(promise: Promise<unknown>) {
  ready = promise.then(
    () => undefined,
    () => undefined,
  )
}

export function whenMocksReady() {
  return ready
}
