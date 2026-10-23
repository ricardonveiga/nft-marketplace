/**
 * Hash SHA-256 (hexadecimal) da senha. Os mocks nunca guardam a senha em claro: contas
 * cadastradas e senhas trocadas ficam no localStorage só como hash, e o login e a troca de
 * senha comparam hashes. Num backend de verdade o certo seria um hash lento e com sal
 * (argon2/bcrypt); aqui o objetivo é não deixar a senha legível no armazenamento.
 */
export async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
