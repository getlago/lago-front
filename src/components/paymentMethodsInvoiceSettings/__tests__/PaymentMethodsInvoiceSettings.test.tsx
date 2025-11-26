import { FormikProps } from 'formik'

import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'
import { render } from '~/test-utils'

import { PaymentMethodsInvoiceSettings } from '../PaymentMethodsInvoiceSettings'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

jest.mock('~/components/paymentMethodComboBox/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: jest.fn(() => <div data-testid="payment-method-combobox" />),
}))

jest.mock('~/components/invoceCustomFooter/InvoceCustomFooter', () => ({
  InvoceCustomFooter: jest.fn(() => <div data-testid="invoice-custom-footer" />),
}))

const mockFormikProps = {
  values: {
    paymentMethod: undefined,
  },
  setFieldValue: jest.fn(),
} as unknown as FormikProps<SubscriptionFormInput>

describe('PaymentMethodsInvoiceSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WHEN customer is null or undefined', () => {
    it('THEN returns null and does not render anything', () => {
      const { container } = render(
        <PaymentMethodsInvoiceSettings
          customer={null}
          formikProps={mockFormikProps}
          viewType="subscription"
        />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN both customer.id and customer.externalId are null or undefined', () => {
    it('THEN returns null when both id and externalId are null', () => {
      const customer = {
        id: null,
        externalId: null,
      } as unknown as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings
          customer={customer}
          formikProps={mockFormikProps}
          viewType="subscription"
        />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN customer has valid id and externalId', () => {
    it('THEN renders both PaymentMethodComboBox and InvoceCustomFooter', () => {
      const customer = {
        id: 'customer_id_123',
        externalId: 'customer_ext_123',
      } as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings
          customer={customer}
          formikProps={mockFormikProps}
          viewType="subscription"
        />,
      )

      expect(container.querySelector('[data-testid="payment-method-combobox"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="invoice-custom-footer"]')).toBeInTheDocument()
    })
  })

  describe('WHEN customer has only externalId', () => {
    it('THEN renders only PaymentMethodComboBox', () => {
      const customer = {
        id: null,
        externalId: 'customer_ext_123',
      } as unknown as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings
          customer={customer}
          formikProps={mockFormikProps}
          viewType="subscription"
        />,
      )

      expect(container.querySelector('[data-testid="payment-method-combobox"]')).toBeInTheDocument()
      expect(
        container.querySelector('[data-testid="invoice-custom-footer"]'),
      ).not.toBeInTheDocument()
    })
  })

  describe('WHEN customer has only id', () => {
    it('THEN renders only InvoceCustomFooter', () => {
      const customer = {
        id: 'customer_id_123',
        externalId: null,
      } as unknown as GetCustomerForCreateSubscriptionQuery['customer']

      const { container } = render(
        <PaymentMethodsInvoiceSettings
          customer={customer}
          formikProps={mockFormikProps}
          viewType="subscription"
        />,
      )

      expect(
        container.querySelector('[data-testid="payment-method-combobox"]'),
      ).not.toBeInTheDocument()
      expect(container.querySelector('[data-testid="invoice-custom-footer"]')).toBeInTheDocument()
    })
  })
})
