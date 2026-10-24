import type { MouseEvent } from 'react'

/** "Explorar": rola até o catálogo e leva o foco junto (sem mexer na URL nem nos filtros). */
export function exploreCatalog(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()

  const catalog = document.getElementById('mercado')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  catalog?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  // Quem navega por teclado ou leitor de tela continua de onde rolou.
  catalog?.focus({ preventScroll: true })
}
