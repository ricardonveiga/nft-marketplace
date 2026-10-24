import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { RealtimeNotices } from '@/components/realtime/realtime-notices'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { storeCart, useCart } from '@/hooks/use-cart'
import { useCreateOrder } from '@/hooks/use-orders'
import { useWallets } from '@/hooks/use-wallets'
import {
  clearIdempotencyKey,
  getIdempotencyKey,
  loadDraft,
  saveDraft,
  type CheckoutFormValues,
} from '@/lib/checkout-draft'
import { validateCollector } from '@/lib/validation'
import type { User } from '@/types/auth'
import type { NftNetwork } from '@/types/nft'
import type { CollectorData, CreateOrderRequest, OrderErrorBody } from '@/types/order'
import { ENS_SUFFIXES } from '@/types/wallet'
import { CheckoutAside } from './checkout-aside'
import { CheckoutForm, type CheckoutErrors } from './checkout-form'

type Quote = { version: number; totalEth: string }
type Notice = { kind: 'error' | 'warning'; text: string }

/** Valores iniciais: o que a conta já sabe; o resto o colecionador preenche. */
function initialValues(user: User, draft: Partial<CheckoutFormValues> | undefined): CheckoutFormValues {
  return {
    name: user.name,
    username: user.email.split('@')[0] ?? '',
    profileName: user.name,
    email: user.email,
    walletType: '',
    walletAddress: '',
    secondary: '',
    referralCode: '',
    ensName: '',
    ensSuffix: ENS_SUFFIXES[0],
    notes: '',
    ...draft,
  }
}

/** Ordem de leitura dos campos: o primeiro com erro recebe o foco. */
const FIELD_ORDER = [
  'name',
  'username',
  'network',
  'profileName',
  'walletAddress',
  'secondary',
  'walletType',
  'referralCode',
  'email',
  'ensName',
  'notes',
] as const

