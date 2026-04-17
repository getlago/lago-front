import { Settings } from 'luxon'

import { BillingTimeEnum } from '~/generated/graphql'
import { ActivationRuleFormEnum } from '~/pages/subscriptions/types'

import { subscriptionFormSchema, SubscriptionFormValues } from '../subscriptionFormSchema'

const originalDefaultZone = Settings.defaultZone

const buildValidValues = (
  overrides: Partial<SubscriptionFormValues> = {},
): SubscriptionFormValues => ({
  planId: 'plan-1',
  name: 'Test Subscription',
  externalId: 'ext-1',
  subscriptionAt: '2026-01-01T00:00:00.000Z',
  endingAt: undefined,
  billingTime: BillingTimeEnum.Calendar,
  paymentMethod: undefined,
  invoiceCustomSection: undefined,
  activationRuleType: ActivationRuleFormEnum.Immediately,
  activationRuleTimeoutHours: undefined,
  ...overrides,
})

describe('subscriptionFormSchema', () => {
  beforeAll(() => {
    Settings.defaultZone = 'UTC'
    Settings.now = () => new Date('2026-04-10T12:00:00.000Z').valueOf()
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
    Settings.now = () => Date.now()
  })

  describe('GIVEN a fully valid subscription form', () => {
    describe('WHEN all required fields are present', () => {
      it('THEN should pass validation with no errors', () => {
        const result = subscriptionFormSchema.safeParse(buildValidValues())

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN planId validation', () => {
    describe('WHEN planId is empty', () => {
      it('THEN should fail with an error on planId', () => {
        const result = subscriptionFormSchema.safeParse(buildValidValues({ planId: '' }))

        expect(result.success).toBe(false)

        if (!result.success) {
          const planIdError = result.error.issues.find((i) => i.path.includes('planId'))

          expect(planIdError).toBeDefined()
        }
      })
    })

    describe('WHEN planId is provided', () => {
      it('THEN should not have a planId error', () => {
        const result = subscriptionFormSchema.safeParse(buildValidValues({ planId: 'plan-123' }))

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN subscriptionAt validation', () => {
    describe('WHEN subscriptionAt is empty', () => {
      it('THEN should fail with an error on subscriptionAt', () => {
        const result = subscriptionFormSchema.safeParse(buildValidValues({ subscriptionAt: '' }))

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) => i.path.includes('subscriptionAt'))

          expect(error).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN endingAt validation', () => {
    describe('WHEN endingAt is undefined', () => {
      it('THEN should pass validation (endingAt is optional)', () => {
        const result = subscriptionFormSchema.safeParse(buildValidValues({ endingAt: undefined }))

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN endingAt is an invalid ISO date', () => {
      it('THEN should fail with an error on endingAt', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({ endingAt: 'not-a-date' }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) => i.path.includes('endingAt'))

          expect(error).toBeDefined()
        }
      })
    })

    describe('WHEN endingAt is before subscriptionAt', () => {
      it('THEN should fail with an error on endingAt', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            subscriptionAt: '2026-06-01T00:00:00.000Z',
            endingAt: '2026-05-01T00:00:00.000Z',
          }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) => i.path.includes('endingAt'))

          expect(error).toBeDefined()
        }
      })
    })

    describe('WHEN endingAt is equal to subscriptionAt', () => {
      it('THEN should fail with an error on endingAt', () => {
        const sameDate = '2026-06-01T00:00:00.000Z'
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            subscriptionAt: sameDate,
            endingAt: sameDate,
          }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) => i.path.includes('endingAt'))

          expect(error).toBeDefined()
        }
      })
    })

    describe('WHEN endingAt is in the past', () => {
      it('THEN should fail with an error on endingAt', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            subscriptionAt: '2025-01-01T00:00:00.000Z',
            endingAt: '2025-06-01T00:00:00.000Z',
          }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) => i.path.includes('endingAt'))

          expect(error).toBeDefined()
        }
      })
    })

    describe('WHEN endingAt is valid and in the future after subscriptionAt', () => {
      it('THEN should pass validation', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            subscriptionAt: '2026-06-01T00:00:00.000Z',
            endingAt: '2027-01-01T00:00:00.000Z',
          }),
        )

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN multiple validation errors', () => {
    describe('WHEN both planId and subscriptionAt are missing', () => {
      it('THEN should report errors on both fields', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({ planId: '', subscriptionAt: '' }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const planIdError = result.error.issues.find((i) => i.path.includes('planId'))
          const subscriptionAtError = result.error.issues.find((i) =>
            i.path.includes('subscriptionAt'),
          )

          expect(planIdError).toBeDefined()
          expect(subscriptionAtError).toBeDefined()
        }
      })
    })
  })
})
