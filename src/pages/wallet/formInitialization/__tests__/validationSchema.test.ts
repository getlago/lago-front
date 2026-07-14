import { dateErrorCodes } from '~/core/constants/form'
import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import {
  CurrencyEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { walletFormErrorCodes } from '~/pages/wallet/form'
import { TWalletDataForm } from '~/pages/wallet/types'

import { walletFormValidationSchema } from '../validationSchema'

const baseForm = (overrides: Partial<TWalletDataForm> = {}): TWalletDataForm => ({
  currency: CurrencyEnum.Usd,
  billingEntityId: undefined,
  expirationAt: undefined,
  grantedCredits: '',
  name: '',
  transactionName: undefined,
  appliesTo: { feeTypes: [], billableMetrics: [] },
  paidCredits: '',
  rateAmount: '1.00',
  recurringTransactionRules: undefined,
  invoiceRequiresSuccessfulPayment: false,
  paidTopUpMinAmountCents: undefined,
  paidTopUpMaxAmountCents: undefined,
  ignorePaidTopUpLimitsOnCreation: false,
  priority: 50,
  paymentMethod: { paymentMethodType: undefined, paymentMethodId: undefined },
  invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
  ...overrides,
})

const baseRule = (
  overrides: Record<string, unknown> = {},
): NonNullable<TWalletDataForm['recurringTransactionRules']>[number] =>
  ({
    trigger: RecurringTransactionTriggerEnum.Interval,
    method: RecurringTransactionMethodEnum.Fixed,
    interval: RecurringTransactionIntervalEnum.Monthly,
    paidCredits: '10',
    grantedCredits: '',
    ignorePaidTopUpLimits: false,
    ...overrides,
  }) as NonNullable<TWalletDataForm['recurringTransactionRules']>[number]

const issuePaths = (result: ReturnType<typeof walletFormValidationSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))

const issueFor = (result: ReturnType<typeof walletFormValidationSchema.safeParse>, path: string) =>
  result.success ? undefined : result.error.issues.find((i) => i.path.join('.') === path)

