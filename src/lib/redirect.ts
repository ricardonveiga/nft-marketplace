/**
 * Aceita só caminhos internos ("/nft/nft-03?x=1"). Impede open redirect
 * ("//outro.site", "/\\outro.site", "https://...") e laços para o próprio login.
 */
export function getSafeRedirect(value: unknown) {
  if (typeof value !== 'string') {
    return '/'
  }

  const isInternalPath =
    value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
  const isLogin = value === '/login' || value.startsWith('/login?')

  return isInternalPath && !isLogin ? value : '/'
}

export type AuthSearch = {
  /** Página para onde voltar depois de entrar. */
  redirect?: string
  reason?: 'expired'
}

/**
 * Validação dos search params das telas de login e cadastro. As chaves ausentes
 * ficam como `undefined` explícito: o roteador herda os search params crus da rota
 * pai, e um `redirect` malicioso sobreviveria.
 */
export function validateAuthSearch(raw: Record<string, unknown>): AuthSearch {
  const redirect = getSafeRedirect(raw.redirect)

  return {
    redirect: redirect !== '/' ? redirect : undefined,
    reason: raw.reason === 'expired' ? 'expired' : undefined,
  }
}