export function CheckoutPage({ user }: { user: User }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cartQuery = useCart()
  const walletsQuery = useWallets()
  const create = useCreateOrder()

  const [initial] = useState(() => loadDraft(user.id))
  const [values, setValues] = useState<CheckoutFormValues>(() => initialValues(user, initial.values))
  const [walletId, setWalletId] = useState<string | null>(initial.walletId ?? null)
  const [network, setNetwork] = useState<NftNetwork | ''>(initial.network ?? '')
  const [otherWallet, setOtherWallet] = useState(initial.otherWallet ?? false)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [notice, setNotice] = useState<Notice | null>(null)
  // Cotação que a pessoa viu e aceitou. Se a da API mudar, é preciso aceitar de novo.
  const [reviewed, setReviewed] = useState<Quote | null>(null)

  // Trava síncrona contra cliques repetidos: vale já no mesmo instante do clique,
  // antes mesmo de o React atualizar o estado do botão.
  const submitLock = useRef(false)

  const cart = cartQuery.data
  const wallets = walletsQuery.data
  const selectedWallet = wallets?.wallets.find((wallet) => wallet.id === walletId)
  const connected = Boolean(selectedWallet) && wallets?.connectedWalletId === selectedWallet?.id

  useEffect(() => {
    saveDraft(user.id, { values, walletId, network, otherWallet })
  }, [user.id, values, walletId, network, otherWallet])

  // A primeira cotação já atualizada pelo servidor é a "vista" pela pessoa (não a do cache).
  useEffect(() => {
    if (cart && reviewed === null && !cartQuery.isFetching) {
      setReviewed({ version: cart.version, totalEth: cart.totalEth })
    }
  }, [cart, reviewed, cartQuery.isFetching])

  // Carteira padrão: a principal. O endereço e a rede seguem a carteira escolhida.
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

    if (!otherWallet && values.walletAddress !== wallet.address) {
      setValues((currentValues) => ({ ...currentValues, walletAddress: wallet.address }))
    }
  }, [wallets, walletId, network, otherWallet, values.walletAddress])

  if (cartQuery.isPending) {
    return (
      <div role="status" aria-label="Carregando pedido" className="mt-8 grid gap-10 lg:grid-cols-[1fr_405px]">
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
  // Só o total que a pessoa viu importa: a versão do carrinho pode mudar (ex.: união do carrinho de visitante) sem alterar valores.
  const stale = reviewed !== null && cart.totalEth !== reviewed.totalEth

  function setValue<K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function chooseWallet(id: string) {
    const wallet = wallets?.wallets.find((candidate) => candidate.id === id)

    setWalletId(id)
    setErrors((current) => ({ ...current, wallet: undefined, network: undefined, walletAddress: undefined }))

    if (wallet) {
      setNetwork(wallet.networks.includes(network as NftNetwork) ? network : wallet.networks[0])

      if (!otherWallet) {
        setValues((current) => ({ ...current, walletAddress: wallet.address }))
      }
    }
  }

  function toggleOtherWallet(checked: boolean) {
    setOtherWallet(checked)

    if (!checked && selectedWallet) {
      setValues((current) => ({ ...current, walletAddress: selectedWallet.address }))
    }
  }

  function focusFirstError(found: CheckoutErrors) {
    const first = FIELD_ORDER.find((key) => found[key])

    if (first) {
      document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
    } else if (found.wallet) {
      document.getElementById('checkout-wallet')?.focus()
    }
  }

  function toWire(): CollectorData {
    const ens = values.ensName.trim()

    return {
      name: values.name.trim(),
      username: values.username.trim(),
      profileName: values.profileName.trim(),
      email: values.email.trim(),
      walletType: values.walletType as CollectorData['walletType'],
      walletAddress: values.walletAddress.trim(),
      ...(values.secondary.trim() ? { secondary: values.secondary.trim() } : {}),
      referralCode: values.referralCode.trim(),
      ensName: ens ? `${ens}${values.ensSuffix}` : '',
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    }
  }

  function acceptNewValues() {
    if (!cart) {
      return
    }

    setReviewed({ version: cart.version, totalEth: cart.totalEth })
    setNotice(null)
  }

  function confirm() {
    if (submitLock.current || create.isPending || !cart) {
      return
    }

    setNotice(null)

    const wire = toWire()
    const found: CheckoutErrors = validateCollector({
      name: wire.name,
      username: wire.username,
      profileName: wire.profileName,
      email: wire.email,
      walletType: wire.walletType,
      walletAddress: wire.walletAddress,
      secondary: wire.secondary ?? '',
      referralCode: wire.referralCode,
      ensName: wire.ensName,
      notes: wire.notes ?? '',
    })

    if (!selectedWallet) {
      found.wallet = 'Selecione uma carteira.'
    } else if (!connected) {
      found.wallet = 'Conecte a carteira para continuar.'
    }

    if (!network || !selectedWallet?.networks.includes(network)) {
      found.network = 'Selecione a rede de pagamento.'
    }

    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    if (!selectedWallet || !network) {
      return
    }

    const request: CreateOrderRequest = {
      collector: wire,
      walletId: selectedWallet.id,
      network,
      // A cotação que a pessoa viu e aceitou é a que a API vai exigir no envio.
      quote: stale && reviewed ? reviewed : { version: cart.version, totalEth: cart.totalEth },
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
          // A cotação nova fica à mostra, mas só vale depois de a pessoa aceitar.
          storeCart(queryClient, body.cart)
        }
        setNotice({
          kind: 'error',
          text: 'Os valores do seu pedido mudaram. Confira o novo resumo e confirme novamente.',
        })
        break
      case 'items_unavailable':
        if (body.cart) {
          storeCart(queryClient, body.cart)
        }
        setNotice({
          kind: 'error',
          text: 'Alguns itens ficaram indisponíveis. Ajuste o carrinho para continuar.',
        })
        break
      case 'wallet_not_connected':
        setErrors({ wallet: body.message ?? 'Conecte a carteira para continuar.' })
        break
      case 'validation_error':
        setErrors((body.errors ?? {}) as CheckoutErrors)
        focusFirstError((body.errors ?? {}) as CheckoutErrors)
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

  return (
    <>
      <div className="flex flex-col">
        <RealtimeNotices className="mt-6" nftIds={cart.items.map((item) => item.nft.id)} />

        {notice && (
          <p
            role="alert"
            className={`mt-6 rounded-md bg-card px-4 py-3 text-sm ${notice.kind === 'warning' ? 'text-text-accent' : 'text-destructive'}`}
          >
            {notice.text}
          </p>
        )}

        {blocked && (
          <p role="alert" className="mt-6 rounded-md bg-card px-4 py-3 text-sm text-destructive">
            Há itens indisponíveis no carrinho.{' '}
            <Link to="/carrinho" className="underline underline-offset-4">
              Ajustar carrinho
            </Link>
          </p>
        )}

        {stale && (
          <div role="alert" className="mt-6 flex flex-col items-start gap-3 rounded-md bg-card p-4 text-sm">
            <p className="text-text-accent">
              Os valores do pedido mudaram desde a sua revisão. Confira o resumo e aceite os novos valores
              para continuar.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={acceptNewValues}
              className="h-9 rounded-md px-4 text-sm font-bold"
            >
              Aceitar novos valores
            </Button>
          </div>
        )}
      </div>

      <div className="mt-[30px] grid items-start gap-y-10 lg:grid-cols-[764px_405px] lg:gap-x-[31px]">
        <CheckoutForm
          values={values}
          errors={errors}
          network={network}
          wallet={selectedWallet}
          otherWallet={otherWallet}
          onValue={setValue}
          onNetwork={(value) => {
            setNetwork(value)
            setErrors((current) => ({ ...current, network: undefined }))
          }}
          onOtherWallet={toggleOtherWallet}
        />

        <CheckoutAside
          cart={cart}
          walletId={walletId}
          connected={connected}
          error={errors.wallet}
          disabled={create.isPending || stale || blocked}
          pending={create.isPending}
          onWallet={chooseWallet}
          onConfirm={confirm}
        />
      </div>
    </>
  )
}
