import { HttpResponse, http } from 'msw'
import type { Transaction } from '@/types/explorer'
import { getScenario } from './scenario'
import { findConfirmedOrderByHash } from './orders-store'

// Endereço do contrato do marketplace (simulado): destino de todas as transações.
const MARKETPLACE_ADDRESS = '0x5Ec1a7E0b0fF3Ac91D2e4b6F8c3A7d95E10b2C4F'

function blockNumberOf(hash: string) {
  return 18_000_000 + (parseInt(hash.slice(2, 10), 16) % 2_000_000)
}

export const explorerHandlers = [
  // Consulta pública (como um explorador de blocos real): vale para quem tem o hash.
  http.get('/api/explorer/tx/:hash', ({ params }) => {
    if (getScenario() === 'error') {
      return HttpResponse.json({ message: 'Serviço indisponível' }, { status: 503 })
    }

    const hash = String(params.hash)
    const order = findConfirmedOrderByHash(hash)

    if (!order?.transactionHash || !order.settledAt) {
      return HttpResponse.json(
        { code: 'transaction_not_found', message: 'Transação não encontrada.' },
        { status: 404 },
      )
    }

    const transaction: Transaction = {
      hash: order.transactionHash,
      network: order.network,
      status: 'confirmed',
      blockNumber: blockNumberOf(order.transactionHash),
      confirmedAt: order.settledAt,
      from: order.wallet.address,
      to: MARKETPLACE_ADDRESS,
      valueEth: order.totalEth,
      feeEth: order.networkFeeEth,
    }

    return HttpResponse.json({ transaction })
  }),
]
