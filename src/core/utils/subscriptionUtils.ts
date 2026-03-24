import { DateTime } from 'luxon'

import {
  ActivationRuleStatusEnum,
  ActivationRuleTypeEnum,
  StatusTypeEnum,
} from '~/generated/graphql'

type TranslateFn = (key: string, data?: Record<string, string | number>) => string

type ActivationRuleLike = {
  type: ActivationRuleTypeEnum
  status?: ActivationRuleStatusEnum | null
  expiresAt?: string | null
  timeoutHours?: number | null
}

type SubscriptionLike = {
  status?: StatusTypeEnum | null
  cancellationReason?: string | null
  activationRules?: ActivationRuleLike[] | null
}

/**
 * Finds the payment-gated activation rule from the subscription's activation rules, if any.
 */
export const getPaymentActivationRule = (
  subscription: SubscriptionLike | null | undefined,
): ActivationRuleLike | undefined => {
  return subscription?.activationRules?.find((rule) => rule.type === ActivationRuleTypeEnum.Payment)
}

/**
 * Whether the subscription was canceled due to a payment-gated reason (payment_failed or timeout).
 */
export const isCanceledWithPaymentReason = (
  subscription: SubscriptionLike | null | undefined,
): boolean => {
  return subscription?.status === StatusTypeEnum.Canceled && !!subscription?.cancellationReason
}

/**
 * Whether the timeout field should be displayed in the subscription detail view.
 * Shown only for incomplete subscriptions or canceled subscriptions with a cancellation reason.
 */
export const shouldShowTimeoutField = (
  subscription: SubscriptionLike | null | undefined,
): boolean => {
  if (!getPaymentActivationRule(subscription)) return false

  return (
    subscription?.status === StatusTypeEnum.Incomplete || isCanceledWithPaymentReason(subscription)
  )
}

/**
 * Formats a human-readable countdown string from an activation rule's `expiresAt` timestamp.
 * Returns "No timeout defined" if no expiry, "Expired" if past, or "In X hours" / "In less than 1 hour".
 */
export const formatTimeoutCountdown = (
  expiresAt: string | null | undefined,
  translate: TranslateFn,
): string => {
  if (!expiresAt) {
    return translate('text_17743520804347dc97damzag')
  }

  const diff = DateTime.fromISO(expiresAt).diff(DateTime.now(), 'hours')

  if (diff.hours <= 0) {
    return translate('text_1774352110215n8rzudylrf3')
  }

  if (diff.hours < 1) {
    return translate('text_1774352080434o5cfv45lvgz')
  }

  return translate('text_17743520804348kmg5y4ur98', {
    hours: Math.round(diff.hours),
  })
}

/**
 * Resolves the timeout display value for the subscription detail page.
 * Returns "Expired" for failed/canceled subscriptions, otherwise formats the countdown.
 */
export const getTimeoutDisplayValue = (
  subscription: SubscriptionLike | null | undefined,
  translate: TranslateFn,
): string => {
  const paymentActivationRule = getPaymentActivationRule(subscription)

  if (
    paymentActivationRule?.status === ActivationRuleStatusEnum.Failed ||
    subscription?.status === StatusTypeEnum.Canceled
  ) {
    return translate('text_1774352110215n8rzudylrf3')
  }

  return formatTimeoutCountdown(paymentActivationRule?.expiresAt, translate)
}

/**
 * Returns the formatted end date or terminated date for a subscription,
 * depending on its status. Falls back to '-' when neither is available.
 */
export const formatSubscriptionEndDate = (
  subscription:
    | {
        status?: StatusTypeEnum | null
        terminatedAt?: string | null
        endingAt?: string | null
      }
    | null
    | undefined,
): string => {
  if (subscription?.status === StatusTypeEnum.Terminated && subscription?.terminatedAt) {
    return DateTime.fromISO(subscription.terminatedAt).toFormat('LLL. dd, yyyy')
  }

  if (subscription?.endingAt) {
    return DateTime.fromISO(subscription.endingAt).toFormat('LLL. dd, yyyy')
  }

  return '-'
}
