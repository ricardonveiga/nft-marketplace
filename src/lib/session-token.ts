const STORAGE_KEY = 'kurio.session'

type Listener = () => void

const expiredListeners = new Set<Listener>()

export function getSessionToken() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // Sem localStorage a sessão vale só até o próximo refresh.
  }
}

export function clearSessionToken() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada a limpar.
  }
}

/** O Axios avisa aqui quando a API responde que a sessão expirou. */
export function onSessionExpired(listener: Listener) {
  expiredListeners.add(listener)

  return () => {
    expiredListeners.delete(listener)
  }
}

export function emitSessionExpired() {
  expiredListeners.forEach((listener) => listener())
}
