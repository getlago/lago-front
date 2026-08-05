import { sortAndFormatThresholds } from '~/components/alerts/utils'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  AlertTypeEnum,
  CreateSubscriptionAlertInput,
  CurrencyEnum,
  GetSubscriptionAlertToEditQuery,
  ThresholdInput,
  UpdateSubscriptionAlertInput,
} from '~/generated/graphql'
import { isUnitsAlertType } from '~/pages/alertForm/utils'
import {
  EMPTY_SUBSCRIPTION_ALERT_THRESHOLD,
  TSubscriptionAlertForm,
  TValidatedSubscriptionAlertForm,
} from '~/pages/alertForm/validationSchema'

type ExistingSubscriptionAlert = GetSubscriptionAlertToEditQuery['subscriptionAlert']

export const mapFromApiToForm = ({
  currency,
  alert,
}: {
  currency: CurrencyEnum
  alert?: ExistingSubscriptionAlert
}): TSubscriptionAlertForm => ({
  name: alert?.name || '',
  code: alert?.code || '',
  alertType: alert?.alertType || '',
  billableMetricId: alert?.billableMetric?.id || '',
  // The API does not guarantee the thresholds order (they can be saved via
  // API), so they are sorted by value with the recurring one last. Only the
  // input fields are kept, so the `__typename` of the edit query never
  // reaches the mutation payload.
  thresholds: !!alert?.thresholds?.length
    ? sortAndFormatThresholds(alert.thresholds, currency, isUnitsAlertType(alert.alertType)).map(
        ({ code, recurring, value }) => ({ code, recurring, value }),
      )
    : [EMPTY_SUBSCRIPTION_ALERT_THRESHOLD],
})

/**
 * Units thresholds are truncated to an integer, as the API expects no
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
    value: isUnitsAlertType(alertType)
      ? value.split('.')[0]
      : String(serializeAmount(value, currency)),
  }
}

export const mapFormToCreateInput = (
  { name, code, alertType, billableMetricId, thresholds }: TValidatedSubscriptionAlertForm,
  subscriptionId: string,
  currency: CurrencyEnum,
): CreateSubscriptionAlertInput => ({
  name,
  code,
  alertType,
  subscriptionId,
  billableMetricId: billableMetricId || undefined,
  thresholds: thresholds.map((threshold) =>
    mapThresholdToInput({ threshold, alertType, currency }),
  ),
})

/**
 * The API rejects `alertType` and `subscriptionId` on update: both are
 * immutable. `billableMetricId` is still part of the input — it is disabled on
 * edition, so it carries the unchanged value (or is omitted when empty).
 */
export const mapFormToUpdateInput = (
  { name, code, alertType, billableMetricId, thresholds }: TValidatedSubscriptionAlertForm,
  id: string,
  currency: CurrencyEnum,
): UpdateSubscriptionAlertInput => ({
  id,
  name,
  code,
  billableMetricId: billableMetricId || undefined,
  thresholds: thresholds.map((threshold) =>
    mapThresholdToInput({ threshold, alertType, currency }),
  ),
})
