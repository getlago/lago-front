import { AlertTypeEnum, ThresholdInput } from '~/generated/graphql'

/** Credits alerts hold units, not amounts: no currency, integer values only. */
export const isWalletCreditsAlert = (alertType: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.WalletCreditsBalance ||
  alertType === AlertTypeEnum.WalletCreditsOngoingBalance

/** Ongoing balances can go below zero, so their thresholds accept negatives. */
export const isWalletOngoingAlert = (alertType: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.WalletOngoingBalanceAmount ||
  alertType === AlertTypeEnum.WalletCreditsOngoingBalance

/**
 * The thresholds table is form-library agnostic: it patches a single cell with
 * an untyped value. This is the one boundary where that value is turned back
 * into a typed threshold, one key at a time.
 *
 * An emptied cell arrives as `undefined`; `value` is stored as `''` instead
 * since the API type requires a string, and both are equally empty for the
 * validation, the inputs and the serialized payload.
 */
export const patchThreshold = (
  threshold: ThresholdInput,
  key: keyof ThresholdInput,
  newValue: unknown,
): ThresholdInput => {
  const asString = newValue === undefined || newValue === null ? undefined : String(newValue)

  if (key === 'code') return { ...threshold, code: asString }
  if (key === 'recurring') return { ...threshold, recurring: !!newValue }

  return { ...threshold, value: asString ?? '' }
}
