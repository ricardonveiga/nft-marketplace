import { Link } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { shortAddress } from '@/lib/address'
import type { Order } from '@/types/order'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-lg bg-card p-6 print:break-inside-avoid">
      <h2 id={headingId} className="text-lg leading-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value, testId, strong }: { label: string; value: ReactNode; testId?: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? 'text-lg font-bold' : 'text-sm'}`}>
      <dt className={strong ? undefined : 'text-text-secondary'}>{label}</dt>
      <dd data-testid={testId} className={`text-right ${strong ? 'text-text-accent' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

/** Itens do pedido: sempre os valores do momento da compra (retrato do pedido). */
export function OrderItemsSection({ order }: { order: Order }) {
  return (
    <Section title="Itens">
      <ul className="flex flex-col gap-4">
        {order.items.map((item) => (
          <li key={item.nftId} data-testid="order-item" className="flex items-center gap-3">
            <img
              src={item.imageUrl}
              alt={`${item.name}, da coleção ${item.collection}`}
              width={56}
              height={56}
              className="size-14 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1 text-sm">
              <Link
                to="/nft/$id"
                params={{ id: item.nftId }}
                className="block truncate hover:text-text-accent focus-visible:outline-2 focus-visible:outline-ring print:no-underline"
              >
                {item.name}
              </Link>
              <span className="block text-text-secondary">
                {item.collection} · Edição {item.edition}
              </span>
              <span className="block text-text-secondary">
                {item.quantity} × {item.unitPriceEth} ETH
              </span>
            </span>
            <span className="text-sm font-bold" data-testid="order-item-total">
              {item.lineTotalEth} ETH
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function OrderValuesSection({ order }: { order: Order }) {
  return (
    <Section title="Valores">
      <dl className="flex flex-col gap-3">
        <Row label="Subtotal" value={`${order.subtotalEth} ETH`} testId="order-subtotal" />
        {order.couponCode && (
          <Row
            label={`Desconto (${order.couponCode})`}
            value={`-${order.discountEth} ETH`}
            testId="order-discount"
          />
        )}
        <Row label="Taxa de rede" value={`${order.networkFeeEth} ETH`} testId="order-fee" />
        <div className="border-t border-border pt-3">
          <Row label="Total" value={`${order.totalEth} ETH`} testId="order-total" strong />
        </div>
      </dl>
    </Section>
  )
}

export function OrderPaymentSection({ order }: { order: Order }) {
  return (
    <Section title="Pagamento">
      <dl className="flex flex-col gap-2">
        <Row
          label="Carteira"
          value={
            <span title={order.wallet.address}>
              {order.wallet.label} · {shortAddress(order.wallet.address)}
            </span>
          }
          testId="order-wallet"
        />
        <Row label="Rede" value={order.network} testId="order-network" />
      </dl>
    </Section>
  )
}

export function OrderCollectorSection({ order }: { order: Order }) {
  const { collector } = order

  return (
    <Section title="Colecionador">
      <dl className="flex flex-col gap-2">
        <Row label="Nome de exibição" value={collector.name} testId="order-collector-name" />
        <Row label="Nome de usuário" value={collector.username} testId="order-collector-username" />
        <Row label="Nome do perfil" value={collector.profileName} testId="order-collector-profile" />
        <Row label="E-mail" value={collector.email} testId="order-collector-email" />
        <Row label="Tipo de carteira" value={collector.walletType} testId="order-collector-wallet-type" />
        <Row
          label="Carteira que recebe"
          value={<span title={collector.walletAddress}>{shortAddress(collector.walletAddress)}</span>}
          testId="order-collector-address"
        />
        <Row label="Nome ENS" value={collector.ensName} testId="order-collector-ens" />
        <Row label="Código de indicação" value={collector.referralCode} testId="order-collector-referral" />
        {collector.secondary && (
          <Row label="ENS ou carteira secundária" value={collector.secondary} testId="order-collector-secondary" />
        )}
        {collector.notes && <Row label="Observação" value={collector.notes} testId="order-collector-notes" />}
      </dl>
    </Section>
  )
}

/** Referência da transação (simulada), com cópia e link para o explorador simulado. */
export function OrderTransactionSection({ order }: { order: Order }) {
  const [feedback, setFeedback] = useState('')
  const hash = order.transactionHash

  if (!hash) {
    return null
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash as string)
      setFeedback('Referência copiada.')
    } catch {
      setFeedback('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  return (
    <Section title="Transação">
      <p className="text-sm text-text-secondary">
        Referência simulada: este é um ambiente de demonstração e nenhuma rede real é usada.
      </p>
      <p data-testid="order-transaction" className="font-mono text-sm break-all">
        {hash}
      </p>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border-soft px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Copy className="size-4" aria-hidden="true" />
          Copiar referência
        </button>
        <Link
          to="/explorador/$hash"
          params={{ hash }}
          className="text-sm font-bold text-text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Ver no explorador (simulado)
        </Link>
        <p role="status" className="text-sm text-text-accent">
          {feedback}
        </p>
      </div>
    </Section>
  )
}
