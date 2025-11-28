import { screen } from '@testing-library/react'

import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { render } from '~/test-utils'

import {
  INHERITED_BADGE_TEST_ID,
  MANUAL_PAYMENT_METHOD_TEST_ID,
  PaymentInvoiceDetails,
} from '../PaymentInvoiceDetails'

const mockUsePaymentMethodsList = jest.fn(() => ({
  data: [],
  loading: false,
  error: false,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/customer/usePaymentMethodsList', () => ({
  usePaymentMethodsList: (args: unknown) => mockUsePaymentMethodsList(args),
}))

describe('PaymentInvoiceDetails', () => {
  beforeEach(() => {
    mockUsePaymentMethodsList.mockReturnValue({
      data: [],
      loading: false,
      error: false,
    })
  })

  describe('WHEN paymentMethod or details are not provided', () => {
    it('THEN shows manual payment method as fallback when paymentMethodType is Provider and no default exists', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      render(
        <PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />,
      )

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

      mockUsePaymentMethodsList.mockReturnValue({
        data: [mockPaymentMethodInList],
        loading: false,
        error: false,
      })

      render(
        <PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />,
      )

      // Verify the payment method details are displayed (formatted string)
      expect(screen.getByText(/Card - Visa •••• 4242/i)).toBeInTheDocument()
    })

    it('THEN shows manual payment method as fallback when paymentMethodId points to deleted payment method and no default exists', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: 'deleted-payment-method-id',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      render(
        <PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />,
      )

      expect(screen.getByTestId(MANUAL_PAYMENT_METHOD_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('WHEN paymentMethodType is Manual', () => {
    it('THEN renders manual payment method type', () => {
      const selectedPaymentMethod: SelectedPaymentMethod = {
        paymentMethodId: null,
        paymentMethodType: PaymentMethodTypeEnum.Manual,
      }

      render(
        <PaymentInvoiceDetails selectedPaymentMethod={selectedPaymentMethod} />,
      )

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

      mockUsePaymentMethodsList.mockReturnValue({
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
      mockUsePaymentMethodsList.mockReturnValue({
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
})
