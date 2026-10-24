import { EnsField, RingCheck, SelectField, TextareaField, TextField } from '@/components/forms/fields'
import type { CheckoutFormValues } from '@/lib/checkout-draft'
import { NETWORKS } from '@/lib/catalog-search'
import { NOTES_MAX_LENGTH } from '@/lib/validation'
import type { NftNetwork } from '@/types/nft'
import { ENS_SUFFIXES, WALLET_TYPES, type Wallet } from '@/types/wallet'

export type CheckoutErrors = Partial<Record<keyof CheckoutFormValues | 'network' | 'wallet', string>>

type CheckoutFormProps = {
  values: CheckoutFormValues
  errors: CheckoutErrors
  network: NftNetwork | ''
  wallet: Wallet | undefined
  otherWallet: boolean
  onValue: <K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]) => void
  onNetwork: (network: NftNetwork) => void
  onOtherWallet: (checked: boolean) => void
}

/** "Perfil do colecionador" (Figma): duas colunas de 370 px; os de asterisco são obrigatórios. */
export function CheckoutForm({
  values,
  errors,
  network,
  wallet,
  otherWallet,
  onValue,
  onNetwork,
  onOtherWallet,
}: CheckoutFormProps) {
  return (
    <section aria-labelledby="perfil-colecionador" className="flex flex-col">
      <h2 id="perfil-colecionador" className="text-[17px] leading-5 font-bold">
        Perfil do colecionador
      </h2>

      <div className="mt-[14px] grid gap-x-6 gap-y-[17px] md:grid-cols-2">
        <TextField
          required
          label="Nome de exibição"
          name="name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(value) => onValue('name', value)}
        />
        <TextField
          required
          label="Nome de usuário"
          name="username"
          autoComplete="username"
          value={values.username}
          error={errors.username}
          onChange={(value) => onValue('username', value)}
        />
        <SelectField
          required
          label="Rede"
          name="network"
          placeholder="Selecione uma rede"
          options={wallet?.networks ?? NETWORKS}
          value={network}
          error={errors.network}
          onChange={(value) => onNetwork(value as NftNetwork)}
        />
        <TextField
          required
          label="Nome do perfil"
          name="profileName"
          value={values.profileName}
          error={errors.profileName}
          onChange={(value) => onValue('profileName', value)}
        />
        <TextField
          required
          label="Endereço da carteira"
          name="walletAddress"
          placeholder="Endereço 0x da carteira"
          readOnly={!otherWallet}
          value={values.walletAddress}
          error={errors.walletAddress}
          onChange={(value) => onValue('walletAddress', value)}
        />
        <TextField
          hideLabel
          className="md:mt-[24px]"
          label="ENS ou carteira secundária"
          name="secondary"
          placeholder="ENS ou carteira secundária (opcional)"
          value={values.secondary}
          error={errors.secondary}
          onChange={(value) => onValue('secondary', value)}
        />
        <SelectField
          required
          label="Tipo de carteira"
          name="walletType"
          placeholder="Selecione uma carteira"
          options={WALLET_TYPES}
          value={values.walletType}
          error={errors.walletType}
          onChange={(value) => onValue('walletType', value)}
        />
        <TextField
          required
          label="Código de indicação"
          name="referralCode"
          autoComplete="off"
          value={values.referralCode}
          error={errors.referralCode}
          onChange={(value) => onValue('referralCode', value)}
        />
        <TextField
          required
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => onValue('email', value)}
        />
        <EnsField
          required
          label="Nome ENS"
          name="ensName"
          value={values.ensName}
          error={errors.ensName}
          suffix={values.ensSuffix}
          suffixOptions={ENS_SUFFIXES}
          onSuffixChange={(value) => onValue('ensSuffix', value)}
          onChange={(value) => onValue('ensName', value)}
        />
      </div>

      <div className="mt-[23px]">
        <RingCheck checked={otherWallet} onChange={onOtherWallet}>
          Usar outra carteira?
        </RingCheck>
      </div>

      <TextareaField
        className="mt-[27px] md:w-[350px]"
        label="Observação do colecionador (opcional)"
        name="notes"
        maxLength={NOTES_MAX_LENGTH}
        value={values.notes}
        error={errors.notes}
        onChange={(value) => onValue('notes', value)}
      />
    </section>
  )
}
