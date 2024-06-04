import { DateTime, Settings } from 'luxon'

import {
  getDateRef,
  getNextRecurringDate,
  getWordingForWalletCreationAlert,
  toNumber,
} from '~/components/wallets/utils'
import {
  CurrencyEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { TWalletDataForm } from '~/pages/WalletForm/types'

describe('Wallet Utils', () => {
  describe('toNumber', () => {
    it('should return 0 when the value is undefined', () => {
      expect(toNumber(undefined)).toBe(0)
    })

    it('should return 0 when the value is null', () => {
      expect(toNumber(null)).toBe(0)
    })

    it('should return 0 when the value is an empty string', () => {
      expect(toNumber('')).toBe(0)
    })

    it('should return the number when the value is a number', () => {
      expect(toNumber(123)).toBe(123)
    })

    it('should return the number when the value is a string number', () => {
      expect(toNumber('123')).toBe(123)
    })

    it('should return 0 when the value is a string number with letters', () => {
      expect(toNumber('123abc')).toBe(0)
    })

    it('should return 0 when the value is a string', () => {
      expect(toNumber('abc')).toBe(0)
    })
  })

  describe('getDateRef', () => {
    it('should return the date reference for the customer timezone with english by default', () => {
      expect(getDateRef().set({ year: 2024, month: 5, day: 28 }).weekdayLong).toBe('Tuesday')
    })

    it('should return the date reference for the customer timezone in French', () => {
      expect(
        getDateRef(TimezoneEnum.TzEuropeParis, 'fr').set({
          year: 2024,
          month: 5,
          day: 28,
        }).weekdayLong,
      ).toBe('mardi')
    })
  })

  describe('getNextRecurringDate', () => {
    beforeEach(() => {
      const expectedNow = DateTime.local(2024, 5, 5)

      Settings.now = () => expectedNow.toMillis()
    })

    it('Weekly - should return May 12nd when current date is May 5th', () => {
      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Weekly,
        }),
      ).toBe('May 12, 2024')
    })

    it('Weekly - should return June 4th when current date is May 28th', () => {
      const expectedNow = DateTime.local(2024, 5, 28)

      Settings.now = () => expectedNow.toMillis()

      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Weekly,
        }),
      ).toBe('June 4, 2024')
    })

    it('Monthly - should return June 5th when current date is May 5th', () => {
      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Monthly,
        }),
      ).toBe('June 5, 2024')
    })

    it('Monthly - should return Feb 29th when current date is January 31st', () => {
      const expectedNow = DateTime.local(2024, 1, 31)

      Settings.now = () => expectedNow.toMillis()
      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Monthly,
        }),
      ).toBe('February 29, 2024')
    })

    it('Quarterly - should return Aug 5th when current date is May 5th', () => {
      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Quarterly,
        }),
      ).toBe('August 5, 2024')
    })

    it('Yearly - should return May 5, 2025 when current date is May 5, 2024', () => {
      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Yearly,
        }),
      ).toBe('May 5, 2025')
    })

    it('Yearly - should return Feb 28, 2025 when current date is Feb 29, 2024', () => {
      const expectedNow = DateTime.local(2024, 2, 29)

      Settings.now = () => expectedNow.toMillis()

      expect(
        getNextRecurringDate({
          timezone: TimezoneEnum.TzEuropeParis,
          interval: RecurringTransactionIntervalEnum.Yearly,
        }),
      ).toBe('February 28, 2025')
    })
  })

  describe('getWordingForWalletCreationAlert', () => {
    const walletValuesFixture: TWalletDataForm = {
      name: 'Wallet Name',
      currency: CurrencyEnum.Usd,
      grantedCredits: '200',
      paidCredits: '100',
      rateAmount: '1',
      recurringTransactionRules: [
        {
          trigger: RecurringTransactionTriggerEnum.Threshold,
          thresholdCredits: '100',
          method: RecurringTransactionMethodEnum.Fixed,
          interval: RecurringTransactionIntervalEnum.Monthly,
          grantedCredits: '10',
          paidCredits: '50',
          lagoId: 'fakeId',
          targetOngoingBalance: '100',
        },
      ],
    }

    const options = {
      walletValues: walletValuesFixture,
      currency: CurrencyEnum.Usd,
      customerTimezone: TimezoneEnum.TzEuropeParis,
      translate: (key: string) => key,
    }

    describe('Interval Trigger And Reachable day', () => {
      beforeAll(() => {
        const expectedNow = DateTime.local(2024, 5, 5)

        Settings.now = () => expectedNow.toMillis()
      })

      it('if the method is fixed + weekly interval : "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}}, and will recur every {{dayOfWeek}}"', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Weekly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b79'}`,
        )
      })

      it('if the method is fixed + monthly interval : "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}} and will recur every month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Monthly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b7b'}`,
        )
      })

      it('if the method is fixed + quarter interval : "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}} and will recur every 15th on a quarterly basis."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Quarterly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b7f'}`,
        )
      })

      it('if the method is fixed + yearly interval : "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}} and will recur every year."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Yearly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b83'}`,
        )
      })

      it('if the method is target + weekly interval : "A top-up of credits is set to match the target balance on {{nextRecurringTopUpDate}}, and will recur every {{dayOfWeek}} of the week."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Weekly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b79'}`,
        )
      })

      it('if the method is target + monthly interval : "A top-up of credits is set to match the target balance on {{nextRecurringTopUpDate}} and will recur every month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Monthly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b7b'}`,
        )
      })

      it('if the method is target + quarter interval : "A top-up of credits is set to match the target balance on  {{nextRecurringTopUpDate}} and will occur every 15th on a quarterly basis."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Quarterly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b7f'}`,
        )
      })

      it('if the method is target + yearly interval : "A top-up of credits is set to match the target balance on {{nextRecurringTopUpDate}} and will recur every month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Yearly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b83'}`,
        )
      })
    })

    describe('Interval Trigger And Unreachable day', () => {
      beforeAll(() => {
        const expectedNow = DateTime.local(2024, 5, 30)

        Settings.now = () => expectedNow.toMillis()
      })

      it('if the method is fixed + monthly interval and next occurrence is unreachable: "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}} and will recur every month, if applicable; otherwise, it will occur at the end of the month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Monthly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b7d'}`,
        )
      })

      it('if the method is fixed + quarter interval and next occurrence is unreachable: "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}} and will recur every 31st on a quarterly basis if applicable; otherwise, it will occur at the end of the month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Quarterly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b81'}`,
        )
      })

      it('if the method is fixed + yearly interval and next occurrence is unreachable: "A top-up of {{totalCreditCount}} credits is set for {{nextRecurringTopUpDate}} and will recur every year, if applicable; otherwise, it will occur at the end of {{month}} on a yearly basis."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            interval: RecurringTransactionIntervalEnum.Yearly,
            method: RecurringTransactionMethodEnum.Fixed,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b6f'} ${'text_6657be42151661006d2f3b85'}`,
        )
      })

      it('if the method is target + monthly interval and next occurrence is unreachable: "A top-up of credits is set to match the target balance on  {{nextRecurringTopUpDate}} and will recur every month, if applicable; otherwise, it will occur at the end of the month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Monthly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b7d'}`,
        )
      })

      it('if the method is target + quarter interval and next occurrence is unreachable: "A top-up of credits is set to match the target balance on  {{nextRecurringTopUpDate}} and will occur every 31st on a quarterly basis if applicable; otherwise, it will occur at the end of the month."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Quarterly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b81'}`,
        )
      })

      it('if the method is target + yearly interval and next occurrence is unreachable: "A top-up of credits is set to match the target balance on  {{nextRecurringTopUpDate}} and will recur every year, if applicable; otherwise, it will occur at the end of {{month}} on a yearly basis."', () => {
        const alertContent = getWordingForWalletCreationAlert({
          ...options,
          recurringRulesValues: {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Yearly,
          },
        })

        expect(alertContent).toBe(
          `${'text_6657be42151661006d2f3b71'} ${'text_6657be42151661006d2f3b85'}`,
        )
      })
    })

    it('if there are no recurring rules defined : "You are topping up a total of {{totalCreditCount}} credits."', () => {
      const alertContent = getWordingForWalletCreationAlert({
        ...options,
        recurringRulesValues: undefined,
      })

      expect(alertContent).toBe('text_6560809c38fb9de88d8a537a')
    })

    it('if the method is fixed + threshold trigger : "Each time your wallet ongoing balance falls to or below {{thresholdCredits}} credits, a top-up of {{totalCreditCount}} credits will occur."', () => {
      const alertContent = getWordingForWalletCreationAlert({
        ...options,
        recurringRulesValues: {
          trigger: RecurringTransactionTriggerEnum.Threshold,
          thresholdCredits: '100',
          method: RecurringTransactionMethodEnum.Fixed,
        },
      })

      expect(alertContent).toBe(
        `${'text_6657be42151661006d2f3b6d'} ${'text_6657be42151661006d2f3b75'}`,
      )
    })

    it('if the method is target + threshold : "Each time your wallet ongoing balance falls to or below {{thresholdCredits}} credits, a top-up of credits will occur to match the target balance."', () => {
      const alertContent = getWordingForWalletCreationAlert({
        ...options,
        recurringRulesValues: {
          trigger: RecurringTransactionTriggerEnum.Threshold,
          method: RecurringTransactionMethodEnum.Target,
        },
      })

      expect(alertContent).toBe(
        `${'text_6657be42151661006d2f3b6d'} ${'text_6657be42151661006d2f3b77'}`,
      )
    })
  })
})
