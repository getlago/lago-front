import { screen } from '@testing-library/react'
import { FormikProps } from 'formik'

import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'
import { render } from '~/test-utils'

import { PaymentMethodsInvoiceSettings } from '../PaymentMethodsInvoiceSettings'

jest.mock('~/components/paymentMethodComboBox/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: () => <div>PaymentMethodComboBox</div>,
}))

const mockFormikProps = {
  values: {
    paymentMethod: undefined,
  },
  setFieldValue: jest.fn(),
} as unknown as FormikProps<SubscriptionFormInput>

describe('PaymentMethodsInvoiceSettings', () => {
  describe('WHEN customer is null or undefined', () => {
    it('THEN returns null and does not render anything', () => {
      const { container } = render(
        <PaymentMethodsInvoiceSettings customer={null} formikProps={mockFormikProps} />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN customer.externalId is null or undefined', () => {
    it('THEN returns null when externalId is null', () => {
      const customer = {
        externalId: null,
      } as unknown as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings customer={customer} formikProps={mockFormikProps} />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN customer.id is null or undefined', () => {
    it('THEN returns null when id is null', () => {
      const customer = {
        id: null,
      } as unknown as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings customer={customer} formikProps={mockFormikProps} />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN customer, customerId and externalId are valid', () => {
    it('THEN renders the component with PaymentMethodComboBox', () => {
      const customer = {
        id: 'customer_id_123',
        externalId: 'customer_ext_123',
      } as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings customer={customer} formikProps={mockFormikProps} />,
      )

      expect(container.firstChild).not.toBeNull()
      expect(screen.getByText('PaymentMethodComboBox')).toBeInTheDocument()
    })
  })
})
