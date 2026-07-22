import { DateTime } from 'luxon'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { getTimezoneConfig } from '~/core/timezone'
import { Locale } from '~/core/translations'
import {
  CreateRecurringTransactionRuleInput,
  CurrencyEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  TimezoneEnum,
  UpdateRecurringTransactionRuleInput,
  WalletTransactionSourceEnum,
  WalletTransactionTransactionStatusEnum,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { TWalletDataForm } from '~/pages/wallet'

type TGetWordingForWalletAlert = {
  currency: CurrencyEnum
  recurringRulesValues?: CreateRecurringTransactionRuleInput[][0] &
    UpdateRecurringTransactionRuleInput[][0]
  translate: ReturnType<typeof useInternationalization>['translate']
  customerTimezone?: TimezoneEnum | null
  // Fallback recurrence anchor when a rule has no explicit `startedAt`: the
  // backend anchors interval rules to the wallet's `createdAt`, so the preview
  // must mirror that instead of drifting to today on every reopen.
  walletCreatedAt?: string | null
}

type GetWordingForWalletCreationAlert = TGetWordingForWalletAlert & {
  walletValues: TWalletDataForm
}

export const toNumber = (value: unknown, defaultValue: number = 0) => {
  const number = Number(value ?? defaultValue)

  return isNaN(number) ? defaultValue : number
}

export const getDateRef = (
  timezone?: TGetWordingForWalletAlert['customerTimezone'],
  locale: Locale = 'en',
) => {
  const GMT = getTimezoneConfig(TimezoneEnum.TzUtc).name
  const gmtDateRef = DateTime.now().setZone(GMT).toISO() || ''
  const customerZone = getTimezoneConfig(timezone).name
  const dateRefForDisplay = DateTime.fromISO(gmtDateRef).setZone(customerZone).startOf('day')

  return dateRefForDisplay.setLocale(locale)
}

// Resolve the recurrence anchor shown in the preview: the rule's explicit
// `startedAt` when set, otherwise the wallet's `createdAt` (the backend's own
// fallback for interval rules). Returns undefined only during creation, when
// neither exists yet — the downstream helpers then default to today, which is
// correct for a wallet that does not exist server-side yet.
const getRecurrenceAnchor = ({
  startedAt,
  walletCreatedAt,
}: {
  startedAt?: string | null
  walletCreatedAt?: string | null
}): DateTime | undefined => {
  if (startedAt) return DateTime.fromISO(startedAt)
  if (walletCreatedAt) return DateTime.fromISO(walletCreatedAt)

  return undefined
}

export const getRecurringStartDate = ({
  timezone,
  date,
}: {
  timezone: TGetWordingForWalletAlert['customerTimezone']
  date?: DateTime
}): string => {
  // If no date is provided, return today's date
  if (!date) {
    date = DateTime.now()
  }

  const dateRef = getDateRef(timezone).set({
    day: date.day,
    month: date.month,
    year: date.year,
  })

  return dateRef.toLocaleString(DateTime.DATE_FULL)
}

const setStartOfSentence = ({
  recurringRulesValues,
  walletValues,
  translate,
  customerTimezone,
  walletCreatedAt,
}: GetWordingForWalletCreationAlert) => {
  let text = ''

  if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Threshold) {
    text = translate('text_6657be42151661006d2f3b6d', {
      thresholdCredits: recurringRulesValues?.thresholdCredits,
    })
  } else {
    const rrule = walletValues.recurringTransactionRules?.[0]

    const totalCreditCount = toNumber(rrule?.paidCredits) + toNumber(rrule?.grantedCredits)
    const recurringStartDate = getRecurringStartDate({
      timezone: customerTimezone,
      date: getRecurrenceAnchor({ startedAt: rrule?.startedAt, walletCreatedAt }),
    })

    if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Fixed) {
      text = translate('text_6657be42151661006d2f3b6f', {
        totalCreditCount,
        recurringStartDate,
      })
    } else if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Target) {
      text = translate('text_6657be42151661006d2f3b71', {
        totalCreditCount,
        recurringStartDate,
      })
    }
  }

  return text
}

const MINIMUM_DAYS_IN_MONTH = 28

const getIntervalEndOfSentence = ({
  interval,
  isDayPotentiallyNotReachableOnEntirePeriod,
  dateRef,
  translate,
}: {
  interval?: RecurringTransactionIntervalEnum | null
  isDayPotentiallyNotReachableOnEntirePeriod: boolean
  dateRef: DateTime
  translate: TranslateFunc
}): string => {
  switch (interval) {
    case RecurringTransactionIntervalEnum.Weekly:
      return translate('text_6657be42151661006d2f3b79', { dayOfWeek: dateRef.weekdayLong })
    case RecurringTransactionIntervalEnum.Monthly:
      return isDayPotentiallyNotReachableOnEntirePeriod
        ? translate('text_6657be42151661006d2f3b7d')
        : translate('text_6657be42151661006d2f3b7b')
    case RecurringTransactionIntervalEnum.Quarterly:
      return isDayPotentiallyNotReachableOnEntirePeriod
        ? translate('text_6657be42151661006d2f3b81')
        : translate('text_6657be42151661006d2f3b7f')
    case RecurringTransactionIntervalEnum.Semiannual:
      return isDayPotentiallyNotReachableOnEntirePeriod
        ? translate('text_1756374810493e2wep7ld6yk')
        : translate('text_1756374359049ylvettsjq4l')
    case RecurringTransactionIntervalEnum.Yearly:
      return isDayPotentiallyNotReachableOnEntirePeriod
        ? translate('text_6657be42151661006d2f3b85', { month: dateRef.monthLong })
        : translate('text_6657be42151661006d2f3b83')
    default:
      return ''
  }
}

