const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

/** "2026-10-15T12:00:00Z" -> "15 de outubro de 2026". Em UTC para ser determinístico. */
export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

/** "2026-10-23T01:40:00Z" -> "23 de outubro de 2026 às 01:40 (UTC)". Em UTC para ser determinístico. */
export function formatDateTime(iso: string) {
  return `${dateTimeFormatter.format(new Date(iso))} (UTC)`
}
