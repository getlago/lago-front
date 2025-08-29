import { DateTime } from 'luxon'

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
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TWalletDataForm } from '~/pages/wallet'

type TGetWordingForWalletAlert = {
  currency: CurrencyEnum
  recurringRulesValues?: CreateRecurringTransactionRuleInput[][0] &
    UpdateRecurringTransactionRuleInput[][0]
  translate: ReturnType<typeof useInternationalization>['translate']
  customerTimezone?: TimezoneEnum | null
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

export const getNextRecurringDate = ({
  timezone,
  interval,
  date,
}: {
  timezone: TGetWordingForWalletAlert['customerTimezone']
  interval?: RecurringTransactionIntervalEnum | null
  date?: DateTime
}): string => {
  let nextRecurringDate = null
  const dateRef = getDateRef(timezone).set({
    day: date?.day,
    month: date?.month,
    year: date?.year,
  })

  switch (interval) {
    case RecurringTransactionIntervalEnum.Weekly:
      nextRecurringDate = dateRef.plus({ days: 7 })
      break
    case RecurringTransactionIntervalEnum.Monthly:
      nextRecurringDate = dateRef.plus({ months: 1 })
      break
    case RecurringTransactionIntervalEnum.Quarterly:
      nextRecurringDate = dateRef.plus({ months: 3 })
      break
    case RecurringTransactionIntervalEnum.Semiannual:
      nextRecurringDate = dateRef.plus({ months: 6 })
      break
    case RecurringTransactionIntervalEnum.Yearly:
      nextRecurringDate = dateRef.plus({ years: 1 })
      break
    default:
      break
  }

  return nextRecurringDate?.toLocaleString(DateTime.DATE_FULL) ?? ''
}

const setStartOfSentence = ({
  recurringRulesValues,
  walletValues,
  translate,
  customerTimezone,
}: GetWordingForWalletCreationAlert) => {
  let text = ''

  if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Threshold) {
    text = translate('text_6657be42151661006d2f3b6d', {
      thresholdCredits: recurringRulesValues?.thresholdCredits,
    })
  } else {
    const rrule = walletValues.recurringTransactionRules?.[0]

    const totalCreditCount = toNumber(rrule?.paidCredits) + toNumber(rrule?.grantedCredits)
    const nextRecurringTopUpDate = getNextRecurringDate({
      timezone: customerTimezone,
      interval: rrule?.interval,
      date: rrule?.startedAt ? DateTime.fromISO(rrule?.startedAt) : undefined,
    })

    if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Fixed) {
      text = translate('text_6657be42151661006d2f3b6f', {
        totalCreditCount,
        nextRecurringTopUpDate,
      })
    } else if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Target) {
      text = translate('text_6657be42151661006d2f3b71', {
        totalCreditCount,
        nextRecurringTopUpDate,
      })
    }
  }

  return text
}

const MINIMUM_DAYS_IN_MONTH = 28

const setEndOfSentence = ({
  recurringRulesValues,
  customerTimezone,
  walletValues,
  translate,
}: Pick<
  GetWordingForWalletCreationAlert,
  'recurringRulesValues' | 'customerTimezone' | 'walletValues' | 'translate'
>) => {
  let text = ''

  if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Interval) {
    const rrule = walletValues.recurringTransactionRules?.[0]
    const startedAt = rrule?.startedAt ? DateTime.fromISO(rrule?.startedAt) : undefined

    const dateRef = getDateRef(customerTimezone).set({
      day: startedAt?.day,
      month: startedAt?.month,
      year: startedAt?.year,
    })
    const isDayPotentiallyNotReachableOnEntirePeriod = dateRef.day > MINIMUM_DAYS_IN_MONTH

    switch (recurringRulesValues?.interval) {
      case RecurringTransactionIntervalEnum.Weekly:
        text = translate('text_6657be42151661006d2f3b79', { dayOfWeek: dateRef.weekdayLong })
        break
      case RecurringTransactionIntervalEnum.Monthly:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('text_6657be42151661006d2f3b7d')
          : translate('text_6657be42151661006d2f3b7b')
        break
      case RecurringTransactionIntervalEnum.Quarterly:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('text_6657be42151661006d2f3b81')
          : translate('text_6657be42151661006d2f3b7f')
        break
      case RecurringTransactionIntervalEnum.Semiannual:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('text_1756374810493e2wep7ld6yk')
          : translate('text_1756374359049ylvettsjq4l')
        break
      case RecurringTransactionIntervalEnum.Yearly:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('text_6657be42151661006d2f3b85', { month: dateRef.monthLong })
          : translate('text_6657be42151661006d2f3b83')
        break
      default:
        break
    }
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
  })

  const endSentence = setEndOfSentence({
    recurringRulesValues,
    walletValues,
    customerTimezone,
    translate,
  })

  return `${startSentence} ${endSentence}`
}
