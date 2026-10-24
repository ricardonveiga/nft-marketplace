import { Link, useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'
import type { Order } from '@/types/order'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** "29 Jul, 2026" (em UTC, para ser determinístico). */
function confirmationDate(iso: string) {
  const date = new Date(iso)

  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${date.getUTCFullYear()}`
}

/** "0xA91F…E82C": os 4 primeiros e os 4 últimos dígitos hexadecimais. */
function shortHash(hash: string) {
  return `0x${hash.slice(2, 6).toUpperCase()}…${hash.slice(-4).toUpperCase()}`
}

function ThankYouIcon() {
  return (
    <svg viewBox="0 0 66 83" width={66} height={83} fill="none" aria-hidden="true" className="text-primary">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M33 2 41 8H25L33 2Z" />
        <path d="M10 7v36M56 7v36M10 7h15M41 7h15" />
        <path d="M2 41 33 66 64 41" />
        <path d="M2 41v39h62V41" />
        <path d="M2 80 28 56M64 80 38 56" />
      </g>
      <text
        x="33"
        y="23"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="var(--font-sans)"
        fill="currentColor"
      >
        THANK
      </text>
      <text
        x="33"
        y="36"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="var(--font-sans)"
        fill="currentColor"
      >
        YOU
      </text>
    </svg>
  )
}

function Separator() {
  return <span aria-hidden="true" className="h-[33px] w-0.5 shrink-0 bg-primary/60 max-md:hidden" />
}

function Fact({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return (
    <div className="flex flex-col text-sm leading-[18px] text-text-secondary">
      <dt className={bold ? 'font-bold' : undefined}>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/**
 * Pedido confirmado (Figma: modal "Seus NFTs agora estão na sua carteira"). Fechar leva ao início.
 * `receipt` traz o recibo completo, só para leitores de tela e testes: o frame mostra o resumo.
 */
export function ConfirmationModal({ order, receipt }: { order: Order; receipt: ReactNode }) {
  const navigate = useNavigate()
  const when = order.settledAt ?? order.createdAt

  return (
    <Dialog.Root open onOpenChange={(open) => !open && void navigate({ to: '/' })}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background print:hidden" />
        <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
          <Dialog.Content
            data-testid="order-confirmed"
            aria-describedby={undefined}
            className="relative mx-auto mt-6 mb-10 w-[min(100%-32px,578px)] bg-card outline-none md:mt-[166px]"
          >
            <Dialog.Close
              aria-label="Fechar"
              className="absolute top-[15px] right-[13px] grid size-5 place-items-center text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </Dialog.Close>

            <div className="flex flex-col items-center pt-[19px] pb-[21px]">
              <ThankYouIcon />
              <Dialog.Title className="mt-[13px] px-6 text-center text-base leading-5 font-bold text-text-secondary">
                Seus NFTs agora estão na sua carteira
              </Dialog.Title>
            </div>

            <dl className="flex items-center justify-between gap-2 border-y border-primary px-[37px] pt-[13px] pb-[16px] max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:px-6">
              <Fact
                bold
                label="ID da transação"
                value={<span data-testid="confirmation-hash" title={order.transactionHash ?? undefined}>{order.transactionHash ? shortHash(order.transactionHash) : '—'}</span>}
              />
              <Separator />
              <Fact label="Data" value={confirmationDate(when)} />
              <Separator />
              <Fact label="Total" value={`${order.totalEth} ETH`} />
              <Separator />
              <Fact bold label="Carteira" value={order.collector.walletType} />
            </dl>

            <div className="px-[44px] pt-[18px] pb-0 max-md:px-6">
              <h2 className="text-[15px] leading-5 font-bold">Detalhes da transação</h2>

              <div
                aria-hidden="true"
                className="mt-[7px] grid grid-cols-[1fr_96px_112px] max-md:grid-cols-[1fr_auto] border-b border-sidebar-line pb-[10px] text-base leading-5 font-bold"
              >
                <span>NFTs</span>
                <span className="text-center max-md:hidden">Edições</span>
                <span className="text-right">Subtotal</span>
              </div>

              <ul className="mt-[12px] flex flex-col gap-3">
                {order.items.map((item) => (
                  <li
                    key={item.nftId}
                    data-testid="confirmation-item"
                    className="grid h-[70px] grid-cols-[1fr_96px_112px] items-center max-md:h-auto max-md:grid-cols-1 max-md:gap-y-1"
                  >
                    <div className="flex min-w-0 items-center gap-[13px]">
                      <img
                        src={item.imageUrl}
                        alt={`${item.name}, da coleção ${item.collection}`}
                        width={70}
                        height={70}
                        className="size-[70px] shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base leading-5 font-bold max-md:whitespace-normal">{item.name}</p>
                        <p className="text-sm leading-5 text-brand-secondary max-md:text-[13px]">ID do token: {item.tokenId}</p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-text-secondary max-md:order-3 max-md:hidden">(x {item.quantity})</p>
                    <p className="pr-1 text-right text-lg font-bold text-text-accent max-md:text-base">
                      <span className="mr-2 text-sm font-normal text-text-secondary md:hidden">(x {item.quantity})</span>
                      {item.lineTotalEth} ETH
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-[13px] flex flex-col gap-[5px]">
                <div className="flex items-baseline justify-between text-[15px] leading-5">
                  <dt className="pl-[169px] max-md:pl-0">Taxa de rede</dt>
                  <dd className="text-right text-[17px]">{order.networkFeeEth} ETH</dd>
                </div>
                <div className="flex items-baseline justify-between text-[15px] leading-5 font-bold">
                  <dt className="pl-[169px] max-md:pl-0">Total</dt>
                  <dd className="text-right text-lg text-text-accent">{order.totalEth} ETH</dd>
                </div>
              </dl>
              <div className="mt-[5px] h-px bg-sidebar-line" />

              <p className="mx-auto mt-[12px] max-w-[470px] text-center text-sm leading-[22px] text-text-secondary">
                Transação confirmada na {order.network}. A propriedade foi transferida para sua carteira
                conectada e registrada na rede.
              </p>

              <div className="mt-[20px] flex justify-center pb-[48px]">
                {order.transactionHash && (
                  <Link
                    to="/explorador/$hash"
                    params={{ hash: order.transactionHash }}
                    className="grid h-12 w-[186px] place-items-center rounded-[4px] bg-primary text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Ver no Etherscan
                  </Link>
                )}
              </div>
            </div>

            <div aria-hidden="true" className="h-[10px] bg-primary" />

            <div className="sr-only">{receipt}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
