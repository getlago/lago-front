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
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TWalletDataForm } from '~/pages/WalletForm'

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
}: {
  timezone: TGetWordingForWalletAlert['customerTimezone']
  interval?: RecurringTransactionIntervalEnum | null
}) => {
  let date = null

  switch (interval) {
    case RecurringTransactionIntervalEnum.Weekly:
      date = getDateRef(timezone).plus({ days: 7 }).toLocaleString(DateTime.DATE_FULL)
      break
    case RecurringTransactionIntervalEnum.Monthly:
      date = getDateRef(timezone).plus({ months: 1 }).toLocaleString(DateTime.DATE_FULL)
      break
    case RecurringTransactionIntervalEnum.Quarterly:
      date = getDateRef(timezone).plus({ months: 3 }).toLocaleString(DateTime.DATE_FULL)
      break
    case RecurringTransactionIntervalEnum.Yearly:
      date = getDateRef(timezone).plus({ years: 1 }).toLocaleString(DateTime.DATE_FULL)
      break
    default:
      break
  }

  return date ?? ''
}

const setStartOfSentence = ({
  recurringRulesValues,
  walletValues,
  translate,
  currency,
  customerTimezone,
}: GetWordingForWalletCreationAlert) => {
  let text = ''

  if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Threshold) {
    text = translate('pre_threshold', {
      thresholdCredits: intlFormatNumber(
        toNumber(recurringRulesValues?.thresholdCredits) * toNumber(walletValues.rateAmount),
        {
          currencyDisplay: 'symbol',
          currency,
        },
      ),
    })
  } else {
    const totalCreditCount =
      toNumber(walletValues.recurringTransactionRules?.[0].paidCredits) +
      toNumber(walletValues.recurringTransactionRules?.[0].grantedCredits)
    const nextRecurringTopUpDate = getNextRecurringDate({
      timezone: customerTimezone,
      interval: walletValues.recurringTransactionRules?.[0].interval,
    })

    if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Fixed) {
      text = translate('pre_fixed', { totalCreditCount, nextRecurringTopUpDate })
    } else if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Target) {
      text = translate('pre_target', { totalCreditCount, nextRecurringTopUpDate })
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
    const dateRef = getDateRef(customerTimezone)
    const isDayPotentiallyNotReachableOnEntirePeriod = dateRef.day > MINIMUM_DAYS_IN_MONTH

    switch (recurringRulesValues?.interval) {
      case RecurringTransactionIntervalEnum.Weekly:
        const dayOfWeek = dateRef.weekdayLong

        text = translate('weekly', { dayOfWeek })
        break
      case RecurringTransactionIntervalEnum.Monthly:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('monthly_na')
          : translate('monthly')
        break
      case RecurringTransactionIntervalEnum.Quarterly:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('quarter_na')
          : translate('quarter')
        break
      case RecurringTransactionIntervalEnum.Yearly:
        text = isDayPotentiallyNotReachableOnEntirePeriod
          ? translate('yearly_na')
          : translate('yearly')
        break
      default:
        break
    }
  } else if (recurringRulesValues?.trigger === RecurringTransactionTriggerEnum.Threshold) {
    if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Fixed) {
      const totalCreditCount =
        toNumber(walletValues.recurringTransactionRules?.[0].paidCredits) +
        toNumber(walletValues.recurringTransactionRules?.[0].grantedCredits)

      text = translate('fixed', { totalCreditCount })
    } else if (recurringRulesValues?.method === RecurringTransactionMethodEnum.Target) {
      text = translate('target')
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

  let startSentence = setStartOfSentence({
    recurringRulesValues,
    walletValues,
    currency,
    customerTimezone,
    translate,
  })

  let endSentence = setEndOfSentence({
    recurringRulesValues,
    walletValues,
    customerTimezone,
    translate,
  })

  return `${startSentence} ${endSentence}`
}
