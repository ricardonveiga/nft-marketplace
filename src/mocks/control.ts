import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types/realtime'
import { nftUpdatedEvent, resetCatalogState, updateNftState, type NftChanges } from './catalog-state'
import { resetAll } from './reset'
import { resetScenarioState } from './scenario-effects'
import {
  connectionsInfo,
  disconnectAll,
  emitNftUpdated,
  getLastEvent,
  replay,
  setOffline,
} from './realtime'

/**
 * Painel de controle do mock, exposto em `window.__mockControl` quando os mocks estão
 * ativos. Serve para desenvolver, demonstrar e testar cenários de tempo real de forma
 * reproduzível. Ele só comanda o SERVIDOR simulado (muda o catálogo, emite eventos, derruba
 * conexões): quem atualiza a interface é o cliente socket.io real, ao receber os eventos.
 */
export type MockControl = {
  /** Muda preço/estoque de um NFT (REST passa a refletir) e emite `nft.updated`. */
  updateNft: (id: string, changes: NftChanges) => NftUpdatedEvent | null
  /** Reemite um evento exatamente como está (duplicata ou evento antigo). */
  replay: (event: NftUpdatedEvent | OrderUpdatedEvent) => void
  /** Emite um evento arbitrário (por exemplo, com versão antiga ou fora de ordem). */
  emit: (event: NftUpdatedEvent) => void
  lastEvent: () => NftUpdatedEvent | OrderUpdatedEvent | null
  /** Derruba todas as conexões; o cliente deve reconectar sozinho. */
  disconnect: () => void
  /** Simula o servidor fora do ar: derruba e recusa novas conexões até voltar. */
  setOffline: (offline: boolean) => void
  /** Conexões abertas e o usuário que cada uma assinou. */
  connections: () => Array<{ userId: string | null }>
  /** Volta o catálogo às fixtures originais. */
  resetCatalog: () => void
  /** Zera os contadores dos cenários (sequência de latência, falhas transitórias já usadas). */
  resetScenario: () => void
  /**
   * Restaura TUDO ao estado inicial conhecido: catálogo, cenário, usuários cadastrados, carrinhos,
   * favoritos, perfis, carteiras, pedidos, sessão e rascunhos. Recarrega a página (`reload: false`
   * desliga isso; o cache da tela só se atualiza com a recarga).
   */
  resetAll: (options?: { reload?: boolean }) => void
}

declare global {
  interface Window {
    __mockControl?: MockControl
  }
}

export const mockControl: MockControl = {
  updateNft(id, changes) {
    const nft = updateNftState(id, changes)

    if (!nft) {
      return null
    }

    const event = nftUpdatedEvent(nft)
    emitNftUpdated(event)

    return event
  },
  replay,
  emit: emitNftUpdated,
  lastEvent: getLastEvent,
  disconnect: disconnectAll,
  setOffline,
  connections: connectionsInfo,
  resetCatalog: resetCatalogState,
  resetScenario: resetScenarioState,
  resetAll,
}
