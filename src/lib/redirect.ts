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
