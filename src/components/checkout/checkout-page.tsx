import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AuthField } from '@/components/auth/auth-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { storeCart, useCart } from '@/hooks/use-cart'
import { useCreateOrder } from '@/hooks/use-orders'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useWallets } from '@/hooks/use-wallets'
import { shortAddress } from '@/lib/address'
import { formatPhone } from '@/lib/phone'
import {
  clearIdempotencyKey,
  getIdempotencyKey,
  loadDraft,
  saveDraft,
} from '@/lib/checkout-draft'
import {
  NOTES_MAX_LENGTH,
  normalizePhone,
  validateCollector,
  type CollectorFields,
  type FieldErrors,
} from '@/lib/validation'
import type { User } from '@/types/auth'
import type { NftNetwork } from '@/types/nft'
import type { CreateOrderRequest, OrderErrorBody } from '@/types/order'
import { RealtimeNotices } from '@/components/realtime/realtime-notices'
import { CheckoutSummary } from './checkout-summary'
import { WalletSection } from './wallet-section'

type Step = 'form' | 'review'
type Quote = { version: number; totalEth: string }
type Notice = { kind: 'error' | 'warning'; text: string }
type FormErrors = FieldErrors<CollectorFields> & { wallet?: string; network?: string }

const stepLabels: Record<Step, string> = {
  form: 'Dados e carteira',
  review: 'Revisão',
}

const EXTRAS_MEDIA_QUERY = '(min-width: 768px)'
const OPTIONAL_FIELDS = ['username', 'ensName', 'referralCode', 'notes'] as const

/** Campos opcionais preenchidos (aparados); vazios não vão no pedido. */
function optionalFields(collector: CollectorFields) {
  const filled: Partial<Record<(typeof OPTIONAL_FIELDS)[number], string>> = {}

  for (const field of OPTIONAL_FIELDS) {
    const value = collector[field].trim()

    if (value) {
      filled[field] = value
    }
  }

  return filled
}

