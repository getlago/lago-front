import { sortAndFormatThresholds } from '~/components/alerts/utils'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  AlertTypeEnum,
  CreateCustomerWalletAlertInput,
  CurrencyEnum,
  GetWalletAlertToEditQuery,
  ThresholdInput,
  UpdateCustomerWalletAlertInput,
} from '~/generated/graphql'
import { isWalletCreditsAlert } from '~/pages/wallet/walletAlertForm/utils'
import {
  EMPTY_WALLET_ALERT_THRESHOLD,
  TValidatedWalletAlertForm,
  TWalletAlertForm,
} from '~/pages/wallet/walletAlertForm/validationSchema'

type ExistingWalletAlert = GetWalletAlertToEditQuery['walletAlert']

export const mapFromApiToForm = ({
  walletId,
  currency,
  alert,
}: {
  walletId: string
  currency: CurrencyEnum
  alert?: ExistingWalletAlert
}): TWalletAlertForm => ({
  walletId,
  name: alert?.name || '',
  code: alert?.code || '',
  alertType: alert?.alertType || '',
  thresholds: !!alert?.thresholds?.length
    ? // Only the input fields, so the `__typename` of the edit query never
      // reaches the mutation payload
      sortAndFormatThresholds(
        alert.thresholds,
        currency,
        isWalletCreditsAlert(alert.alertType),
      ).map(({ code, recurring, value }) => ({ code, recurring, value }))
    : [EMPTY_WALLET_ALERT_THRESHOLD],
})

/**
 * Credits thresholds are units: truncated to an integer, as the API expects no
 * decimals. Amount thresholds are serialized to cents.
 */
const mapThresholdToInput = ({
  threshold,
  alertType,
  currency,
}: {
  threshold: ThresholdInput
  alertType: AlertTypeEnum | ''
  currency: CurrencyEnum
}): ThresholdInput => {
  const value = threshold.value ?? ''

  return {
    code: threshold.code,
    recurring: threshold.recurring,
    value: isWalletCreditsAlert(alertType)
      ? value.split('.')[0]
      : String(serializeAmount(value, currency)),
  }
}

export const mapFormToCreateInput = (
  { walletId, name, code, alertType, thresholds }: TValidatedWalletAlertForm,
  currency: CurrencyEnum,
): CreateCustomerWalletAlertInput => ({
  walletId,
  name,
  code,
  alertType,
  thresholds: thresholds.map((threshold) =>
    mapThresholdToInput({ threshold, alertType, currency }),
  ),
})

/** The API rejects `alertType` and `walletId` on update: both are immutable. */
export const mapFormToUpdateInput = (
  { name, code, alertType, thresholds }: TValidatedWalletAlertForm,
  id: string,
  currency: CurrencyEnum,
): UpdateCustomerWalletAlertInput => ({
  id,
  name,
  code,
  thresholds: thresholds.map((threshold) =>
    mapThresholdToInput({ threshold, alertType, currency }),
  ),
})
