import { isAxiosError } from 'axios'
import { AlertDialog } from 'radix-ui'
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { EnsField, SelectField, TextField } from '@/components/forms/fields'
import { Button } from '@/components/ui/button'
import { useCreateWallet, useDeleteWallet, useUpdateWallet } from '@/hooks/use-wallets'
import { getApiErrorMessage } from '@/lib/api-error'
import { NETWORKS } from '@/lib/catalog-search'
import { validateWallet, type FieldErrors, type WalletFields } from '@/lib/validation'
import type { ApiErrorBody } from '@/types/auth'
import type { NftNetwork } from '@/types/nft'
import { ENS_SUFFIXES, WALLET_TYPES, type Wallet, type WalletInput } from '@/types/wallet'

type Feedback = { kind: 'success' | 'error'; text: string }

type WalletFormProps = {
  /** Carteira em edição; sem ela, o formulário cadastra uma nova. */
  wallet?: Wallet
  role: 'principal' | 'secundária'
  connected?: boolean
  /** Há uma alteração de carteira em andamento: bloqueia as ações. */
  busy: boolean
  onFeedback: (feedback: Feedback) => void
  /** Cancelar o cadastro de uma carteira nova (só quando há como desistir). */
  onCancel?: () => void
  firstFieldRef?: RefObject<HTMLInputElement | null>
}

type Values = Omit<WalletFields, 'network' | 'ensName'> & { network: string; ensLabel: string }
type FormErrors = FieldErrors<WalletFields> & { form?: string }

const FOCUS_ORDER: Array<keyof WalletFields> = [
  'displayName',
  'label',
  'network',
  'profileName',
  'address',
  'secondary',
  'walletType',
  'referralCode',
  'email',
  'ensName',
]

const [ENS_SUFFIX] = ENS_SUFFIXES

function valuesOf(wallet?: Wallet): Values {
  return {
    displayName: wallet?.displayName ?? '',
    label: wallet?.label ?? '',
    network: wallet?.networks[0] ?? '',
    profileName: wallet?.profileName ?? '',
    address: wallet?.address ?? '',
    secondary: wallet?.secondary ?? '',
    walletType: wallet?.walletType ?? '',
    referralCode: wallet?.referralCode ?? '',
    email: wallet?.email ?? '',
    ensLabel: wallet?.ensName.endsWith(ENS_SUFFIX) ? wallet.ensName.slice(0, -ENS_SUFFIX.length) : '',
  }
}

function toFields(values: Values): WalletFields {
  const label = values.ensLabel.trim()

  return {
    displayName: values.displayName,
    label: values.label,
    network: values.network,
    profileName: values.profileName,
    address: values.address,
    secondary: values.secondary,
    walletType: values.walletType,
    referralCode: values.referralCode,
    email: values.email,
    ensName: label ? `${label}${ENS_SUFFIX}` : '',
  }
}

function errorsOf(error: unknown): FormErrors {
  const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined
  const { networks, ...rest } = body?.errors ?? {}
  const found: FormErrors = { ...rest, ...(networks ? { network: networks } : {}) }

  if (!body?.errors) {
    found.form = body?.message ?? 'Não foi possível salvar a carteira. Tente novamente.'
  }

  return found
}

const linkButton =
  'text-sm font-bold text-text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-60'

