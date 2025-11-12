import { renderHook } from '@testing-library/react'

import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { usePaymentMethodOptions } from '../usePaymentMethodOptions'

const mockTranslate = jest.fn()

describe('usePaymentMethodOptions', () => {
  describe('WHEN payment methods list is empty, null or undefined', () => {
    it.each([
      { input: undefined, description: 'undefined' },
      { input: null, description: 'null' },
      { input: [], description: 'empty array' },
    ])('THEN returns only manual option when list is $description', ({ input }) => {
      const { result } = renderHook(() =>
        usePaymentMethodOptions(input as PaymentMethodList | undefined, mockTranslate),
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].value).toBe('manual')
      expect(result.current[0].isDefault).toBeUndefined() // Manual option never has default flag
    })
  })

  describe('WHEN payment methods list has items', () => {
    it('THEN returns options with default payment method first, then others, then manual', () => {
      const paymentMethods: PaymentMethodList = [
        createMockPaymentMethod({
          id: 'pm_001',
          isDefault: false,
          details: {
            __typename: 'PaymentMethodDetails',
            type: 'card',
            brand: 'visa',
            expirationYear: '2025',
            expirationMonth: '12',
            last4: '4242',
          },
        }),
        createMockPaymentMethod({
          id: 'pm_002',
          isDefault: true,
          details: {
            __typename: 'PaymentMethodDetails',
            type: 'card',
            brand: 'mastercard',
            expirationYear: '2026',
            expirationMonth: '06',
            last4: '8888',
          },
        }),
        createMockPaymentMethod({
          id: 'pm_003',
          isDefault: false,
          details: {
            __typename: 'PaymentMethodDetails',
            type: 'card',
            brand: 'amex',
            expirationYear: '2027',
            expirationMonth: '03',
            last4: '1234',
          },
        }),
      ]

      const { result } = renderHook(() => usePaymentMethodOptions(paymentMethods, mockTranslate))

      expect(result.current).toHaveLength(4) // 3 payment methods + 1 manual
      expect(result.current[0].value).toBe('pm_002') // Default first
      expect(result.current[0].isDefault).toBe(true) // Default flag set
      expect(result.current[1].value).toBe('pm_001') // Others
      expect(result.current[1].isDefault).toBeUndefined() // No default flag
      expect(result.current[2].value).toBe('pm_003') // Others
      expect(result.current[2].isDefault).toBeUndefined() // No default flag
      expect(result.current[3].value).toBe('manual') // Manual last
      expect(result.current[3].isDefault).toBeUndefined() // No default flag
    })

    it('THEN filters out deleted payment methods', () => {
      const paymentMethods: PaymentMethodList = [
        createMockPaymentMethod({
          id: 'pm_001',
          isDefault: false,
          deletedAt: null,
          details: {
            __typename: 'PaymentMethodDetails',
            type: 'card',
            brand: 'visa',
            expirationYear: '2025',
            expirationMonth: '12',
            last4: '4242',
          },
        }),
        createMockPaymentMethod({
          id: 'pm_002',
          isDefault: true,
          deletedAt: '2024-01-01T00:00:00Z',
          details: {
            __typename: 'PaymentMethodDetails',
            type: 'card',
            brand: 'mastercard',
            expirationYear: '2026',
            expirationMonth: '06',
            last4: '8888',
          },
        }),
      ]

      const { result } = renderHook(() => usePaymentMethodOptions(paymentMethods, mockTranslate))

      expect(result.current).toHaveLength(2) // 1 active payment method + 1 manual
      expect(result.current[0].value).toBe('pm_001')
      expect(result.current[0].isDefault).toBeUndefined() // No default flag (deleted default was filtered out)
      expect(result.current[1].value).toBe('manual')
      expect(result.current[1].isDefault).toBeUndefined() // No default flag
    })
  })
})
