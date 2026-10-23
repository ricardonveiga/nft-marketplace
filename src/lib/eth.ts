// Valores em ETH trafegam como string decimal. Nada aqui usa float para dinheiro:
// comparações usam BigInt (18 casas) e o slider da UI usa inteiros de 0,01 ETH.

const ETH_DECIMALS = 18
const DECIMAL_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthDecimal(value: string) {
  return DECIMAL_PATTERN.test(value)
}

/** Converte uma string decimal válida em wei (BigInt). */
export function ethToWei(value: string) {
  const [whole, fraction = ''] = value.split('.')

  return BigInt(whole + fraction.padEnd(ETH_DECIMALS, '0'))
}

export function compareEth(a: string, b: string) {
  const difference = ethToWei(a) - ethToWei(b)

  return difference === 0n ? 0 : difference < 0n ? -1 : 1
}

/** "12.3456" -> 1234 (centésimos de ETH, truncando; usado só pelo slider). */
export function ethToCenti(value: string) {
  const [whole, fraction = ''] = value.split('.')

  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

/** 1234 -> "12.34" */
export function centiToEth(centi: number) {
  const whole = Math.floor(centi / 100)
  const fraction = String(centi % 100).padStart(2, '0')

  return `${whole}.${fraction}`
}

/** "12.30" -> "12,30" (apresentação em pt-BR). */
export function formatEthBr(value: string) {
  return value.replace('.', ',')
}

/** wei (BigInt) -> string decimal em ETH, sem zeros à direita e com no mínimo 2 casas. */
export function weiToEth(wei: bigint, minDecimals = 2) {
  const digits = wei.toString().padStart(ETH_DECIMALS + 1, '0')
  const whole = digits.slice(0, -ETH_DECIMALS)
  const fraction = digits.slice(-ETH_DECIMALS).replace(/0+$/, '').padEnd(minDecimals, '0')

  return `${whole}.${fraction}`
}
