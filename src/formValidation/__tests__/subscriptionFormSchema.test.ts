import { Settings } from 'luxon'

import { UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'
import { ActivationRuleFormTypeEnum } from '~/core/constants/subscriptionActivationRules'
import { BillingTimeEnum } from '~/generated/graphql'

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
  consolidateInvoice: true,
  activationRuleType: ActivationRuleFormTypeEnum.Immediately,
  activationRuleTimeoutHours: '24',
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

    // Regression (ING-634): the picker publishes a typed pre-1970 date now, and nothing
    // else in this schema rejects a start date.
    describe.each([
      ['a year with fewer than four digits', '0026-08-31T00:00:00.000Z'],
      ['the last instant before 1970', '1969-12-31T23:59:59.999Z'],
    ])('WHEN subscriptionAt is %s', (_, subscriptionAt) => {
      it('THEN should fail with an error on subscriptionAt', () => {
        const result = subscriptionFormSchema.safeParse(buildValidValues({ subscriptionAt }))

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) => i.path.includes('subscriptionAt'))

          expect(error).toEqual(
            expect.objectContaining({ message: UNSUPPORTED_DATE_ERROR, path: ['subscriptionAt'] }),
          )
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

    // Regression (ING-634): the picker used to clear the field instead, and an absent
    // endingAt skipped every rule below through `if (!data.endingAt) return`.
    describe('WHEN endingAt is before 1970', () => {
      it('THEN should fail with an unsupported-date error on endingAt', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({ endingAt: '0026-08-31T00:00:00.000Z' }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toEqual([
            expect.objectContaining({ message: UNSUPPORTED_DATE_ERROR, path: ['endingAt'] }),
          ])
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

  describe('GIVEN activation rule validation', () => {
    describe('WHEN payment activation has a zero-hour timeout', () => {
      it('THEN should pass validation', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            activationRuleType: ActivationRuleFormTypeEnum.OnPayment,
            activationRuleTimeoutHours: '0',
          }),
        )

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN payment activation has an empty timeout value', () => {
      it('THEN should pass validation (empty means no timeout, sent as null to the BE)', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            activationRuleType: ActivationRuleFormTypeEnum.OnPayment,
            activationRuleTimeoutHours: '',
          }),
        )

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN payment activation has an undefined timeout value', () => {
      it('THEN should pass validation (no timeout)', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            activationRuleType: ActivationRuleFormTypeEnum.OnPayment,
            activationRuleTimeoutHours: undefined,
          }),
        )

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN payment activation has a negative timeout value', () => {
      it('THEN should fail with an error on activationRuleTimeoutHours', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            activationRuleType: ActivationRuleFormTypeEnum.OnPayment,
            activationRuleTimeoutHours: '-5',
          }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) =>
            i.path.includes('activationRuleTimeoutHours'),
          )

          expect(error).toBeDefined()
        }
      })
    })

    describe('WHEN payment activation has a non-integer timeout value', () => {
      it('THEN should fail with an error on activationRuleTimeoutHours', () => {
        const result = subscriptionFormSchema.safeParse(
          buildValidValues({
            activationRuleType: ActivationRuleFormTypeEnum.OnPayment,
            activationRuleTimeoutHours: '1.5',
          }),
        )

        expect(result.success).toBe(false)

        if (!result.success) {
          const error = result.error.issues.find((i) =>
            i.path.includes('activationRuleTimeoutHours'),
          )

          expect(error).toBeDefined()
        }
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