const setEndOfSentence = ({
  recurringRulesValues,
  customerTimezone,
  walletValues,
  translate,
  walletCreatedAt,
}: Pick<
  GetWordingForWalletCreationAlert,
  'recurringRulesValues' | 'customerTimezone' | 'walletValues' | 'translate' | 'walletCreatedAt'
>) => {
  let text = ''

  if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Interval) {
    const rrule = walletValues.recurringTransactionRules?.[0]
    const startedAt = getRecurrenceAnchor({ startedAt: rrule?.startedAt, walletCreatedAt })

    const dateRef = getDateRef(customerTimezone).set({
      day: startedAt?.day,
      month: startedAt?.month,
      year: startedAt?.year,
    })
    const isDayPotentiallyNotReachableOnEntirePeriod = dateRef.day > MINIMUM_DAYS_IN_MONTH

    text = getIntervalEndOfSentence({
      interval: recurringRulesValues?.interval,
      isDayPotentiallyNotReachableOnEntirePeriod,
      dateRef,
      translate,
    })
  } else if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Threshold) {
    if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Fixed) {
      const totalCreditCount =
        toNumber(walletValues.recurringTransactionRules?.[0].paidCredits) +
        toNumber(walletValues.recurringTransactionRules?.[0].grantedCredits)

      text = translate('text_6657be42151661006d2f3b75', { totalCreditCount })
    } else if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Target) {
      text = translate('text_6657be42151661006d2f3b77')
    }
  }

  return text
}

export const getWordingForWalletCreationAlert = ({
  currency,
  customerTimezone,
  recurringRulesValues,
  walletValues,
  translate,
  walletCreatedAt,
}: GetWordingForWalletCreationAlert): string => {
  if (!recurringRulesValues) {
    const text = translate('text_6560809c38fb9de88d8a537a', {
      totalCreditCount:
        toNumber(walletValues?.paidCredits) + toNumber(walletValues?.grantedCredits),
    })

    return text
  }

  const startSentence = setStartOfSentence({
    recurringRulesValues,
    walletValues,
    currency,
    customerTimezone,
    translate,
    walletCreatedAt,
  })

  const endSentence = setEndOfSentence({
    recurringRulesValues,
    walletValues,
    customerTimezone,
    translate,
    walletCreatedAt,
  })

  return `${startSentence} ${endSentence}`
}

type GetLabelForInboundTransactionProps = {
  translate: TranslateFunc
  source: WalletTransactionSourceEnum
  creditAmount: string
  transactionStatus: WalletTransactionTransactionStatusEnum
}

export const getLabelForInboundTransaction = ({
  translate,
  source,
  creditAmount,
  transactionStatus,
}: GetLabelForInboundTransactionProps) => {
  if (transactionStatus === WalletTransactionTransactionStatusEnum.Granted) {
    return translate('text_662fc05d2cfe3a0596b29db0', undefined, Number(creditAmount) || 0)
  }

  // For purchased credits, check the source
  if (transactionStatus === WalletTransactionTransactionStatusEnum.Purchased) {
    if (source === WalletTransactionSourceEnum.Manual) {
      return translate('text_194a7e73e00a1b2c3d4e5f67', undefined, Number(creditAmount) || 0)
    }
    if (
      source === WalletTransactionSourceEnum.Interval ||
      source === WalletTransactionSourceEnum.Threshold
    ) {
      return translate('text_194a7e73e00b8c9d0e1f2a34', undefined, Number(creditAmount) || 0)
    }
  }

  // Fallback to the original purchased text for other cases
  return translate('text_62da6ec24a8e24e44f81289a', undefined, Number(creditAmount) || 0)
}

type GetLabelForOutboundTransactionProps = {
  translate: TranslateFunc
  creditAmount: string
  transactionStatus: WalletTransactionTransactionStatusEnum
}

export const getLabelForOutboundTransaction = ({
  translate,
  creditAmount,
  transactionStatus,
}: GetLabelForOutboundTransactionProps) => {
  return transactionStatus === WalletTransactionTransactionStatusEnum.Voided
    ? translate('text_662fc05d2cfe3a0596b29d98', undefined, Number(creditAmount) || 0)
    : translate('text_62da6ec24a8e24e44f812892', undefined, Number(creditAmount) || 0)
}

export const formatCredits = ({
  credits,
  isBlurry,
}: {
  credits?: string | null
  isBlurry?: boolean
}) =>
  intlFormatNumber(Number(isBlurry ? 0 : credits) || 0, {
    maximumFractionDigits: 15,
    style: 'decimal',
  })

export const formatAmount = ({
  amountCents,
  currency = CurrencyEnum.Usd,
  isBlurry,
}: {
  amountCents?: string | null
  currency?: CurrencyEnum
  isBlurry?: boolean
}) =>
  intlFormatNumber(Number(isBlurry ? 0 : amountCents) || 0, {
    currencyDisplay: 'symbol',
    maximumFractionDigits: 15,
    currency,
  })
