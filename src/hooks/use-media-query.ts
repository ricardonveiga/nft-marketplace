import { useSyncExternalStore } from 'react'

/** Acompanha uma media query (ex.: `(min-width: 768px)`); acompanha redimensionamento e rotação. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)

      list.addEventListener('change', notify)

      return () => list.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
