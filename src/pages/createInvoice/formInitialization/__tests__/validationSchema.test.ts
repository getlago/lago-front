import { InvoiceFormInput, LocalFeeInput } from '~/components/invoices/types'
import { CurrencyEnum } from '~/generated/graphql'

import { invoiceFormErrorLabels, invoiceFormValidationSchema } from '../validationSchema'

type ParseResult = ReturnType<typeof invoiceFormValidationSchema.safeParse>

const baseFee = (overrides: Partial<LocalFeeInput> = {}): LocalFeeInput =>
  ({
    addOnId: 'addon_1',
    name: 'Setup fee',
    description: null,
    invoiceDisplayName: '',
    units: 1,
    unitAmountCents: 100,
    taxes: [],
    fromDatetime: '2026-07-15T00:00:00.000+02:00',
    toDatetime: '2026-07-15T23:59:59.999+02:00',
    ...overrides,
  }) as LocalFeeInput

const baseForm = (overrides: Partial<InvoiceFormInput> = {}): InvoiceFormInput => ({
  customerId: 'cus_1',
  billingEntityId: 'be_1',
  currency: CurrencyEnum.Eur,
  fees: [baseFee()],
  paymentMethod: undefined,
  invoiceCustomSection: undefined,
  purchaseOrderNumber: undefined,
  ...overrides,
})

const issuePaths = (result: ParseResult): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.join('.'))

const issueFor = (result: ParseResult, path: string) =>
  result.success ? undefined : result.error.issues.find((i) => i.path.join('.') === path)

describe('invoiceFormValidationSchema', () => {
  describe('GIVEN a complete valid form', () => {
    describe('WHEN validating', () => {
      it('THEN should pass', () => {
        expect(invoiceFormValidationSchema.safeParse(baseForm()).success).toBe(true)
      })
    })
  })

  describe('GIVEN an empty fees array', () => {
    describe('WHEN validating', () => {
      it('THEN should pass', () => {
        // Parity with Yup 1.x: array().required('') does NOT reject [] — the
        // "at least one item" block lives in the submit-button gate
        // (hasAnyFee), not in the schema.
        expect(invoiceFormValidationSchema.safeParse(baseForm({ fees: [] })).success).toBe(true)
      })
    })
  })

  describe('GIVEN a missing customerId', () => {
    describe('WHEN validating', () => {
      it.each([
        ['undefined', undefined],
        // empty strings count as missing — Formik ran Yup on
        // prepareDataForValidation(values) which converts '' to undefined
        ['an empty string', ''],
        ['null', null],
      ])('THEN should fail on customerId with the required label (%s)', (_, emptyValue) => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ customerId: emptyValue as unknown as string }),
        )

        expect(issuePaths(result)).toContain('customerId')
        expect(issueFor(result, 'customerId')?.message).toBe(invoiceFormErrorLabels.required)
      })
    })
  })

  describe('GIVEN a missing currency', () => {
    describe('WHEN validating', () => {
      it.each([
        ['undefined', undefined],
        ['an empty string', ''],
        ['null', null],
      ])('THEN should fail on currency (%s)', (_, emptyValue) => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ currency: emptyValue as unknown as CurrencyEnum }),
        )

        expect(issuePaths(result)).toContain('currency')
      })
    })
  })

  describe('GIVEN a missing fees array', () => {
    describe('WHEN validating', () => {
      it.each([
        ['undefined', undefined],
        ['null', null],
      ])('THEN should fail on fees (%s)', (_, emptyValue) => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: emptyValue as unknown as LocalFeeInput[] }),
        )

        expect(issuePaths(result)).toEqual(['fees'])
      })
    })
  })

  describe('GIVEN fields the old Yup schema never validated', () => {
    describe('WHEN validating', () => {
      it('THEN should not fail on billingEntityId, purchaseOrderNumber, paymentMethod or invoiceCustomSection', () => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({
            billingEntityId: undefined,
            purchaseOrderNumber: '',
            paymentMethod: { paymentMethodId: 'pm_1' },
            invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
          }),
        )

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN a fee without an addOnId', () => {
    describe('WHEN validating', () => {
      it.each([
        ['undefined', undefined],
        ['an empty string', ''],
        ['null', null],
      ])('THEN should fail on the fee addOnId with the required label (%s)', (_, emptyValue) => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: [baseFee({ addOnId: emptyValue as unknown as string })] }),
        )

        expect(issuePaths(result)).toEqual(['fees.0.addOnId'])
        expect(issueFor(result, 'fees.0.addOnId')?.message).toBe(invoiceFormErrorLabels.required)
      })
    })
  })

  describe('GIVEN a fee with units below 1', () => {
    describe('WHEN validating', () => {
      it.each([
        ['0 (the emptied-input value, Number("") === 0)', 0],
        ['0.5', 0.5],
      ])('THEN should fail on the fee units with the visible min label (%s)', (_, units) => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: [baseFee({ units })] }),
        )

        expect(issuePaths(result)).toEqual(['fees.0.units'])
        expect(issueFor(result, 'fees.0.units')?.message).toBe(
          invoiceFormErrorLabels.feeUnitsBelowOne,
        )
      })
    })
  })

  describe('GIVEN a fee with absent units', () => {
    describe('WHEN validating', () => {
      it.each([
        ['undefined', undefined],
        // '' counts as MISSING (prepareDataForValidation semantics), so it
        // must fail the required check, NOT the min-1 check
        ['an empty string', ''],
        ['null', null],
      ])('THEN should fail with the required label, not the min label (%s)', (_, emptyValue) => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: [baseFee({ units: emptyValue as unknown as number })] }),
        )

        expect(issuePaths(result)).toEqual(['fees.0.units'])
        expect(issueFor(result, 'fees.0.units')?.message).toBe(invoiceFormErrorLabels.required)
      })
    })
  })

  describe('GIVEN a fee with valid units', () => {
    describe('WHEN validating', () => {
      it.each([
        ['1', 1],
        ['3.5', 3.5],
      ])('THEN should pass (%s)', (_, units) => {
        expect(
          invoiceFormValidationSchema.safeParse(baseForm({ fees: [baseFee({ units })] })).success,
        ).toBe(true)
      })
    })
  })

  describe('GIVEN a fee with an emptied unitAmountCents', () => {
    describe('WHEN validating', () => {
      it('THEN should pass — the field is deliberately unvalidated', () => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: [baseFee({ unitAmountCents: '' })] }),
        )

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN two fees where only the second is invalid', () => {
    describe('WHEN validating', () => {
      it('THEN should index the errors on the right fee', () => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: [baseFee(), baseFee({ addOnId: '', units: 0 })] }),
        )

        expect(issuePaths(result).sort()).toEqual(['fees.1.addOnId', 'fees.1.units'])
      })
    })
  })

  describe('GIVEN a malformed fees shape', () => {
    // A throwing superRefine leaves the form stuck in isSubmitting forever —
    // malformed shapes must produce issues, never exceptions.
    describe('WHEN validating a non-array fees object', () => {
      it('THEN should fail on fees without throwing', () => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: { 0: baseFee() } as unknown as LocalFeeInput[] }),
        )

        expect(result.success).toBe(false)
        expect(issuePaths(result)).toEqual(['fees'])
      })
    })

    describe('WHEN validating a null fee item', () => {
      it('THEN should fail on the fee item without throwing', () => {
        const result = invoiceFormValidationSchema.safeParse(
          baseForm({ fees: [null] as unknown as LocalFeeInput[] }),
        )

        expect(result.success).toBe(false)
        expect(issuePaths(result)).toEqual(['fees.0'])
      })
    })
  })
})
