/** "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" -> "0x71C7…976F" */
export function shortAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}