/** Formulário de carteira do Figma: os mesmos campos para a principal e para a secundária. */
export function WalletForm({
  wallet,
  role,
  connected = false,
  busy,
  onFeedback,
  onCancel,
  firstFieldRef,
}: WalletFormProps) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const [values, setValues] = useState<Values>(() => valuesOf(wallet))
  const [errors, setErrors] = useState<FormErrors>({})
  const ownFirstRef = useRef<HTMLInputElement>(null)
  const refs = {
    displayName: firstFieldRef ?? ownFirstRef,
    label: useRef<HTMLInputElement>(null),
    network: useRef<HTMLSelectElement>(null),
    profileName: useRef<HTMLInputElement>(null),
    address: useRef<HTMLInputElement>(null),
    secondary: useRef<HTMLInputElement>(null),
    walletType: useRef<HTMLSelectElement>(null),
    referralCode: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    ensName: useRef<HTMLInputElement>(null),
  }
  const pending = create.isPending || update.isPending

  function setValue(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({
      ...current,
      [field === 'ensLabel' ? 'ensName' : field]: undefined,
      form: undefined,
    }))
  }

  function focusFirstError(found: FormErrors) {
    const field = FOCUS_ORDER.find((key) => found[key])

    if (field) {
      refs[field].current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending) {
      return
    }

    const fields = toFields(values)
    const found = validateWallet(fields)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    // A rede escolhida vai primeiro; as outras que a carteira já aceitava continuam aceitas.
    const network = fields.network as NftNetwork
    const input: WalletInput = {
      displayName: fields.displayName.trim(),
      label: fields.label.trim(),
      networks: [network, ...(wallet?.networks.filter((item) => item !== network) ?? [])],
      profileName: fields.profileName.trim(),
      address: fields.address.trim(),
      secondary: fields.secondary.trim(),
      walletType: fields.walletType as WalletInput['walletType'],
      referralCode: fields.referralCode.trim(),
      email: fields.email.trim(),
      ensName: fields.ensName.toLowerCase(),
    }
    const callbacks = {
      onSuccess: () => onFeedback({ kind: 'success', text: wallet ? 'Carteira atualizada.' : 'Carteira cadastrada.' }),
      onError: (error: unknown) => {
        const fieldErrors = errorsOf(error)

        setErrors(fieldErrors)
        focusFirstError(fieldErrors)
      },
    }

    if (wallet) {
      update.mutate({ id: wallet.id, update: input }, callbacks)
    } else {
      create.mutate(input, callbacks)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={`Dados da carteira ${role}`}>
      <div className="grid gap-x-[28px] gap-y-[29px] md:grid-cols-2">
        <TextField
          required
          compactPadding
          labelGap={3}
          label="Nome de exibição"
          name="displayName"
          autoComplete="name"
          value={values.displayName}
          error={errors.displayName}
          onChange={(value) => setValue('displayName', value)}
          inputRef={refs.displayName}
        />
        <TextField
          required
          compactPadding
          labelGap={3}
          label="Apelido da carteira"
          name="label"
          autoComplete="off"
          value={values.label}
          error={errors.label}
          onChange={(value) => setValue('label', value)}
          inputRef={refs.label}
        />
        <SelectField
          required
          spacedStar
          mutedPlaceholder
          compactPadding
          labelGap={3}
          label="Rede"
          name="network"
          placeholder="Selecione uma rede"
          options={NETWORKS}
          value={values.network}
          error={errors.network}
          onChange={(value) => setValue('network', value)}
          selectRef={refs.network}
        />
        <TextField
          required
          compactPadding
          labelGap={3}
          label="Nome do perfil"
          name="profileName"
          autoComplete="off"
          value={values.profileName}
          error={errors.profileName}
          onChange={(value) => setValue('profileName', value)}
          inputRef={refs.profileName}
        />
        <TextField
          required
          compactPadding
          labelGap={3}
          label="Endereço da carteira"
          name="address"
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          value={values.address}
          error={errors.address}
          onChange={(value) => setValue('address', value)}
          inputRef={refs.address}
        />
        <TextField
          hideLabel
          compactPadding
          label="ENS ou carteira secundária (opcional)"
          name="secondary"
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          value={values.secondary}
          error={errors.secondary}
          onChange={(value) => setValue('secondary', value)}
          inputRef={refs.secondary}
          className="md:mt-[21px]"
        />
        <SelectField
          required
          mutedPlaceholder
          compactPadding
          labelGap={3}
          label="Tipo de carteira"
          name="walletType"
          placeholder="Selecione uma carteira"
          options={WALLET_TYPES}
          value={values.walletType}
          error={errors.walletType}
          onChange={(value) => setValue('walletType', value)}
          selectRef={refs.walletType}
        />
        <TextField
          required
          compactPadding
          labelGap={3}
          label="Código de indicação"
          name="referralCode"
          autoComplete="off"
          value={values.referralCode}
          error={errors.referralCode}
          onChange={(value) => setValue('referralCode', value)}
          inputRef={refs.referralCode}
        />
        <TextField
          required
          compactPadding
          labelGap={3}
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => setValue('email', value)}
          inputRef={refs.email}
        />
        <EnsField
          required
          spacedStar
          compactPadding
          labelGap={3}
          label="Nome ENS"
          name="ensName"
          value={values.ensLabel}
          error={errors.ensName}
          onChange={(value) => setValue('ensLabel', value)}
          suffix={ENS_SUFFIX}
          suffixOptions={ENS_SUFFIXES}
          onSuffixChange={() => undefined}
          inputRef={refs.ensName}
        />
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="h-10 w-[131px] rounded-[3px] px-0 text-sm font-bold"
        >
          {pending ? 'Salvando…' : 'Salvar carteira'}
        </Button>

        {onCancel && (
          <button type="button" onClick={onCancel} className={linkButton}>
            Cancelar
          </button>
        )}

        {wallet && (
          <WalletActions wallet={wallet} role={role} connected={connected} busy={busy} onFeedback={onFeedback} />
        )}
      </div>
    </form>
  )
}

