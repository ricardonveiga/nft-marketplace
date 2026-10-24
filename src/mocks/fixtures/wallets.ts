import type { Wallet } from '@/types/wallet'

export type MockWallet = Wallet & {
  userId: string
  /** Simula a carteira recusando a conexão (determinístico). */
  rejectsConnection?: boolean
}

// Carteiras de demonstração. Usuários criados no cadastro começam sem nenhuma.
export const mockWallets: readonly MockWallet[] = [
  {
    id: 'wallet-ana-1',
    userId: 'user-ana',
    label: 'Carteira principal',
    displayName: 'Ana Souza',
    profileName: 'Ana Souza',
    secondary: '',
    walletType: 'MetaMask',
    referralCode: 'KURIO10',
    email: 'ana@kurio.test',
    ensName: 'ana-souza.eth',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    networks: ['Ethereum', 'Polygon'],
    isPrimary: true,
  },
  {
    id: 'wallet-ana-2',
    userId: 'user-ana',
    label: 'Carteira secundária',
    displayName: 'Ana Souza',
    profileName: 'Ana Souza (reserva)',
    secondary: '',
    walletType: 'WalletConnect',
    referralCode: 'KURIO10',
    email: 'ana@kurio.test',
    ensName: 'ana-reserva.eth',
    address: '0x9aF3C1d5E2b84A07fB6C3e1D28a9B05c4e7F1a2B',
    networks: ['Polygon', 'Solana'],
    isPrimary: false,
    rejectsConnection: true,
  },
  {
    id: 'wallet-bruno-1',
    userId: 'user-bruno',
    label: 'Carteira principal',
    displayName: 'Bruno Lima',
    profileName: 'Bruno Lima',
    secondary: '',
    walletType: 'Coinbase Wallet',
    referralCode: 'KURIO10',
    email: 'bruno@kurio.test',
    ensName: 'bruno-lima.eth',
    address: '0x3Fd2A8c7B1e90D4a6C5b2E7f8A1c9D3e0B4a7C6d',
    networks: ['Ethereum', 'Polygon', 'Solana'],
    isPrimary: true,
  },
]
