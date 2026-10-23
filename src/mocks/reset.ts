import { resetScenarioState } from './scenario-effects'
import { setOffline } from './realtime'

// Todo estado persistido pelo servidor simulado começa com este prefixo (catálogo, cenário,
// usuários, carrinhos, favoritos, perfis, carteiras, conexão, pedidos, idempotência e a
// sequência de pedidos). Um prefixo só garante que nada novo fique de fora do reset.
const MOCK_PREFIX = 'mock-'
// O que o próprio cliente guarda: sessão, carrinho do visitante e rascunho do pagamento.
const CLIENT_KEYS = ['kurio.session', 'kurio.guest-cart']

function removeKeys(storage: Storage, shouldRemove: (key: string) => boolean) {
  Object.keys(storage)
    .filter(shouldRemove)
    .forEach((key) => storage.removeItem(key))
}

/**
 * Volta TUDO ao estado inicial conhecido (o de quem abre o app pela primeira vez): estado
 * persistido do mock, contadores dos cenários, servidor de eventos e dados do cliente. Por
 * padrão recarrega a página, porque o cache do TanStack Query ainda guardaria o estado antigo.
 */
export function resetAll({ reload = true }: { reload?: boolean } = {}) {
  try {
    removeKeys(window.localStorage, (key) => key.startsWith(MOCK_PREFIX) || CLIENT_KEYS.includes(key))
    window.sessionStorage.clear()
  } catch {
    // Sem armazenamento não há estado guardado para limpar.
  }

  resetScenarioState()
  setOffline(false)

  if (reload) {
    // Depois de devolver o controle: quem chamou (console ou teste) não perde a resposta.
    window.setTimeout(() => window.location.reload(), 0)
  }
}
