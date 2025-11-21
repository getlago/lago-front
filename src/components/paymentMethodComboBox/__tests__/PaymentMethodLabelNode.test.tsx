import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { PaymentMethodLabelNode } from '../../paymentMethodComboBox/PaymentMethodLabelNode'

describe('PaymentMethodLabelNode', () => {
  describe('WHEN rendering with headerText only', () => {
    it('THEN displays headerText', () => {
      render(<PaymentMethodLabelNode headerText="Card - Visa" />)

      expect(screen.getByText('Card - Visa')).toBeInTheDocument()
    })
  })

  describe('WHEN rendering with headerText and footerText', () => {
    it('THEN displays both headerText and footerText', () => {
      render(<PaymentMethodLabelNode headerText="Card - Visa" footerText="Stripe • stripe" />)

      expect(screen.getByText('Card - Visa')).toBeInTheDocument()
      expect(screen.getByText('Stripe • stripe')).toBeInTheDocument()
    })
  })
})
