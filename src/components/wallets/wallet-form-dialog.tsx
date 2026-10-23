import { isAxiosError } from 'axios'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AuthField } from '@/components/auth/auth-field'
import { Button } from '@/components/ui/button'
import { useCreateWallet, useUpdateWallet } from '@/hooks/use-wallets'
import { NETWORKS } from '@/lib/catalog-search'
import { validateWallet, type FieldErrors, type WalletFields } from '@/lib/validation'
import type { ApiErrorBody } from '@/types/auth'
import type { NftNetwork } from '@/types/nft'
import type { Wallet } from '@/types/wallet'

type WalletFormDialogProps = {
  /** Carteira em edição; sem ela, o formulário cadastra uma nova. */
  wallet?: Wallet
  /** Papel da carteira nova, para o título ("principal" ou "secundária"). */
  role?: 'principal' | 'secundária'
  trigger: ReactNode
  onSaved?: (message: string) => void
}

type FormErrors = FieldErrors<WalletFields> & { form?: string }

/** Formulário de carteira em diálogo de 500 px (mesmo padrão do modal de login). */
export function WalletFormDialog({ wallet, role, trigger, onSaved }: WalletFormDialogProps) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<WalletFields>({ label: '', address: '', networks: [] })
  const [errors, setErrors] = useState<FormErrors>({})
  const labelRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)
  const pending = create.isPending || update.isPending
  const editing = Boolean(wallet)

  function reset(next: boolean) {
    setOpen(next)

    if (next) {
      // Cada abertura começa do estado salvo (ou em branco), sem sobras de tentativas anteriores.
      setValues(
        wallet
          ? { label: wallet.label, address: wallet.address, networks: wallet.networks }
          : { label: '', address: '', networks: [] },
      )
      setErrors({})
    }
  }

  function setField<K extends keyof WalletFields>(field: K, value: WalletFields[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
  }

  function toggleNetwork(network: NftNetwork) {
    setField(
      'networks',
      values.networks.includes(network)
        ? values.networks.filter((item) => item !== network)
        : [...values.networks, network],
    )
  }

  function focusFirstError(found: FormErrors) {
    if (found.label) {
      labelRef.current?.focus()
    } else if (found.address) {
      addressRef.current?.focus()
    } else if (found.networks) {
      document.getElementById('wallet-networks')?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending) {
      return
    }

    const found = validateWallet(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      focusFirstError(found)

      return
    }

    const input = {
      label: values.label.trim(),
      address: values.address.trim(),
      networks: values.networks as NftNetwork[],
    }
    const callbacks = {
      onSuccess: () => {
        setOpen(false)
        onSaved?.(editing ? 'Carteira atualizada.' : 'Carteira cadastrada.')
      },
      onError: (error: unknown) => {
        const body = isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined
        const fieldErrors: FormErrors = { ...body?.errors }

        if (!body?.errors) {
          fieldErrors.form = body?.message ?? 'Não foi possível salvar a carteira. Tente novamente.'
        }

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

  const title = editing ? 'Editar carteira' : `Adicionar carteira ${role ?? ''}`.trim()

  return (
    <Dialog.Root open={open} onOpenChange={reset}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(92vw,500px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border-b-[10px] border-primary bg-card p-6 shadow-[0_0_30px_rgba(10,6,4,0.45)] outline-none sm:p-10"
        >
          <Dialog.Close
            aria-label="Fechar"
            className="absolute top-3 right-3 grid size-6 place-items-center focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </Dialog.Close>

          <Dialog.Title className="mb-6 text-center text-base text-text-accent">{title}</Dialog.Title>

          <form onSubmit={handleSubmit} noValidate className="mx-auto flex max-w-[340px] flex-col gap-4">
            <AuthField
              showLabel
              label="Apelido"
              name="label"
              placeholder="Ex.: Carteira principal"
              autoComplete="off"
              value={values.label}
              error={errors.label}
              onChange={(value) => setField('label', value)}
              inputRef={labelRef}
            />
            <AuthField
              showLabel
              label="Endereço da carteira"
              name="address"
              placeholder="0x…"
              autoComplete="off"
              value={values.address}
              error={errors.address}
              hint="0x seguido de 40 caracteres hexadecimais."
              onChange={(value) => setField('address', value)}
              inputRef={addressRef}
            />

            <fieldset
              id="wallet-networks"
              tabIndex={-1}
              aria-describedby={errors.networks ? 'wallet-networks-error' : undefined}
              className="flex flex-col gap-2 outline-none"
            >
              <legend className="mb-1 text-sm">Redes aceitas</legend>
              {NETWORKS.map((network) => (
                <label key={network} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={values.networks.includes(network)}
                    onChange={() => toggleNetwork(network)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {network}
                </label>
              ))}
              {errors.networks && (
                <p id="wallet-networks-error" role="alert" className="text-xs text-destructive">
                  {errors.networks}
                </p>
              )}
            </fieldset>

            {errors.form && (
              <p role="alert" className="text-sm text-destructive">
                {errors.form}
              </p>
            )}

            <div className="mt-2 flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="h-[45px] rounded-md px-6 text-base font-bold">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className="h-[45px] rounded-md px-6 text-base font-bold"
              >
                {pending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
