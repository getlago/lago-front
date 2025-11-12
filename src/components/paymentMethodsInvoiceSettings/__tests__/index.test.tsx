import { screen } from '@testing-library/react'

import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PaymentMethodsInvoiceSettings } from '../index'

jest.mock('~/components/paymentMethodComboBox', () => ({
  PaymentMethodComboBox: () => <div>PaymentMethodComboBox</div>,
}))

describe('PaymentMethodsInvoiceSettings', () => {
  describe('WHEN customer is null or undefined', () => {
    it('THEN returns null and does not render anything', () => {
      const { container } = render(<PaymentMethodsInvoiceSettings customer={null} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN customer.externalId is null or undefined', () => {
    it('THEN returns null when externalId is null', () => {
      const customer = {
        externalId: null,
      } as unknown as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(<PaymentMethodsInvoiceSettings customer={customer} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN customer and externalId are valid', () => {
    it('THEN renders the component with PaymentMethodComboBox', () => {
      const customer = {
        externalId: 'customer_ext_123',
      } as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(<PaymentMethodsInvoiceSettings customer={customer} />)

      expect(container.firstChild).not.toBeNull()
      expect(screen.getByText('PaymentMethodComboBox')).toBeInTheDocument()
    })
  })
})
