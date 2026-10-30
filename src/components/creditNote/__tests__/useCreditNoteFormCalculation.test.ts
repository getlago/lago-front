import { renderHook } from '@testing-library/react'
import React from 'react'

import {
  CurrencyEnum,
  InvoiceForCreditNoteFormCalculationFragment,
  InvoicePaymentStatusTypeEnum,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

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
  totalAmountCents: '15000',
  totalDueAmountCents: '5000',
  invoiceType: InvoiceTypeEnum.Subscription,
  fees: [],
  ...overrides,
})

const mockFeeForEstimate = [{ amountCents: 10000, feeId: 'fee-1' }]

type SetupOptions = {
  invoice?: InvoiceForCreditNoteFormCalculationFragment
  feeForEstimate?: typeof mockFeeForEstimate
}

function setup(options: SetupOptions = {}) {
  const { invoice = createMockInvoice(), feeForEstimate = mockFeeForEstimate } = options

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks: [],
    })

  const { result, rerender } = renderHook(
    () => useCreditNoteFormCalculation({ invoice, feeForEstimate }),
    { wrapper },
  )

  return { result, rerender }
}

describe('useCreditNoteFormCalculation', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN derived flags', () => {
    describe('GIVEN hasCouponLine', () => {
      it('WHEN couponsAmountCents > 0 and versionNumber >= 3 THEN should return true', () => {
        const invoice = createMockInvoice({
          couponsAmountCents: '1000',
          versionNumber: 3,
        })
        const { result } = setup({ invoice })

        expect(result.current.hasCouponLine).toBe(true)
      })

      it('WHEN couponsAmountCents is 0 THEN should return false', () => {
        const invoice = createMockInvoice({
          couponsAmountCents: '0',
          versionNumber: 4,
        })
        const { result } = setup({ invoice })

        expect(result.current.hasCouponLine).toBe(false)
      })
    })

    describe('GIVEN currency', () => {
      it('WHEN invoice has currency THEN should return invoice currency', () => {
        const invoice = createMockInvoice({ currency: CurrencyEnum.Eur })
        const { result } = setup({ invoice })

        expect(result.current.currency).toBe(CurrencyEnum.Eur)
      })

      it('WHEN invoice is undefined THEN should default to USD', () => {
        const { result } = setup({ invoice: undefined })

        expect(result.current.currency).toBe(CurrencyEnum.Usd)
      })
    })
  })

  describe('GIVEN return values structure', () => {
    it('THEN should return all expected properties', () => {
      const { result } = setup()

      // Calculated values
      expect(result.current).toHaveProperty('maxCreditableAmount')
      expect(result.current).toHaveProperty('maxRefundableAmount')
      expect(result.current).toHaveProperty('maxOffsettableAmount')
      expect(result.current).toHaveProperty('proRatedCouponAmount')
      expect(result.current).toHaveProperty('taxes')
      expect(result.current).toHaveProperty('totalExcludedTax')
      expect(result.current).toHaveProperty('totalTaxIncluded')
      expect(result.current).toHaveProperty('amountDue')

      // Derived flags
      expect(result.current).toHaveProperty('hasCouponLine')
      expect(result.current).toHaveProperty('isInvoiceFullyPaid')

      // Loading state
      expect(result.current).toHaveProperty('estimationLoading')

      // Invoice-derived values
      expect(result.current).toHaveProperty('currency')
    })

    it('THEN should return taxes as a Map', () => {
      const { result } = setup()

      expect(result.current.taxes).toBeInstanceOf(Map)
    })
  })
})
