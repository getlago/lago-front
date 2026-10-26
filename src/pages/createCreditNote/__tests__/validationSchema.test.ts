import {
  CreditNoteFeeErrorEnum,
  CreditTypeEnum,
  FeesPerInvoice,
  FromFee,
  PayBackErrorEnum,
} from '~/components/creditNote/types'
import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import { CreditNoteReasonEnum, CurrencyEnum } from '~/generated/graphql'

import {
  buildCreditNoteSchema,
  CREDIT_NOTE_DEFAULT_VALUES,
  CreditNoteFormValues,
  hasCreditNoteFeeErrors,
  PAY_BACK_ERRORS_PATH,
} from '../validationSchema'

const buildFee = (overrides: Partial<FromFee> = {}): FromFee => ({
  id: 'fee-1',
  checked: true,
  // maxAmount is in cents: 10000 cents is $100
  maxAmount: 10000,
  name: 'Fee',
  value: 100,
  ...overrides,
})

const DEFAULT_LIMITS = {
  totalTaxIncluded: 100,
  maxCreditableAmount: 100,
  maxRefundableAmount: 60,
  maxOffsettableAmount: 40,
}

type SchemaOptions = {
  feesPerInvoice?: FeesPerInvoice
  feeForAddOn?: FromFee[]
  feeForCredit?: FromFee[]
  isPrepaidCreditsInvoice?: boolean
  limits?: Partial<typeof DEFAULT_LIMITS>
}

