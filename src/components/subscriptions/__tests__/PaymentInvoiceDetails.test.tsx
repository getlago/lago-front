import { screen } from '@testing-library/react'

import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { render } from '~/test-utils'

import {
  INHERITED_BADGE_TEST_ID,
  INVOICE_CUSTOM_FOOTER_SECTION,
  MANUAL_PAYMENT_METHOD_TEST_ID,
  PaymentInvoiceDetails,
} from '../PaymentInvoiceDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/customer/usePaymentMethodsList', () => ({
  usePaymentMethodsList: jest.fn(() => ({
    data: [],
    loading: false,
    error: false,
  })),
}))

jest.mock('~/hooks/useCustomerInvoiceCustomSections', () => ({
  useCustomerInvoiceCustomSections: jest.fn(() => ({
    data: null,
    loading: false,
    error: false,
    customer: null,
  })),
}))

const { usePaymentMethodsList } = jest.requireMock('~/hooks/customer/usePaymentMethodsList')
const { useCustomerInvoiceCustomSections } = jest.requireMock(
  '~/hooks/useCustomerInvoiceCustomSections',
)

describe('PaymentInvoiceDetails', () => {
  beforeEach(() => {
    ;(usePaymentMethodsList as jest.Mock).mockReturnValue({
      data: [],
      loading: false,
      error: false,
    })
    ;(useCustomerInvoiceCustomSections as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: false,
      customer: null,
    })
  })

  describe('WHEN paymentMethod or details are not provided', () => {
    it('THEN shows manual payment method as fallback when paymentMethodType is Provider and no default exists', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      render(<PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />)

      expect(screen.getByTestId(MANUAL_PAYMENT_METHOD_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('WHEN paymentMethodType is Provider', () => {
    it('THEN renders formatted payment method details when present and not deleted', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: 'payment-method-id',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      const mockPaymentMethodInList = createMockPaymentMethod({
        id: 'payment-method-id',
        details: {
          __typename: 'PaymentMethodDetails',
          brand: 'visa',
          last4: '4242',
          type: 'card',
          expirationMonth: null,
          expirationYear: null,
        },
      })

      ;(usePaymentMethodsList as jest.Mock).mockReturnValue({
        data: [mockPaymentMethodInList],
        loading: false,
        error: false,
      })

      render(<PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />)

      // Verify the payment method details are displayed (formatted string)
      expect(screen.getByText(/Card - Visa •••• 4242/i)).toBeInTheDocument()
    })

    it('THEN shows manual payment method as fallback when paymentMethodId points to deleted payment method and no default exists', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: 'deleted-payment-method-id',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      render(<PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />)

      expect(screen.getByTestId(MANUAL_PAYMENT_METHOD_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('WHEN paymentMethodType is Manual', () => {
    it('THEN renders manual payment method type', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Manual,
      }

      render(<PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />)

      expect(screen.getByTestId(MANUAL_PAYMENT_METHOD_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('WHEN payment method is inherited from customer', () => {
    it('THEN shows inherited badge when using default payment method', () => {
      const defaultPaymentMethod = createMockPaymentMethod({
        id: 'default-pm-id',
        isDefault: true,
        details: {
          __typename: 'PaymentMethodDetails',
          brand: 'visa',
          last4: '4242',
          type: 'card',
          expirationMonth: null,
          expirationYear: null,
        },
      })

      ;(usePaymentMethodsList as jest.Mock).mockReturnValue({
        data: [defaultPaymentMethod],
        loading: false,
        error: false,
      })

      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      render(
        <PaymentInvoiceDetails
          selectedPaymentMethod={selectedPaymentMethod}
          externalCustomerId="customer-external-id"
        />,
      )

      // Verify the default payment method details are displayed
      expect(screen.getByText(/Card - Visa •••• 4242/i)).toBeInTheDocument()
      expect(screen.getByTestId(INHERITED_BADGE_TEST_ID)).toBeInTheDocument()
    })

    it('THEN shows inherited badge when manual is inherited', () => {
      ;(usePaymentMethodsList as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: false,
      })

      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      render(
        <PaymentInvoiceDetails
          selectedPaymentMethod={selectedPaymentMethod}
          externalCustomerId="customer-external-id"
        />,
      )

      expect(screen.getByTestId(MANUAL_PAYMENT_METHOD_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(INHERITED_BADGE_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Invoice Custom Section display', () => {
    it('displays ICS section when subscription has explicit sections selected (APPLY)', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Manual,
      }

      render(
        <PaymentInvoiceDetails
          selectedPaymentMethod={selectedPaymentMethod}
          customerId="customer-id"
          selectedInvoiceCustomSections={[{ id: 'section-1', name: 'Bank details' }]}
          skipInvoiceCustomSections={false}
        />,
      )

      expect(screen.getByTestId(INVOICE_CUSTOM_FOOTER_SECTION)).toBeInTheDocument()
      expect(screen.getByText('Bank details')).toBeInTheDocument()
    })

    it('displays skip message when subscription explicitly skips ICS (NONE)', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Manual,
      }

      render(
        <PaymentInvoiceDetails
          selectedPaymentMethod={selectedPaymentMethod}
          customerId="customer-id"
          selectedInvoiceCustomSections={[]}
          skipInvoiceCustomSections={true}
        />,
      )

      expect(screen.getByTestId(INVOICE_CUSTOM_FOOTER_SECTION)).toBeInTheDocument()
    })

    it('displays fallback_billing_entity sections when customer has no overwritten selection', () => {
      ;(useCustomerInvoiceCustomSections as jest.Mock).mockReturnValue({
        data: {
          customerId: 'customer-id',
          externalId: 'customer-external-id',
          configurableInvoiceCustomSections: [
            { id: 'section-1', name: 'Bank details' },
            { id: 'section-2', name: 'Legal terms' },
          ],
          hasOverwrittenInvoiceCustomSectionsSelection: false,
          skipInvoiceCustomSections: false,
        },
        loading: false,
        error: false,
        customer: null,
      })

      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Manual,
      }

      render(
        <PaymentInvoiceDetails
          selectedPaymentMethod={selectedPaymentMethod}
          customerId="customer-id"
          selectedInvoiceCustomSections={[]}
          skipInvoiceCustomSections={false}
        />,
      )

      expect(screen.getByTestId(INVOICE_CUSTOM_FOOTER_SECTION)).toBeInTheDocument()
      expect(screen.getByText('Bank details')).toBeInTheDocument()
      expect(screen.getByText('Legal terms')).toBeInTheDocument()
    })

    it('does not display ICS section when no customerId and no explicit sections', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Manual,
      }

      render(
        <PaymentInvoiceDetails
          selectedPaymentMethod={selectedPaymentMethod}
          selectedInvoiceCustomSections={[]}
          skipInvoiceCustomSections={false}
        />,
      )

      expect(screen.queryByTestId(INVOICE_CUSTOM_FOOTER_SECTION)).not.toBeInTheDocument()
    })
  })
})