function WalletActions({
  wallet,
  role,
  connected,
  busy,
  onFeedback,
}: {
  wallet: Wallet
  role: 'principal' | 'secundária'
  connected: boolean
  busy: boolean
  onFeedback: (feedback: Feedback) => void
}) {
  const update = useUpdateWallet()
  const remove = useDeleteWallet()

  function makePrimary() {
    update.mutate(
      { id: wallet.id, update: { isPrimary: true } },
      {
        onSuccess: () => onFeedback({ kind: 'success', text: `${wallet.label} agora é a carteira principal.` }),
        onError: (error) =>
          onFeedback({
            kind: 'error',
            text: getApiErrorMessage(error, 'Não foi possível trocar a carteira principal. Tente novamente.'),
          }),
      },
    )
  }

  function removeWallet() {
    remove.mutate(wallet.id, {
      onSuccess: () => onFeedback({ kind: 'success', text: `${wallet.label} removida.` }),
      onError: (error) =>
        onFeedback({
          kind: 'error',
          text: getApiErrorMessage(error, 'Não foi possível remover a carteira. Tente novamente.'),
        }),
    })
  }

  return (
    <>
      <span
        data-testid="wallet-connection"
        className={`text-sm ${connected ? 'text-text-accent' : 'text-text-secondary'}`}
      >
        {connected ? 'Conectada' : 'Desconectada'}
      </span>

      {!wallet.isPrimary && (
        <button type="button" disabled={busy} onClick={makePrimary} className={linkButton}>
          Definir como principal
          <span className="sr-only"> {wallet.label}</span>
        </button>
      )}

      <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
          <button type="button" disabled={busy} className={`${linkButton} text-destructive`}>
            Remover
            <span className="sr-only"> {wallet.label}</span>
          </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 shadow-[0_0_30px_rgba(10,6,4,0.45)] outline-none">
            <AlertDialog.Title className="text-base">Remover {wallet.label}?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-text-secondary">
              {role === 'principal'
                ? 'Esta é a carteira principal. Se houver outra carteira, ela passará a ser a principal.'
                : 'Esta carteira deixará de poder ser usada nos pagamentos.'}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" className="h-10 rounded-md px-5 font-bold">
                  Cancelar
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button type="button" onClick={removeWallet} className="h-10 rounded-md px-5 font-bold">
                  Remover
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
