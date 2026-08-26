import { FeeTypesEnum } from '~/generated/graphql'

/**
 * Fee types a wallet scope (`appliesTo.feeTypes`) can be limited to. The API accepts
 * the whole `FeeTypesEnum`, but only these are meaningful — and selectable — as a
 * wallet scope.
 */
export type WalletScopeFeeType =
  | FeeTypesEnum.Charge
  | FeeTypesEnum.Commitment
  | FeeTypesEnum.FixedCharge
  | FeeTypesEnum.Subscription

export const WALLET_SCOPE_FEE_TYPES: WalletScopeFeeType[] = [
  FeeTypesEnum.Charge,
  FeeTypesEnum.Commitment,
  FeeTypesEnum.FixedCharge,
  FeeTypesEnum.Subscription,
]

export const WALLET_SCOPE_FEE_TYPE_LABEL_KEYS: Record<WalletScopeFeeType, string> = {
  [FeeTypesEnum.Charge]: 'text_1748441354191rj96qhw3twa',
  [FeeTypesEnum.Commitment]: 'text_1748441354191cnp0tm4ubf0',
  [FeeTypesEnum.FixedCharge]: 'text_1787723331045bdc2a98j3bh',
  [FeeTypesEnum.Subscription]: 'text_6630e3210c13c500cd398ea2',
}
