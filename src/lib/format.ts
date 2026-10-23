const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})

/** "2026-10-23T01:40:00Z" -> "23 de outubro de 2026 às 01:40 (UTC)". Em UTC para ser determinístico. */
export function formatDateTime(iso: string) {
  return `${dateTimeFormatter.format(new Date(iso))} (UTC)`
}
