import { renderHook } from '@testing-library/react'
import { FormikProps } from 'formik'
import React from 'react'

import { createMockFormikProps } from '~/components/creditNote/__tests__/formikProps.factory'
import {
  CurrencyEnum,
  InvoiceForCreditNoteFormCalculationFragment,
  InvoicePaymentStatusTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { CreditNoteForm } from '../types'
import { useCreditNoteFormCalculation } from '../useCreditNoteFormCalculation'

const createMockInvoice = (
  overrides: Partial<InvoiceForCreditNoteFormCalculationFragment> = {},
): InvoiceForCreditNoteFormCalculationFragment => ({
  id: 'invoice-1',
  couponsAmountCents: '0',
  paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
  creditableAmountCents: '10000',
  refundableAmountCents: '10000',
  feesAmountCents: '10000',
  currency: CurrencyEnum.Usd,
  versionNumber: 4,
  paymentDisputeLostAt: null,
  totalPaidAmountCents: '10000',
  fees: [],
  ...overrides,
})

const mockFeeForEstimate = [{ amountCents: 10000, feeId: 'fee-1' }]

type SetupOptions = {
  invoice?: InvoiceForCreditNoteFormCalculationFragment
  formikProps?: FormikProps<Partial<CreditNoteForm>>
  feeForEstimate?: typeof mockFeeForEstimate
}

function setup(options: SetupOptions = {}) {
  const {
    invoice = createMockInvoice(),
    formikProps = createMockFormikProps(),
    feeForEstimate = mockFeeForEstimate,
  } = options

  const setPayBackValidation = jest.fn()

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks: [],
    })

  const { result, rerender } = renderHook(
    () =>
      useCreditNoteFormCalculation({
        invoice,
        formikProps,
        feeForEstimate,
        setPayBackValidation,
      }),
    { wrapper },
  )

  return { result, rerender, setPayBackValidation, formikProps }
}

describe('useCreditNoteFormCalculation', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('derived flags', () => {
    describe('canOnlyCredit', () => {
      it('should return true when totalPaidAmountCents is 0', () => {
        const invoice = createMockInvoice({ totalPaidAmountCents: '0' })
        const { result } = setup({ invoice })

        expect(result.current.canOnlyCredit).toBe(true)
        expect(result.current.canRefund).toBe(false)
      })

      it('should return true when paymentDisputeLostAt is set', () => {
        const invoice = createMockInvoice({
          totalPaidAmountCents: '10000',
          paymentDisputeLostAt: '2024-01-01',
        })
        const { result } = setup({ invoice })

        expect(result.current.canOnlyCredit).toBe(true)
        expect(result.current.canRefund).toBe(false)
      })

      it('should return false when totalPaidAmountCents > 0 and no paymentDisputeLostAt', () => {
        const invoice = createMockInvoice({
          totalPaidAmountCents: '10000',
          paymentDisputeLostAt: null,
        })
        const { result } = setup({ invoice })

        expect(result.current.canOnlyCredit).toBe(false)
        expect(result.current.canRefund).toBe(true)
      })
    })

    describe('hasCouponLine', () => {
      it('should return true when couponsAmountCents > 0 and versionNumber >= 3', () => {
        const invoice = createMockInvoice({
          couponsAmountCents: '1000',
          versionNumber: 3,
        })
        const { result } = setup({ invoice })

        expect(result.current.hasCouponLine).toBe(true)
      })

      it('should return false when couponsAmountCents is 0', () => {
        const invoice = createMockInvoice({
          couponsAmountCents: '0',
          versionNumber: 4,
        })
        const { result } = setup({ invoice })

        expect(result.current.hasCouponLine).toBe(false)
      })
    })

    describe('currency', () => {
      it('should return invoice currency', () => {
        const invoice = createMockInvoice({ currency: CurrencyEnum.Eur })
        const { result } = setup({ invoice })

        expect(result.current.currency).toBe(CurrencyEnum.Eur)
      })

      it('should default to USD when invoice is undefined', () => {
        const { result } = setup({ invoice: undefined })

        expect(result.current.currency).toBe(CurrencyEnum.Usd)
      })
    })
  })

  describe('return values structure', () => {
    it('should return all expected properties', () => {
      const { result } = setup()

      // Calculated values
      expect(result.current).toHaveProperty('maxCreditableAmount')
      expect(result.current).toHaveProperty('maxRefundableAmount')
      expect(result.current).toHaveProperty('proRatedCouponAmount')
      expect(result.current).toHaveProperty('taxes')
      expect(result.current).toHaveProperty('totalExcludedTax')
      expect(result.current).toHaveProperty('totalTaxIncluded')

      // Derived flags
      expect(result.current).toHaveProperty('canOnlyCredit')
      expect(result.current).toHaveProperty('canRefund')
      expect(result.current).toHaveProperty('hasCouponLine')

      // Loading state
      expect(result.current).toHaveProperty('estimationLoading')

      // Invoice-derived values
      expect(result.current).toHaveProperty('currency')
    })

    it('should return taxes as a Map', () => {
      const { result } = setup()

      expect(result.current.taxes).toBeInstanceOf(Map)
    })
  })
})
