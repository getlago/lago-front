import { maskValue } from '~/core/formats/maskValue'
import { ProviderTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'

import { formatPaymentMethodLabel } from '../../paymentMethodSelection/utils'

const maskedLast4 = maskValue('4242', { withSpace: true })

const mockTranslate = (): string => 'Default'

describe('formatPaymentMethodLabel', () => {
  describe('WHEN formatting payment method label', () => {
    it('THEN returns correct label for payment method with type, brand and last4', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          expirationYear: '2025',
          expirationMonth: '12',
          last4: '4242',
        },
        paymentProviderType: null,
        paymentProviderCode: null,
        isDefault: false,
      })

      const result = formatPaymentMethodLabel(mockTranslate, paymentMethod)

      expect(result.label).toBe(`Card - Visa ${maskedLast4}`)
      expect(result.headerText).toBe(`Card - Visa ${maskedLast4}`)
      expect(result.footerText).toBe('')
      expect(result.isDefault).toBe(false)
    })

    it('THEN returns correct label for default payment method', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          expirationYear: '2025',
          expirationMonth: '12',
          last4: '4242',
        },
        isDefault: true,
      })

      const result = formatPaymentMethodLabel(mockTranslate, paymentMethod)

      expect(result.label).toBe(`Card - Visa ${maskedLast4} (Default)`)
      expect(result.headerText).toBe(`Card - Visa ${maskedLast4} (Default)`)
      expect(result.isDefault).toBe(true)
    })

    it('THEN normalizes brand with underscores to spaces and capitalizes', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'american_express',
          expirationYear: '2025',
          expirationMonth: '12',
          last4: '4242',
        },
        isDefault: false,
      })

      const result = formatPaymentMethodLabel(mockTranslate, paymentMethod)

      expect(result.label).toBe(`Card - American Express ${maskedLast4}`)
      expect(result.headerText).toBe(`Card - American Express ${maskedLast4}`)
    })

    it('THEN returns correct label with payment provider info in footer', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          expirationYear: '2025',
          expirationMonth: '12',
          last4: '4242',
        },
        paymentProviderType: ProviderTypeEnum.Stripe,
        paymentProviderCode: '1234',
        isDefault: false,
      })

      const result = formatPaymentMethodLabel(mockTranslate, paymentMethod)

      expect(result.label).toBe(`Card - Visa ${maskedLast4}`)
      expect(result.footerText).toBe(`${String(ProviderTypeEnum.Stripe)} • 1234`)
    })

    it('THEN handles payment method with only type and last4 (no brand)', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: null,
          expirationYear: '2025',
          expirationMonth: '12',
          last4: '4242',
        },
        isDefault: false,
      })

      const result = formatPaymentMethodLabel(mockTranslate, paymentMethod)

      expect(result.label).toBe(`Card ${maskedLast4}`)
      expect(result.headerText).toBe(`Card ${maskedLast4}`)
    })

    it('THEN handles payment method with only brand and last4 (no type)', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: null,
          brand: 'visa',
          expirationYear: '2025',
          expirationMonth: '12',
          last4: '4242',
        },
        isDefault: false,
      })

      const result = formatPaymentMethodLabel(mockTranslate, paymentMethod)

      expect(result.label).toBe(`Visa ${maskedLast4}`)
      expect(result.headerText).toBe(`Visa ${maskedLast4}`)
    })
  })
})
