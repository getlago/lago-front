import { screen } from '@testing-library/react'

import { ProviderTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { render } from '~/test-utils'

import {
  DEFAULT_BADGE_TEST_ID,
  OBFUSCATED_LAST4_PREFIX,
  PaymentMethodDetailsCell,
} from '../PaymentMethodDetailsCell'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('PaymentMethodDetailsCell', () => {
  describe('WHEN rendering payment method details', () => {
    it('THEN displays type, brand and last4 when all details are present', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expirationMonth: null,
          expirationYear: null,
        },
      })

      render(<PaymentMethodDetailsCell item={paymentMethod} />)

      expect(screen.getByText('card')).toBeInTheDocument()
      expect(screen.getByText('visa')).toBeInTheDocument()
      expect(screen.getByText(`${OBFUSCATED_LAST4_PREFIX} 4242`)).toBeInTheDocument()
    })

    it('THEN displays expiration date chip when expiration month and year are present', () => {
      const paymentMethod = createMockPaymentMethod({
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expirationMonth: '12',
          expirationYear: '2025',
        },
      })

      render(<PaymentMethodDetailsCell item={paymentMethod} />)

      expect(screen.getByText(/12\/2025/)).toBeInTheDocument()
    })

    it('THEN displays default badge when payment method is default', () => {
      const paymentMethod = createMockPaymentMethod({
        isDefault: true,
      })

      render(<PaymentMethodDetailsCell item={paymentMethod} />)

      const defaultBadge = screen.getByTestId(DEFAULT_BADGE_TEST_ID)

      expect(defaultBadge).toBeInTheDocument()
    })

    it('THEN displays payment provider type and code when both are present', () => {
      const paymentMethod = createMockPaymentMethod({
        paymentProviderType: ProviderTypeEnum.Stripe,
        paymentProviderCode: 'stripe_prod',
      })

      render(<PaymentMethodDetailsCell item={paymentMethod} />)

      expect(screen.getByText('stripe_prod')).toBeInTheDocument()
    })
  })
})