const parse = (values: Partial<CreditNoteFormValues>, options: SchemaOptions = {}) => {
  const schema = buildCreditNoteSchema({
    currency: CurrencyEnum.Usd,
    feesPerInvoice: options.feesPerInvoice,
    feeForAddOn: options.feeForAddOn,
    feeForCredit: options.feeForCredit,
    isPrepaidCreditsInvoice: options.isPrepaidCreditsInvoice ?? false,
    getAllocationLimits: () => ({ ...DEFAULT_LIMITS, ...options.limits }),
  })

  const result = schema.safeParse({
    ...CREDIT_NOTE_DEFAULT_VALUES,
    reason: CreditNoteReasonEnum.Other,
    ...values,
  })

  return (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

describe('createCreditNote validationSchema', () => {
  describe('GIVEN the reason', () => {
    describe('WHEN it is missing', () => {
      it('THEN should report an issue on reason', () => {
        const issues = parse({ reason: undefined })

        expect(issues.map((issue) => issue.path)).toContain('reason')
      })
    })
  })

  describe('GIVEN a subscription fee', () => {
    const feesPerInvoice: FeesPerInvoice = {
      'sub-1': { subscriptionName: 'Sub', fees: [buildFee()] },
    }

    describe('WHEN it is checked with an empty value', () => {
      it('THEN should report minZero', () => {
        const issues = parse(
          { fees: { 'sub-1': { subscriptionName: 'Sub', fees: [buildFee({ value: '' })] } } },
          { feesPerInvoice },
        )

        expect(issues).toContainEqual({
          path: 'fees.sub-1.fees.0.value',
          message: CreditNoteFeeErrorEnum.minZero,
        })
      })
    })

    describe('WHEN it is checked above its max amount', () => {
      it('THEN should report overMax', () => {
        const issues = parse(
          { fees: { 'sub-1': { subscriptionName: 'Sub', fees: [buildFee({ value: 101 })] } } },
          { feesPerInvoice },
        )

        expect(issues).toContainEqual({
          path: 'fees.sub-1.fees.0.value',
          message: CreditNoteFeeErrorEnum.overMax,
        })
      })
    })

    describe('WHEN it is unchecked', () => {
      it('THEN should report nothing for that row', () => {
        const issues = parse(
          {
            fees: {
              'sub-1': {
                subscriptionName: 'Sub',
                fees: [buildFee({ checked: false, value: 999 })],
              },
            },
            payBack: [{ type: CreditTypeEnum.credit, value: 100 }],
          },
          { feesPerInvoice },
        )

        expect(issues).toEqual([])
      })
    })

    describe('WHEN the displayed rows are ordered differently from the invoice rows', () => {
      it('THEN should still take each max from the row of the same id', () => {
        const invoiceFees: FeesPerInvoice = {
          'sub-1': {
            subscriptionName: 'Sub',
            fees: [
              buildFee({ id: 'fee-a', maxAmount: 10000 }),
              buildFee({ id: 'fee-b', maxAmount: 500 }),
            ],
          },
        }

        const issues = parse(
          {
            fees: {
              'sub-1': {
                subscriptionName: 'Sub',
                fees: [buildFee({ id: 'fee-b', value: 6 }), buildFee({ id: 'fee-a', value: 94 })],
              },
            },
            payBack: [{ type: CreditTypeEnum.credit, value: 100 }],
          },
          { feesPerInvoice: invoiceFees },
        )

        expect(issues).toEqual([
          { path: 'fees.sub-1.fees.0.value', message: CreditNoteFeeErrorEnum.overMax },
        ])
      })
    })
  })

  describe('GIVEN add-on fees', () => {
    describe('WHEN a row is checked above the max of the fee at the same index', () => {
      it('THEN should report overMax on that index', () => {
        const feeForAddOn = [
          buildFee({ maxAmount: 10000 }),
          buildFee({ id: 'fee-2', maxAmount: 500 }),
        ]

        const issues = parse(
          { addOnFee: [buildFee({ value: 100 }), buildFee({ id: 'fee-2', value: 6 })] },
          { feeForAddOn, limits: { totalTaxIncluded: 0 } },
        )

        expect(issues).toContainEqual({
          path: 'addOnFee.1.value',
          message: CreditNoteFeeErrorEnum.overMax,
        })
      })
    })
  })

  describe('GIVEN the allocation', () => {
    describe('WHEN credit, refund and offset do not add up to the total', () => {
      it('THEN should report maxTotalInvoice on the payBackErrors path', () => {
        const issues = parse({
          payBack: [
            { type: CreditTypeEnum.credit, value: 50 },
            { type: CreditTypeEnum.refund, value: 30 },
          ],
        })

        expect(issues).toContainEqual({
          path: PAY_BACK_ERRORS_PATH,
          message: PayBackErrorEnum.maxTotalInvoice,
        })
      })
    })

    describe('WHEN they add up to the total', () => {
      it('THEN should report nothing', () => {
        const issues = parse({
          payBack: [
            { type: CreditTypeEnum.credit, value: 50 },
            { type: CreditTypeEnum.refund, value: 50 },
          ],
        })

        expect(issues).toEqual([])
      })
    })

    describe('WHEN a row exceeds its own maximum', () => {
      it.each([
        [CreditTypeEnum.refund, PayBackErrorEnum.maxRefund, DEFAULT_LIMITS.maxRefundableAmount],
        [CreditTypeEnum.offset, PayBackErrorEnum.maxOffset, DEFAULT_LIMITS.maxOffsettableAmount],
      ])('THEN should report the %s maximum on that row', (type, message, max) => {
        const issues = parse({
          payBack: [
            { type: CreditTypeEnum.credit, value: 100 - max - 1 },
            { type, value: max + 1 },
          ],
        })

        expect(issues).toContainEqual({ path: 'payBack.1.value', message })
      })

      it('THEN should report the credit maximum on that row', () => {
        const issues = parse(
          { payBack: [{ type: CreditTypeEnum.credit, value: 120 }] },
          { limits: { totalTaxIncluded: 120, maxCreditableAmount: 100 } },
        )

        expect(issues).toContainEqual({
          path: 'payBack.0.value',
          message: PayBackErrorEnum.maxCredit,
        })
      })
    })

    describe('WHEN the invoice is a prepaid credits one', () => {
      it('THEN should skip the allocation rules', () => {
        const issues = parse(
          { payBack: [{ type: CreditTypeEnum.refund, value: 5 }] },
          { isPrepaidCreditsInvoice: true },
        )

        expect(issues).toEqual([])
      })
    })
  })

  describe('GIVEN metadata', () => {
    it.each([
      [[{ key: '', value: 'v' }], 'metadata.0.key', MetadataErrorsEnum.required],
      [[{ key: 'k', value: '' }], 'metadata.0.value', MetadataErrorsEnum.required],
      [[{ key: 'a'.repeat(41), value: 'v' }], 'metadata.0.key', MetadataErrorsEnum.maxLength],
      [[{ key: 'k', value: 'v'.repeat(256) }], 'metadata.0.value', MetadataErrorsEnum.maxLength],
      [
        [
          { key: 'same', value: 'v' },
          { key: 'same', value: 'v' },
        ],
        'metadata.0.key',
        MetadataErrorsEnum.uniqueness,
      ],
    ])('THEN should report %#', (metadata, path, message) => {
      const issues = parse({ metadata, payBack: [{ type: CreditTypeEnum.credit, value: 100 }] })

      expect(issues).toContainEqual({ path, message })
    })
  })

  describe('GIVEN several rules failing at once', () => {
    describe('WHEN the reason is missing AND the allocation does not add up', () => {
      it('THEN should report both, so one never hides the other', () => {
        const issues = parse({
          reason: undefined,
          payBack: [{ type: CreditTypeEnum.credit, value: 0 }],
        })

        expect(issues.map((issue) => issue.path)).toEqual(
          expect.arrayContaining(['reason', PAY_BACK_ERRORS_PATH]),
        )
      })
    })
  })

  describe('hasCreditNoteFeeErrors()', () => {
    const feesPerInvoice: FeesPerInvoice = {
      'sub-1': { subscriptionName: 'Sub', fees: [buildFee()] },
    }

    describe('GIVEN every checked fee within its bounds', () => {
      it('THEN should return false', () => {
        expect(
          hasCreditNoteFeeErrors({
            currency: CurrencyEnum.Usd,
            feesPerInvoice,
            feeForAddOn: undefined,
            fees: feesPerInvoice,
            addOnFee: undefined,
          }),
        ).toBe(false)
      })
    })

    describe('GIVEN a checked fee above its max', () => {
      it('THEN should return true', () => {
        expect(
          hasCreditNoteFeeErrors({
            currency: CurrencyEnum.Usd,
            feesPerInvoice,
            feeForAddOn: undefined,
            fees: {
              'sub-1': { subscriptionName: 'Sub', fees: [buildFee({ value: 101 })] },
            },
            addOnFee: undefined,
          }),
        ).toBe(true)
      })
    })
  })
})
