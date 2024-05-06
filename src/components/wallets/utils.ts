import { DateTime } from 'luxon'

import { intlFormatNumber, intlFormatOrdinalNumber } from '~/core/formats/intlFormatNumber'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CreateRecurringTransactionRuleInput,
  CurrencyEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionRuleTypeEnum,
  TimezoneEnum,
  UpdateRecurringTransactionRuleInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TWalletDataForm } from '~/pages/WalletForm'

type TGetWordingForWalletAlert = {
  currency: CurrencyEnum
  rulesValues?: CreateRecurringTransactionRuleInput[][0] & UpdateRecurringTransactionRuleInput[][0]
  translate: ReturnType<typeof useInternationalization>['translate']
  customerTimezone?: TimezoneEnum | null
}

export const getWordingForWalletCreationAlert = ({
  currency,
  customerTimezone,
  rulesValues,
  walletValues,
  translate,
}: TGetWordingForWalletAlert & {
  walletValues: TWalletDataForm
}): string => {
  let text =
    translate('text_6560809c38fb9de88d8a537a', {
      totalCreditCount:
        Number(walletValues?.paidCredits || 0) + Number(walletValues?.grantedCredits || 0),
    }) + '\n'

  if (
    rulesValues?.ruleType === RecurringTransactionRuleTypeEnum.Threshold &&
    !!rulesValues?.thresholdCredits
  ) {
    text += translate('text_6560809c38fb9de88d8a5386', {
      thresholdCredits: intlFormatNumber(Number(rulesValues?.thresholdCredits), {
        currencyDisplay: 'symbol',
        currency,
      }),
    })
  } else if (rulesValues?.ruleType === RecurringTransactionRuleTypeEnum.Interval) {
    const GMT = getTimezoneConfig(TimezoneEnum.TzUtc).name
    const gmtDateRef = DateTime.now().setZone(GMT).toISO() || ''
    const customerZone = getTimezoneConfig(customerTimezone).name
    const dateRefForDisplay = DateTime.fromISO(gmtDateRef).setZone(customerZone).startOf('day')
    const isDayPotentiallyNotReachableOnAllPeriods = dateRefForDisplay.day > 28

    if (rulesValues?.interval === RecurringTransactionIntervalEnum.Weekly) {
      const daysOfTheWeek = dateRefForDisplay.plus({ days: 7 }).weekdayLong

      text += translate('text_6560809c38fb9de88d8a536c', {
        daysOfTheWeek,
      })
    } else if (rulesValues?.interval === RecurringTransactionIntervalEnum.Monthly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ months: 1 })

      if (isDayPotentiallyNotReachableOnAllPeriods) {
        text += translate('text_6560809c38fb9de88d8a53d4', {
          nextOccurenceDayNumber: intlFormatOrdinalNumber(nextRecurringTopUpDate.day),
        })
      } else {
        text += translate('text_6560809c38fb9de88d8a539b', {
          nextOccurenceDayNumber: intlFormatOrdinalNumber(nextRecurringTopUpDate.day),
        })
      }
    } else if (rulesValues?.interval === RecurringTransactionIntervalEnum.Quarterly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ months: 3 })

      if (isDayPotentiallyNotReachableOnAllPeriods) {
        text += translate('text_6560809c38fb9de88d8a53c4', {
          dateOfTheMonth: intlFormatOrdinalNumber(nextRecurringTopUpDate.day),
        })
      } else {
        text += translate('text_6560809c38fb9de88d8a5380', {
          dateOfTheMonth: intlFormatOrdinalNumber(nextRecurringTopUpDate.day),
        })
      }
    } else if (rulesValues?.interval === RecurringTransactionIntervalEnum.Yearly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ years: 1 })
      const isFebruary = nextRecurringTopUpDate.month === 2

      if (isDayPotentiallyNotReachableOnAllPeriods && isFebruary) {
        text += translate('text_6560809d38fb9de88d8a542a', {
          dateOfTheMonth: nextRecurringTopUpDate.toFormat('LLL dd'),
        })
      } else {
        text += translate('text_6560809c38fb9de88d8a5414', {
          dateOfTheMonth: nextRecurringTopUpDate.toFormat('LLL dd'),
        })
      }
    }
  }

  return text
}

export const getWordingForWalletEditionAlert = ({
  currency,
  customerTimezone,
  rulesValues,
  translate,
}: TGetWordingForWalletAlert): string => {
  const totalCreditCount =
    Number(rulesValues?.paidCredits || 0) + Number(rulesValues?.grantedCredits || 0)

  if (rulesValues?.ruleType === RecurringTransactionRuleTypeEnum.Threshold) {
    return translate('text_6560809c38fb9de88d8a5406', {
      totalCreditCount,
      thresholdCredits: intlFormatNumber(Number(rulesValues?.thresholdCredits), {
        currencyDisplay: 'symbol',
        currency,
      }),
    })
  } else if (rulesValues?.ruleType === RecurringTransactionRuleTypeEnum.Interval) {
    const GMT = getTimezoneConfig(TimezoneEnum.TzUtc).name
    const gmtDateRef = DateTime.now().setZone(GMT).toISO() || ''
    const customerZone = getTimezoneConfig(customerTimezone).name
    const dateRefForDisplay = DateTime.fromISO(gmtDateRef).setZone(customerZone).startOf('day')

    if (rulesValues?.interval === RecurringTransactionIntervalEnum.Weekly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ days: 7 }).toFormat('LLL dd, yyyy')

      return translate('text_6560809c38fb9de88d8a5370', {
        totalCreditCount,
        nextRecurringTopUpDate,
      })
    } else if (rulesValues?.interval === RecurringTransactionIntervalEnum.Monthly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ months: 1 }).toFormat('LLL dd, yyyy')

      return translate('text_6560809c38fb9de88d8a5360', {
        totalCreditCount,
        nextRecurringTopUpDate,
      })
    } else if (rulesValues?.interval === RecurringTransactionIntervalEnum.Quarterly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ months: 3 }).toFormat('LLL dd, yyyy')

      return translate('text_6560809c38fb9de88d8a535e', {
        totalCreditCount,
        nextRecurringTopUpDate,
      })
    } else if (rulesValues?.interval === RecurringTransactionIntervalEnum.Yearly) {
      const nextRecurringTopUpDate = dateRefForDisplay.plus({ years: 1 }).toFormat('LLL dd, yyyy')

      return translate('text_6560809c38fb9de88d8a5408', {
        totalCreditCount,
        nextRecurringTopUpDate,
      })
    }
  }

  return ''
}
