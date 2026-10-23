import type { NftNetwork } from '@/types/nft'
import type { CollectorData } from '@/types/order'

// Rascunho do pagamento na sessão da aba: sobrevive ao refresh sem sair do dispositivo.
const DRAFT_KEY = 'kurio.checkout-draft'
const IDEMPOTENCY_KEY = 'kurio.checkout-key'

export type CheckoutDraft = {
  collector?: CollectorData
  walletId?: string | null
  network?: NftNetwork | ''
}

export function loadDraft(): CheckoutDraft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)

    return raw ? (JSON.parse(raw) as CheckoutDraft) : {}
  } catch {
    return {}
  }
}

export function saveDraft(draft: CheckoutDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Sem sessionStorage o rascunho vale só enquanto a página estiver aberta.
  }
}

/**
 * Chave de idempotência da tentativa de pagamento. Repetir o mesmo pedido (mesmo
 * conteúdo) reaproveita a chave, inclusive depois de um refresh; conteúdo diferente gera outra.
 */
export function getIdempotencyKey(fingerprint: string) {
  try {
    const raw = window.sessionStorage.getItem(IDEMPOTENCY_KEY)
    const stored = raw ? (JSON.parse(raw) as { fingerprint: string; key: string }) : null

    if (stored?.fingerprint === fingerprint) {
      return stored.key
    }

    const created = { fingerprint, key: crypto.randomUUID() }
    window.sessionStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify(created))

    return created.key
  } catch {
    return crypto.randomUUID()
  }
}

/** Depois de um desfecho (confirmado/recusado) a próxima tentativa precisa de chave nova. */
export function clearIdempotencyKey() {
  try {
    window.sessionStorage.removeItem(IDEMPOTENCY_KEY)
  } catch {
    // Nada a limpar.
  }
}

export function clearCheckoutState() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nada a limpar.
  }

  clearIdempotencyKey()
}
