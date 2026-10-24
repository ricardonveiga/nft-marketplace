import type { NftNetwork } from '@/types/nft'

// Rascunho do pagamento na sessão da aba: sobrevive ao refresh sem sair do dispositivo.
const DRAFT_KEY = 'kurio.checkout-draft'
const IDEMPOTENCY_KEY = 'kurio.checkout-key'

// O rascunho e a chave pertencem a um usuário (`userId`): outro usuário na mesma aba nunca os vê,
// mesmo que a limpeza do logout não tenha rodado (aba fechada no meio, token que venceu etc.).
/** Valores digitados no formulário do pagamento (o nome ENS fica sem o sufixo). */
export type CheckoutFormValues = {
  name: string
  username: string
  profileName: string
  email: string
  walletType: string
  walletAddress: string
  secondary: string
  referralCode: string
  ensName: string
  ensSuffix: string
  notes: string
}

export type CheckoutDraft = {
  userId?: string
  values?: Partial<CheckoutFormValues>
  walletId?: string | null
  network?: NftNetwork | ''
  /** "Usar outra carteira?": o endereço que recebe os NFTs é digitado, em vez do da carteira escolhida. */
  otherWallet?: boolean
}

/** Rascunho do usuário; o de outra conta é descartado (e apagado), nunca devolvido. */
export function loadDraft(userId: string): CheckoutDraft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    const draft = raw ? (JSON.parse(raw) as CheckoutDraft) : {}

    if (draft.userId !== userId) {
      window.sessionStorage.removeItem(DRAFT_KEY)

      return {}
    }

    return draft
  } catch {
    return {}
  }
}

export function saveDraft(userId: string, draft: CheckoutDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, userId }))
  } catch {
    // Sem sessionStorage o rascunho vale só enquanto a página estiver aberta.
  }
}

/**
 * Chave de idempotência da tentativa de pagamento. Repetir o mesmo pedido (mesmo
 * conteúdo) reaproveita a chave, inclusive depois de um refresh; conteúdo diferente gera outra.
 */
export function getIdempotencyKey(userId: string, fingerprint: string) {
  try {
    const raw = window.sessionStorage.getItem(IDEMPOTENCY_KEY)
    const stored = raw
      ? (JSON.parse(raw) as { userId?: string; fingerprint: string; key: string })
      : null

    if (stored?.userId === userId && stored.fingerprint === fingerprint) {
      return stored.key
    }

    const created = { userId, fingerprint, key: crypto.randomUUID() }
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

/**
 * Ao abrir uma sessão, apaga o rascunho e a chave que não são do usuário que entrou (a
 * "impressão digital" da chave guarda nome, e-mail e telefone do pedido). Os do mesmo usuário
 * ficam: quem teve a sessão expirada no pagamento volta e retoma de onde parou.
 */
export function clearCheckoutStateOfOthers(userId: string) {
  try {
    for (const key of [DRAFT_KEY, IDEMPOTENCY_KEY]) {
      const raw = window.sessionStorage.getItem(key)

      if (raw && (JSON.parse(raw) as { userId?: string }).userId !== userId) {
        window.sessionStorage.removeItem(key)
      }
    }
  } catch {
    // Sem sessionStorage (ou dado ilegível) não há o que preservar.
    clearCheckoutState()
  }
}
