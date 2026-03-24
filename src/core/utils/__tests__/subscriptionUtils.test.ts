import { DateTime, Settings } from 'luxon'

import {
  ActivationRuleStatusEnum,
  ActivationRuleTypeEnum,
  StatusTypeEnum,
} from '~/generated/graphql'

import {
  formatSubscriptionEndDate,
  formatTimeoutCountdown,
  getPaymentActivationRule,
  getTimeoutDisplayValue,
  isCanceledWithPaymentReason,
  shouldShowTimeoutField,
} from '../subscriptionUtils'

const translate = jest.fn((key: string, data?: Record<string, string | number>) => {
  if (data) return `${key}:${JSON.stringify(data)}`

  return key
})

describe('subscriptionUtils', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPaymentActivationRule', () => {
    describe('GIVEN a subscription with activation rules', () => {
      describe('WHEN a payment activation rule exists', () => {
        it('THEN should return the payment activation rule', () => {
          const subscription = {
            status: StatusTypeEnum.Incomplete,
            activationRules: [
              {
                type: ActivationRuleTypeEnum.Payment,
                status: ActivationRuleStatusEnum.Active,
                expiresAt: '2026-04-01T00:00:00Z',
                timeoutHours: 24,
              },
            ],
          }

          const result = getPaymentActivationRule(subscription)

          expect(result).toEqual(expect.objectContaining({ type: ActivationRuleTypeEnum.Payment }))
        })
      })

      describe('WHEN no payment activation rule exists', () => {
        it('THEN should return undefined', () => {
          const subscription = {
            status: StatusTypeEnum.Active,
            activationRules: [],
          }

          expect(getPaymentActivationRule(subscription)).toBeUndefined()
        })
      })
    })

    describe('GIVEN null or undefined subscription', () => {
      it.each([
        ['null', null],
        ['undefined', undefined],
      ])('THEN should return undefined for %s', (_, value) => {
        expect(getPaymentActivationRule(value)).toBeUndefined()
      })
    })
  })

  describe('isCanceledWithPaymentReason', () => {
    describe('GIVEN a canceled subscription with a cancellation reason', () => {
      describe('WHEN checking isCanceledWithPaymentReason', () => {
        it('THEN should return true', () => {
          const subscription = {
            status: StatusTypeEnum.Canceled,
            cancellationReason: 'payment_failed',
          }

          expect(isCanceledWithPaymentReason(subscription)).toBe(true)
        })
      })
    })

    describe('GIVEN a canceled subscription without a cancellation reason', () => {
      describe('WHEN checking isCanceledWithPaymentReason', () => {
        it('THEN should return false', () => {
          const subscription = {
            status: StatusTypeEnum.Canceled,
            cancellationReason: null,
          }

          expect(isCanceledWithPaymentReason(subscription)).toBe(false)
        })
      })
    })

    describe('GIVEN a non-canceled subscription with a cancellation reason', () => {
      describe('WHEN checking isCanceledWithPaymentReason', () => {
        it('THEN should return false', () => {
          const subscription = {
            status: StatusTypeEnum.Active,
            cancellationReason: 'payment_failed',
          }

          expect(isCanceledWithPaymentReason(subscription)).toBe(false)
        })
      })
    })

    describe('GIVEN null or undefined subscription', () => {
      it.each([
        ['null', null],
        ['undefined', undefined],
      ])('THEN should return false for %s', (_, value) => {
        expect(isCanceledWithPaymentReason(value)).toBe(false)
      })
    })
  })

  describe('shouldShowTimeoutField', () => {
    const paymentRule = {
      type: ActivationRuleTypeEnum.Payment,
      status: ActivationRuleStatusEnum.Active,
      expiresAt: '2026-04-01T00:00:00Z',
      timeoutHours: 24,
    }

    describe('GIVEN an incomplete subscription with a payment activation rule', () => {
      describe('WHEN checking shouldShowTimeoutField', () => {
        it('THEN should return true', () => {
          const subscription = {
            status: StatusTypeEnum.Incomplete,
            activationRules: [paymentRule],
          }

          expect(shouldShowTimeoutField(subscription)).toBe(true)
        })
      })
    })

    describe('GIVEN a canceled subscription with cancellation reason and payment rule', () => {
      describe('WHEN checking shouldShowTimeoutField', () => {
        it('THEN should return true', () => {
          const subscription = {
            status: StatusTypeEnum.Canceled,
            cancellationReason: 'payment_failed',
            activationRules: [paymentRule],
          }

          expect(shouldShowTimeoutField(subscription)).toBe(true)
        })
      })
    })

    describe('GIVEN an active subscription with a payment activation rule', () => {
      describe('WHEN checking shouldShowTimeoutField', () => {
        it('THEN should return false', () => {
          const subscription = {
            status: StatusTypeEnum.Active,
            activationRules: [paymentRule],
          }

          expect(shouldShowTimeoutField(subscription)).toBe(false)
        })
      })
    })

    describe('GIVEN a subscription without a payment activation rule', () => {
      describe('WHEN checking shouldShowTimeoutField', () => {
        it('THEN should return false', () => {
          const subscription = {
            status: StatusTypeEnum.Incomplete,
            activationRules: [],
          }

          expect(shouldShowTimeoutField(subscription)).toBe(false)
        })
      })
    })
  })

  describe('formatTimeoutCountdown', () => {
    describe('GIVEN no expiresAt value', () => {
      describe('WHEN formatting the countdown', () => {
        it('THEN should return the no-timeout translation key', () => {
          formatTimeoutCountdown(null, translate)

          expect(translate).toHaveBeenCalledWith('text_17743520804347dc97damzag')
        })
      })
    })

    describe('GIVEN an expiresAt in the past', () => {
      describe('WHEN formatting the countdown', () => {
        it('THEN should return the expired translation key', () => {
          const pastDate = DateTime.now().minus({ hours: 2 }).toISO()

          formatTimeoutCountdown(pastDate, translate)

          expect(translate).toHaveBeenCalledWith('text_1774352110215n8rzudylrf3')
        })
      })
    })

    describe('GIVEN an expiresAt less than 1 hour from now', () => {
      describe('WHEN formatting the countdown', () => {
        it('THEN should return the less-than-1-hour translation key', () => {
          const soonDate = DateTime.now().plus({ minutes: 30 }).toISO()

          formatTimeoutCountdown(soonDate, translate)

          expect(translate).toHaveBeenCalledWith('text_1774352080434o5cfv45lvgz')
        })
      })
    })

    describe('GIVEN an expiresAt more than 1 hour from now', () => {
      describe('WHEN formatting the countdown', () => {
        it('THEN should return the hours countdown with rounded value', () => {
          const futureDate = DateTime.now().plus({ hours: 5 }).toISO()

          formatTimeoutCountdown(futureDate, translate)

          expect(translate).toHaveBeenCalledWith('text_17743520804348kmg5y4ur98', {
            hours: 5,
          })
        })
      })
    })
  })

  describe('getTimeoutDisplayValue', () => {
    const paymentRule = {
      type: ActivationRuleTypeEnum.Payment,
      status: ActivationRuleStatusEnum.Active,
      expiresAt: DateTime.now().plus({ hours: 10 }).toISO() as string,
      timeoutHours: 24,
    }

    describe('GIVEN a subscription with a failed activation rule', () => {
      describe('WHEN getting the timeout display value', () => {
        it('THEN should return the expired translation key', () => {
          const subscription = {
            status: StatusTypeEnum.Incomplete,
            activationRules: [{ ...paymentRule, status: ActivationRuleStatusEnum.Failed }],
          }

          getTimeoutDisplayValue(subscription, translate)

          expect(translate).toHaveBeenCalledWith('text_1774352110215n8rzudylrf3')
        })
      })
    })

    describe('GIVEN a canceled subscription', () => {
      describe('WHEN getting the timeout display value', () => {
        it('THEN should return the expired translation key', () => {
          const subscription = {
            status: StatusTypeEnum.Canceled,
            cancellationReason: 'timeout',
            activationRules: [paymentRule],
          }

          getTimeoutDisplayValue(subscription, translate)

          expect(translate).toHaveBeenCalledWith('text_1774352110215n8rzudylrf3')
        })
      })
    })

    describe('GIVEN an incomplete subscription with active rule', () => {
      describe('WHEN getting the timeout display value', () => {
        it('THEN should format the countdown from expiresAt', () => {
          const subscription = {
            status: StatusTypeEnum.Incomplete,
            activationRules: [paymentRule],
          }

          getTimeoutDisplayValue(subscription, translate)

          expect(translate).toHaveBeenCalledWith('text_17743520804348kmg5y4ur98', {
            hours: 10,
          })
        })
      })
    })
  })

  describe('formatSubscriptionEndDate', () => {
    describe('GIVEN a terminated subscription with terminatedAt', () => {
      describe('WHEN formatting the end date', () => {
        it('THEN should return the formatted terminated date', () => {
          const subscription = {
            status: StatusTypeEnum.Terminated,
            terminatedAt: '2026-01-15T00:00:00Z',
          }

          expect(formatSubscriptionEndDate(subscription)).toBe('Jan. 15, 2026')
        })
      })
    })

    describe('GIVEN a subscription with endingAt', () => {
      describe('WHEN formatting the end date', () => {
        it('THEN should return the formatted ending date', () => {
          const subscription = {
            status: StatusTypeEnum.Active,
            endingAt: '2026-06-30T00:00:00Z',
          }

          expect(formatSubscriptionEndDate(subscription)).toBe('Jun. 30, 2026')
        })
      })
    })

    describe('GIVEN a subscription with no end date', () => {
      describe('WHEN formatting the end date', () => {
        it('THEN should return a dash', () => {
          const subscription = {
            status: StatusTypeEnum.Active,
          }

          expect(formatSubscriptionEndDate(subscription)).toBe('-')
        })
      })
    })

    describe('GIVEN null or undefined subscription', () => {
      it.each([
        ['null', null],
        ['undefined', undefined],
      ])('THEN should return a dash for %s', (_, value) => {
        expect(formatSubscriptionEndDate(value)).toBe('-')
      })
    })
  })
})
