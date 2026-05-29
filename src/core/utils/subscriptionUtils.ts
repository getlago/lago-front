import { DateTime } from 'luxon'

import {
  ActivationRuleStatusEnum,
  ActivationRuleTypeEnum,
  CancelationReasonEnum,
  Maybe,
  StatusTypeEnum,
  SubscriptionActivationRule,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

type SubscriptionWithActivationRules = {
  activationRules?: Maybe<
    Array<Pick<SubscriptionActivationRule, 'type' | 'timeoutHours' | 'status' | 'expiresAt'>>
  >
  cancelationReason?: Maybe<CancelationReasonEnum>
  endingAt?: Maybe<string>
  status?: Maybe<StatusTypeEnum>
  terminatedAt?: Maybe<string>
}

export const getPaymentActivationRule = (subscription?: Maybe<SubscriptionWithActivationRules>) => {
  return subscription?.activationRules?.find(
    (activationRule) => activationRule.type === ActivationRuleTypeEnum.Payment,
  )
}

export const isCanceledWithPaymentReason = (
  subscription?: Maybe<SubscriptionWithActivationRules>,
) => {
  return (
    subscription?.status === StatusTypeEnum.Canceled &&
    (subscription.cancelationReason === CancelationReasonEnum.PaymentFailed ||
      subscription.cancelationReason === CancelationReasonEnum.Timeout)
  )
}

export const isPaymentActivationExpired = (
  subscription?: Maybe<SubscriptionWithActivationRules>,
) => {
  return (
    subscription?.cancelationReason === CancelationReasonEnum.Timeout ||
    getPaymentActivationRule(subscription)?.status === ActivationRuleStatusEnum.Expired
  )
}

export const formatSubscriptionEndDate = (
  subscription?: Maybe<
    Pick<SubscriptionWithActivationRules, 'endingAt' | 'status' | 'terminatedAt'>
  >,
) => {
  if (subscription?.status === StatusTypeEnum.Terminated && subscription.terminatedAt) {
    return DateTime.fromISO(subscription.terminatedAt).toFormat('LLL. dd, yyyy')
  }

  if (subscription?.endingAt) {
    return DateTime.fromISO(subscription.endingAt).toFormat('LLL. dd, yyyy')
  }

  return '-'
}

export const shouldShowTimeoutField = (subscription?: Maybe<SubscriptionWithActivationRules>) => {
  return !!getPaymentActivationRule(subscription)
}

export const getTimeoutDisplayValue = (
  subscription: Maybe<SubscriptionWithActivationRules> | undefined,
  translate: TranslateFunc,
) => {
  const paymentActivationRule = getPaymentActivationRule(subscription)

  if (!paymentActivationRule) return '-'

  if (paymentActivationRule.timeoutHours === 0) {
    return translate('text_17798820214660s59bjuztra')
  }

  if (isPaymentActivationExpired(subscription)) {
    return translate('text_1779882021466x423uayjorq')
  }

  if (!paymentActivationRule.expiresAt) {
    return translate('text_17798820214660s59bjuztra')
  }

  const expiresAt = DateTime.fromISO(paymentActivationRule.expiresAt)

  if (!expiresAt.isValid || expiresAt <= DateTime.now()) {
    return translate('text_1779882021466x423uayjorq')
  }

  const hoursUntilExpiration = Math.ceil(expiresAt.diffNow('hours').hours)

  if (hoursUntilExpiration < 1) {
    return translate('text_1779882021466f56z1ymyt09')
  }

  return translate('text_1779882021466cfug4osir5m', {
    hours: hoursUntilExpiration,
  })
}