export function CheckoutPage({ user }: { user: User }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cartQuery = useCart()
  const walletsQuery = useWallets()
  const create = useCreateOrder()
  // O frame mobile do Figma não tem os campos opcionais: só aparecem (e só valem) a partir de 768 px.
  const showExtras = useMediaQuery(EXTRAS_MEDIA_QUERY)

  const [initial] = useState(() => loadDraft(user.id))
  const [collector, setCollector] = useState<CollectorFields>({
    name: user.name,
    email: user.email,
    phone: user.phone ? formatPhone(user.phone) : '',
    username: '',
    ensName: '',
    referralCode: '',
    notes: '',
    // Rascunhos antigos não têm os campos opcionais: os valores acima completam.
    ...initial.collector,
  })
  const [walletId, setWalletId] = useState<string | null>(initial.walletId ?? null)
  const [network, setNetwork] = useState<NftNetwork | ''>(initial.network ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [step, setStep] = useState<Step>('form')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  // Trava síncrona contra cliques repetidos: vale já no mesmo instante do clique,
  // antes mesmo de o React atualizar o estado do botão.
  const submitLock = useRef(false)
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    username: useRef<HTMLInputElement>(null),
    ensName: useRef<HTMLInputElement>(null),
    referralCode: useRef<HTMLInputElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
  }

  // Escondidos, os campos opcionais não são validados nem enviados (o valor digitado fica guardado).
  const effectiveCollector: CollectorFields = showExtras
    ? collector
    : { ...collector, username: '', ensName: '', referralCode: '', notes: '' }
  const cart = cartQuery.data
  const wallets = walletsQuery.data
  const selectedWallet = wallets?.wallets.find((wallet) => wallet.id === walletId)
  const connected = Boolean(selectedWallet) && wallets?.connectedWalletId === selectedWallet?.id

  useEffect(() => {
    saveDraft(user.id, { collector, walletId, network })
  }, [user.id, collector, walletId, network])

  // Carteira padrão: a principal; rede padrão: a primeira que a carteira aceita.
  useEffect(() => {
    if (!wallets || wallets.wallets.length === 0) {
      return
    }

    const current = wallets.wallets.find((wallet) => wallet.id === walletId)
    const wallet = current ?? wallets.wallets.find((candidate) => candidate.isPrimary) ?? wallets.wallets[0]

    if (!current) {
      setWalletId(wallet.id)
    }

    if (!network || !wallet.networks.includes(network)) {
      setNetwork(wallet.networks[0])
    }
  }, [wallets, walletId, network])

  useEffect(() => {
    if (step === 'review') {
      reviewHeading.current?.focus()
    }
  }, [step])

  if (cartQuery.isPending) {
    return (
      <div role="status" aria-label="Carregando pedido" className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (cartQuery.isError || !cart) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
        <p>Não foi possível carregar o seu pedido.</p>
        <Button onClick={() => cartQuery.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div data-testid="checkout-empty" className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-text-secondary">Seu carrinho está vazio.</p>
        <Button asChild className="h-[45px] rounded-md px-6 text-base font-bold">
          <Link to="/">Explorar NFTs</Link>
        </Button>
      </div>
    )
  }

  const blocked = cart.items.some((item) => item.status !== 'ok')
  const stale =
    step === 'review' &&
    quote !== null &&
    (cart.version !== quote.version || cart.totalEth !== quote.totalEth)

  function setCollectorField(field: keyof CollectorFields, value: string) {
    setCollector((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function focusFirstError(found: FormErrors) {
    const field = (['name', 'email', 'phone', 'username', 'ensName', 'referralCode', 'notes'] as const).find(
      (key) => found[key],
    )

    if (field) {
      refs[field].current?.focus()
    } else if (found.wallet) {
      document.getElementById('checkout-wallet')?.focus()
    } else if (found.network) {
      document.getElementById('checkout-network')?.focus()
    }
  }

  function goToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    const found: FormErrors = { ...validateCollector(effectiveCollector) }

    if (!selectedWallet) {
      found.wallet = 'Selecione uma carteira.'
    } else if (!connected) {
      found.wallet = 'Conecte a carteira para continuar.'
    }

    if (!network || !selectedWallet?.networks.includes(network)) {
      found.network = 'Selecione a rede de pagamento.'
    }

    setErrors(found)

    if (Object.keys(found).length > 0 || !cart) {
      focusFirstError(found)

      return
    }

    // A cotação que o usuário vê aqui é a que a API vai exigir no envio.
    setQuote({ version: cart.version, totalEth: cart.totalEth })
    setAccepted(false)
    setTermsError('')
    setStep('review')
  }

  function acceptNewValues() {
    if (!cart) {
      return
    }

    setQuote({ version: cart.version, totalEth: cart.totalEth })
    setAccepted(false)
    setNotice(null)
  }

  function confirm() {
    if (submitLock.current || create.isPending) {
      return
    }

    if (!accepted) {
      setTermsError('Aceite os termos de compra para continuar.')

      return
    }

    if (!quote || !selectedWallet || !network) {
      return
    }

    setNotice(null)
    setTermsError('')

    const request: CreateOrderRequest = {
      collector: {
        name: collector.name.trim(),
        email: collector.email.trim(),
        phone: normalizePhone(collector.phone),
        ...optionalFields(effectiveCollector),
      },
      walletId: selectedWallet.id,
      network,
      quote,
    }
    // Mesmo conteúdo = mesma chave: reenviar depois de um timeout recupera o mesmo pedido.
    const key = getIdempotencyKey(user.id, JSON.stringify(request))

    submitLock.current = true
    create.mutate(
      { request, key },
      {
        onSuccess: (order) => {
          // O rascunho só é descartado quando o pedido é confirmado (na página do pedido).
          clearIdempotencyKey()
          void navigate({ to: '/pedido/$id', params: { id: order.id }, replace: true })
        },
        onError: (error) => handleError(error),
        onSettled: () => {
          submitLock.current = false
        },
      },
    )
  }

  function handleError(error: unknown) {
    if (!isAxiosError<OrderErrorBody>(error) || !error.response) {
      setNotice({
        kind: 'warning',
        text: 'Não recebemos a resposta do servidor. Seu pedido pode ter sido criado. Confirme de novo: não haverá cobrança em duplicidade.',
      })

      return
    }

    const body = error.response.data

    switch (body?.code) {
      case 'quote_changed':
        if (body.cart) {
          storeCart(queryClient, body.cart)
          setQuote({ version: body.cart.version, totalEth: body.cart.totalEth })
        }
        setAccepted(false)
        setNotice({
          kind: 'error',
          text: 'Os valores do seu pedido mudaram. Confira o novo resumo e confirme novamente.',
        })
        break
      case 'items_unavailable':
        if (body.cart) {
          storeCart(queryClient, body.cart)
        }
        setStep('form')
        setNotice({
          kind: 'error',
          text: 'Alguns itens ficaram indisponíveis. Ajuste o carrinho para continuar.',
        })
        break
      case 'wallet_not_connected':
        setStep('form')
        setErrors({ wallet: body.message ?? 'Conecte a carteira para continuar.' })
        break
      case 'validation_error':
        setStep('form')
        setErrors(body.errors ?? {})
        focusFirstError(body.errors ?? {})
        break
      case 'order_in_progress':
        if (body.orderId) {
          void navigate({ to: '/pedido/$id', params: { id: body.orderId }, replace: true })
        }
        break
      case 'cart_empty':
        void navigate({ to: '/carrinho', replace: true })
        break
      case 'idempotency_conflict':
        clearIdempotencyKey()
        setNotice({ kind: 'error', text: 'Não foi possível concluir. Tente confirmar novamente.' })
        break
      default:
        setNotice({
          kind: 'error',
          text: body?.message ?? 'Não foi possível concluir o pedido. Tente novamente.',
        })
    }
  }

  const steps: Step[] = ['form', 'review']

  return (
    <div className="flex flex-col gap-6">
      <ol aria-label="Etapas do pagamento" className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {steps.map((item, index) => (
          <li
            key={item}
            aria-current={item === step ? 'step' : undefined}
            className={item === step ? 'font-bold text-text-accent' : 'text-text-secondary'}
          >
            {index + 1}. {stepLabels[item]}
          </li>
        ))}
      </ol>

      <RealtimeNotices nftIds={cart.items.map((item) => item.nft.id)} />

      {notice && (
        <p
          role="alert"
          className={`rounded-md bg-card px-4 py-3 text-sm ${notice.kind === 'warning' ? 'text-text-accent' : 'text-destructive'}`}
        >
          {notice.text}
        </p>
      )}

      {blocked && (
        <p role="alert" className="rounded-md bg-card px-4 py-3 text-sm text-destructive">
          Há itens indisponíveis no carrinho.{' '}
          <Link to="/carrinho" className="underline underline-offset-4">
            Ajustar carrinho
          </Link>
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {step === 'form' ? (
          <form
            onSubmit={goToReview}
            noValidate
            className="flex flex-col gap-8 rounded-lg bg-card p-6"
          >
            <section aria-labelledby="dados" className="flex flex-col gap-4">
              <h2 id="dados" className="text-lg leading-4">
                Perfil do colecionador
              </h2>
              <AuthField
                showLabel
                label="Nome completo"
                name="name"
                placeholder="Seu nome completo"
                autoComplete="name"
                value={collector.name}
                error={errors.name}
                onChange={(value) => setCollectorField('name', value)}
                inputRef={refs.name}
              />
              <AuthField
                showLabel
                label="E-mail"
                name="email"
                type="email"
                placeholder="contato@email.com"
                autoComplete="email"
                value={collector.email}
                error={errors.email}
                onChange={(value) => setCollectorField('email', value)}
                inputRef={refs.email}
              />
              <AuthField
                showLabel
                label="Telefone"
                name="phone"
                type="tel"
                placeholder="(11) 91234-5678"
                autoComplete="tel"
                value={collector.phone}
                error={errors.phone}
                onChange={(value) => setCollectorField('phone', value)}
                inputRef={refs.phone}
              />
              {showExtras && (
                <>
                  <AuthField
                    showLabel
                    label="Nome de usuário (opcional)"
                    name="username"
                    placeholder="seu_usuario"
                    autoComplete="username"
                    value={collector.username}
                    error={errors.username}
                    onChange={(value) => setCollectorField('username', value)}
                    inputRef={refs.username}
                  />
                  <AuthField
                    showLabel
                    label="Nome ENS (opcional)"
                    name="ensName"
                    placeholder="nome.eth"
                    autoComplete="off"
                    value={collector.ensName}
                    error={errors.ensName}
                    onChange={(value) => setCollectorField('ensName', value)}
                    inputRef={refs.ensName}
                  />
                  <AuthField
                    showLabel
                    label="Código de indicação (opcional)"
                    name="referralCode"
                    placeholder="KURIO2026"
                    autoComplete="off"
                    value={collector.referralCode}
                    error={errors.referralCode}
                    onChange={(value) => setCollectorField('referralCode', value)}
                    inputRef={refs.referralCode}
                  />
                  <div className="flex flex-col gap-1">
                    <label htmlFor="checkout-notes" className="text-sm">
                      Observação (opcional)
                    </label>
                    <textarea
                      id="checkout-notes"
                      ref={refs.notes}
                      name="notes"
                      rows={3}
                      maxLength={NOTES_MAX_LENGTH}
                      value={collector.notes}
                      onChange={(event) => setCollectorField('notes', event.target.value)}
                      aria-invalid={errors.notes ? true : undefined}
                      aria-describedby={errors.notes ? 'checkout-notes-error' : undefined}
                      className="w-full resize-y rounded-md bg-surface-dark px-4 py-2 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive"
                    />
                    {errors.notes && (
                      <p id="checkout-notes-error" className="text-xs text-destructive">
                        {errors.notes}
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>

            <section aria-labelledby="carteira" className="flex flex-col gap-4">
              <h2 id="carteira" className="text-lg leading-4">
                Carteira e rede
              </h2>
              <WalletSection
                walletId={walletId}
                network={network}
                onWalletChange={(id) => {
                  setWalletId(id)
                  setErrors((current) => ({ ...current, wallet: undefined, network: undefined }))
                }}
                onNetworkChange={(value) => {
                  setNetwork(value)
                  setErrors((current) => ({ ...current, network: undefined }))
                }}
                extras={showExtras}
                walletError={errors.wallet}
                networkError={errors.network}
              />
            </section>

            <Button
              type="submit"
              disabled={blocked}
              className="h-[45px] w-full rounded-md text-base font-bold sm:w-auto sm:self-end sm:px-8"
            >
              Revisar pedido
            </Button>
          </form>
        ) : (
          <section aria-labelledby="revisao" className="flex flex-col gap-6 rounded-lg bg-card p-6">
            <h2 id="revisao" ref={reviewHeading} tabIndex={-1} className="text-lg leading-4 outline-none">
              Revise seu pedido
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2" data-testid="review-details">
              <div>
                <dt className="text-sm text-text-secondary">Colecionador</dt>
                <dd>{collector.name.trim()}</dd>
                <dd className="text-sm">{collector.email.trim()}</dd>
                <dd className="text-sm">{formatPhone(collector.phone)}</dd>
                {effectiveCollector.username.trim() && <dd className="text-sm">@{effectiveCollector.username.trim()}</dd>}
                {effectiveCollector.ensName.trim() && <dd className="text-sm">{effectiveCollector.ensName.trim()}</dd>}
              </div>
              <div>
                <dt className="text-sm text-text-secondary">Carteira</dt>
                <dd>{selectedWallet?.label}</dd>
                <dd className="text-sm" title={selectedWallet?.address}>
                  {selectedWallet ? shortAddress(selectedWallet.address) : ''}
                </dd>
                <dt className="mt-2 text-sm text-text-secondary">Rede</dt>
                <dd>{network}</dd>
              </div>
            </dl>

            {stale && (
              <div role="alert" className="flex flex-col items-start gap-3 rounded-md bg-surface-dark p-4 text-sm">
                <p className="text-text-accent">
                  Os valores do pedido mudaram desde a sua revisão. Confira o resumo e aceite os novos
                  valores para continuar.
                </p>
                <Button type="button" variant="outline" onClick={acceptNewValues} className="h-9 rounded-md px-4 text-sm font-bold">
                  Aceitar novos valores
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => {
                    setAccepted(event.target.checked)
                    setTermsError('')
                  }}
                  aria-invalid={termsError ? true : undefined}
                  aria-describedby={termsError ? 'terms-error' : undefined}
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                />
                <span>Li e aceito os termos de compra de NFTs.</span>
              </label>
              {termsError && (
                <p id="terms-error" role="alert" className="text-xs text-destructive">
                  {termsError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={create.isPending}
                onClick={() => {
                  setNotice(null)
                  setStep('form')
                }}
                className="h-[45px] rounded-md px-6 text-base font-bold"
              >
                Voltar e editar
              </Button>
              <Button
                type="button"
                onClick={confirm}
                disabled={create.isPending || stale || blocked}
                aria-busy={create.isPending}
                className="h-[45px] rounded-md px-8 text-base font-bold"
              >
                {create.isPending ? 'Processando…' : 'Confirmar compra'}
              </Button>
            </div>
          </section>
        )}

        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
