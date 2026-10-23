// Serialização dos search params do roteador. O padrão do TanStack Router faz
// JSON.parse dos valores ("0.10" viraria o número 0.1), o que não serve para
// preços em ETH. Aqui tudo continua string; listas viram "a,b,c".

export function parseSearch(searchString: string) {
  const params = new URLSearchParams(searchString)
  const result: Record<string, string> = {}

  for (const [key, value] of params) {
    result[key] = value
  }

  return result
}

export function stringifySearch(search: Record<string, unknown>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) {
      continue
    }

    params.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }

  const result = params.toString()

  return result ? `?${result}` : ''
}