describe('walletFormValidationSchema', () => {
  describe('top-level fields', () => {
    it('validates a minimal valid wallet form', () => {
      const result = walletFormValidationSchema.safeParse(baseForm())

      expect(result.success).toBe(true)
    })

    it('requires rateAmount', () => {
      const result = walletFormValidationSchema.safeParse(baseForm({ rateAmount: '' }))

      expect(issuePaths(result)).toContain('rateAmount')
    })

    it('rejects a badly formatted expirationAt', () => {
      const result = walletFormValidationSchema.safeParse(baseForm({ expirationAt: 'not-a-date' }))

      expect(issueFor(result, 'expirationAt')?.message).toBe(dateErrorCodes.wrongFormat)
    })

    it('rejects a past expirationAt', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({ expirationAt: '2020-01-01T00:00:00Z' }),
      )

      expect(issueFor(result, 'expirationAt')?.message).toBe(dateErrorCodes.shouldBeInFuture)
    })

    it('accepts a future expirationAt', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({ expirationAt: '2099-01-01T00:00:00Z' }),
      )

      expect(result.success).toBe(true)
    })

    it('fails BOTH min and max when min > max', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({ paidTopUpMinAmountCents: '100', paidTopUpMaxAmountCents: '50' }),
      )

      expect(issuePaths(result)).toEqual(
        expect.arrayContaining(['paidTopUpMinAmountCents', 'paidTopUpMaxAmountCents']),
      )
    })

    it('accepts min <= max', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({ paidTopUpMinAmountCents: '50', paidTopUpMaxAmountCents: '100' }),
      )

      expect(result.success).toBe(true)
    })

    it('validates priority range 1-50', () => {
      expect(issuePaths(walletFormValidationSchema.safeParse(baseForm({ priority: 0 })))).toContain(
        'priority',
      )
      expect(
        issuePaths(walletFormValidationSchema.safeParse(baseForm({ priority: 51 }))),
      ).toContain('priority')
      expect(walletFormValidationSchema.safeParse(baseForm({ priority: 1 })).success).toBe(true)
      expect(walletFormValidationSchema.safeParse(baseForm({ priority: undefined })).success).toBe(
        true,
      )
    })

    it('fails paidCredits when the paid amount exceeds the max bound', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          rateAmount: '1',
          paidCredits: '200',
          paidTopUpMinAmountCents: '10',
          paidTopUpMaxAmountCents: '100',
        }),
      )

      expect(issuePaths(result)).toContain('paidCredits')
    })

    it('skips the paidCredits bounds check when ignorePaidTopUpLimitsOnCreation is set', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          rateAmount: '1',
          paidCredits: '200',
          paidTopUpMinAmountCents: '10',
          paidTopUpMaxAmountCents: '100',
          ignorePaidTopUpLimitsOnCreation: true,
        }),
      )

      expect(result.success).toBe(true)
    })
  })

  describe('recurringTransactionRules', () => {
    it('accepts a valid Interval + Fixed rule', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({ recurringTransactionRules: [baseRule()] }),
      )

      expect(result.success).toBe(true)
    })

    it('requires trigger and method', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [baseRule({ trigger: undefined, method: undefined })],
        }),
      )

      expect(issuePaths(result)).toEqual(
        expect.arrayContaining([
          'recurringTransactionRules.0.trigger',
          'recurringTransactionRules.0.method',
        ]),
      )
    })

    it('requires interval when trigger=Interval', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({ recurringTransactionRules: [baseRule({ interval: undefined })] }),
      )

      expect(issuePaths(result)).toContain('recurringTransactionRules.0.interval')
    })

    it('requires thresholdCredits when trigger=Threshold', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [
            baseRule({ trigger: RecurringTransactionTriggerEnum.Threshold, interval: undefined }),
          ],
        }),
      )

      expect(issuePaths(result)).toContain('recurringTransactionRules.0.thresholdCredits')
    })

    it('fails both sides when threshold >= targetOngoingBalance (Target + Threshold)', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [
            baseRule({
              trigger: RecurringTransactionTriggerEnum.Threshold,
              method: RecurringTransactionMethodEnum.Target,
              interval: undefined,
              thresholdCredits: '100',
              targetOngoingBalance: '50',
            }),
          ],
        }),
      )

      expect(issueFor(result, 'recurringTransactionRules.0.thresholdCredits')?.message).toBe(
        walletFormErrorCodes.thresholdShouldBeLessThanTargetOngoingBalance,
      )
      expect(issueFor(result, 'recurringTransactionRules.0.targetOngoingBalance')?.message).toBe(
        walletFormErrorCodes.targetOngoingBalanceShouldBeGreaterThanThreshold,
      )
    })

    it('requires targetOngoingBalance when method=Target', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [
            baseRule({
              method: RecurringTransactionMethodEnum.Target,
              targetOngoingBalance: undefined,
            }),
          ],
        }),
      )

      expect(issuePaths(result)).toContain('recurringTransactionRules.0.targetOngoingBalance')
    })

    it('requires at least one of paidCredits/grantedCredits when method=Fixed', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [
            baseRule({ paidCredits: undefined, grantedCredits: undefined }),
          ],
        }),
      )

      expect(issuePaths(result)).toEqual(
        expect.arrayContaining([
          'recurringTransactionRules.0.paidCredits',
          'recurringTransactionRules.0.grantedCredits',
        ]),
      )
    })

    it('runs the rule paidCredits bounds against the TOP-LEVEL wallet limits', () => {
      const withBoundsError = walletFormValidationSchema.safeParse(
        baseForm({
          rateAmount: '1',
          paidTopUpMinAmountCents: '10',
          paidTopUpMaxAmountCents: '100',
          recurringTransactionRules: [baseRule({ paidCredits: '200' })],
        }),
      )

      expect(issuePaths(withBoundsError)).toContain('recurringTransactionRules.0.paidCredits')

      const withIgnoreFlag = walletFormValidationSchema.safeParse(
        baseForm({
          rateAmount: '1',
          paidTopUpMinAmountCents: '10',
          paidTopUpMaxAmountCents: '100',
          recurringTransactionRules: [
            baseRule({ paidCredits: '200', ignorePaidTopUpLimits: true }),
          ],
        }),
      )

      expect(withIgnoreFlag.success).toBe(true)
    })

    it('checks startedAt format only (not required, not future) when trigger=Interval', () => {
      const missing = walletFormValidationSchema.safeParse(
        baseForm({ recurringTransactionRules: [baseRule({ startedAt: undefined })] }),
      )

      expect(missing.success).toBe(true)

      const past = walletFormValidationSchema.safeParse(
        baseForm({ recurringTransactionRules: [baseRule({ startedAt: '2020-01-01T00:00:00Z' })] }),
      )

      expect(past.success).toBe(true)

      const invalid = walletFormValidationSchema.safeParse(
        baseForm({ recurringTransactionRules: [baseRule({ startedAt: 'not-a-date' })] }),
      )

      expect(issueFor(invalid, 'recurringTransactionRules.0.startedAt')?.message).toBe(
        dateErrorCodes.wrongFormat,
      )
    })

    it('rejects a past rule expirationAt', () => {
      const result = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [baseRule({ expirationAt: '2020-01-01T00:00:00Z' })],
        }),
      )

      expect(issueFor(result, 'recurringTransactionRules.0.expirationAt')?.message).toBe(
        dateErrorCodes.shouldBeInFuture,
      )
    })

    it('validates transactionMetadata key uniqueness and max lengths', () => {
      const duplicated = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [
            baseRule({
              transactionMetadata: [
                { key: 'same', value: 'a' },
                { key: 'same', value: 'b' },
              ],
            }),
          ],
        }),
      )

      expect(
        issueFor(duplicated, 'recurringTransactionRules.0.transactionMetadata.0.key')?.message,
      ).toBe(MetadataErrorsEnum.uniqueness)
      expect(
        issueFor(duplicated, 'recurringTransactionRules.0.transactionMetadata.1.key')?.message,
      ).toBe(MetadataErrorsEnum.uniqueness)

      const tooLong = walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: [
            baseRule({
              transactionMetadata: [{ key: 'a'.repeat(21), value: 'b' }],
            }),
          ],
        }),
      )

      expect(
        issueFor(tooLong, 'recurringTransactionRules.0.transactionMetadata.0.key')?.message,
      ).toBe(MetadataErrorsEnum.maxLength)
    })
  })
})

describe('malformed recurringTransactionRules shape', () => {
  it('does not throw when rules is a plain object instead of an array', () => {
    // Regression: an index-set on an undefined base once produced {0: rule}
    // — a throwing superRefine leaves the form stuck in isSubmitting.
    expect(() =>
      walletFormValidationSchema.safeParse(
        baseForm({
          recurringTransactionRules: {
            0: baseRule(),
          } as unknown as TWalletDataForm['recurringTransactionRules'],
        }),
      ),
    ).not.toThrow()
  })
})
