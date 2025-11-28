import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { PaymentMethodDetails } from '../PaymentMethodDetails'

describe('PaymentMethodDetails', () => {
  it('THEN displays formatted payment method details with all optional chips', () => {
    const details = {
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expirationMonth: '12',
      expirationYear: '2025',
    }

    render(<PaymentMethodDetails details={details} isDefault data-test="default-chip" />)

    expect(screen.getByText('Card - Visa •••• 4242')).toBeInTheDocument()
    expect(screen.getByText(/12\/2025/)).toBeInTheDocument()
    expect(screen.getByTestId('default-chip')).toBeInTheDocument()
  })

  it('THEN displays only formatted details when optional props are not provided', () => {
    const details = {
      type: 'card',
      brand: 'visa',
      last4: '4242',
    }

    render(<PaymentMethodDetails details={details} />)

    expect(screen.getByText('Card - Visa •••• 4242')).toBeInTheDocument()
    expect(screen.queryByText('Exp')).not.toBeInTheDocument()
    expect(screen.queryByText('Default')).not.toBeInTheDocument()
  })

  it('THEN returns null when details cannot be formatted', () => {
    const { container: container1 } = render(<PaymentMethodDetails details={null} />)

    expect(container1.firstChild).toBeNull()

    const { container: container2 } = render(<PaymentMethodDetails />)

    expect(container2.firstChild).toBeNull()

    const details = {
      type: null,
      brand: null,
      last4: null,
    }
    const { container: container3 } = render(<PaymentMethodDetails details={details} />)

    expect(container3.firstChild).toBeNull()
  })
})
