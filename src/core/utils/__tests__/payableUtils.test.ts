import { Payable } from '~/core/types/payable'
import { getPayableNumber, isInvoice, isPaymentRequest } from '~/core/utils/payableUtils'

describe('payableUtils', () => {
  describe('isInvoice', () => {
    it('should return true when payable is an Invoice', () => {
      const payable: Payable = {
        __typename: 'Invoice',
        id: 'invoice-1',
        number: 'INV-001',
        payableType: 'Invoice',
      }

      expect(isInvoice(payable)).toBe(true)
    })

    it('should return false when payable is a PaymentRequest', () => {
      const payable: Payable = {
        __typename: 'PaymentRequest',
        payableType: 'PaymentRequest',
        invoices: [],
      }

      expect(isInvoice(payable)).toBe(false)
    })
  })

  describe('isPaymentRequest', () => {
    it('should return true when payable is a PaymentRequest', () => {
      const payable: Payable = {
        __typename: 'PaymentRequest',
        payableType: 'PaymentRequest',
        invoices: [{ __typename: 'Invoice', id: 'invoice-1', number: 'INV-001' }],
      }

      expect(isPaymentRequest(payable)).toBe(true)
    })

    it('should return false when payable is an Invoice', () => {
      const payable: Payable = {
        __typename: 'Invoice',
        id: 'invoice-1',
        number: 'INV-001',
        payableType: 'Invoice',
      }

      expect(isPaymentRequest(payable)).toBe(false)
    })
  })
  describe('getPayableNumber', () => {
    it('should return the invoice number when payable is an Invoice', () => {
      const payable: Payable = {
        __typename: 'Invoice',
        id: 'invoice-1',
        number: 'INV-001',
        payableType: 'Invoice',
      }

      expect(getPayableNumber(payable)).toBe('INV-001')
    })

    it('should return the first invoice number when payable is a PaymentRequest', () => {
      const payable: Payable = {
        __typename: 'PaymentRequest',
        payableType: 'PaymentRequest',
        invoices: [
          { __typename: 'Invoice', id: 'invoice-1', number: 'INV-001' },
          { __typename: 'Invoice', id: 'invoice-2', number: 'INV-002' },
        ],
      }

      expect(getPayableNumber(payable)).toBe('INV-001')
    })

    // An empty label leaves the link named by its cell, which beats naming it ''.
    it('should return an empty string when a PaymentRequest carries no invoice', () => {
      const payable: Payable = {
        __typename: 'PaymentRequest',
        payableType: 'PaymentRequest',
        invoices: [],
      }

      expect(getPayableNumber(payable)).toBe('')
    })
  })
})
