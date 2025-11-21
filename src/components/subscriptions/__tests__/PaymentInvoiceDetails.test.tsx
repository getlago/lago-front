import { screen } from '@testing-library/react'

import { GetSubscriptionForDetailsOverviewQuery, PaymentMethodTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PAYMENT_METHOD_TYPE, PaymentInvoiceDetails } from '../PaymentInvoiceDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

type PaymentMethod = NonNullable<
  GetSubscriptionForDetailsOverviewQuery['subscription']
>['paymentMethod']

describe('PaymentInvoiceDetails', () => {
  describe('WHEN paymentMethod or details are not provided', () => {
    it('THEN returns null when paymentMethodType is Provider', () => {
      const { container } = render(
        <PaymentInvoiceDetails
          paymentMethod={undefined}
          paymentMethodType={PaymentMethodTypeEnum.Provider}
        />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN paymentMethodType is Provider', () => {
    it('THEN renders formatted payment method details when present and not deleted', () => {
      const paymentMethod: PaymentMethod = {
        __typename: 'PaymentMethod',
        id: 'payment-method-id',
        deletedAt: null,
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expirationMonth: null,
          expirationYear: null,
        },
      }

      render(
        <PaymentInvoiceDetails
          paymentMethod={paymentMethod}
          paymentMethodType={PaymentMethodTypeEnum.Provider}
        />,
      )

      expect(
        screen.getByTestId(PAYMENT_METHOD_TYPE(PaymentMethodTypeEnum.Provider)),
      ).toBeInTheDocument()
    })

    it('THEN does not render payment method details when deletedAt is present', () => {
      const paymentMethod: PaymentMethod = {
        __typename: 'PaymentMethod',
        id: 'payment-method-id',
        deletedAt: '2024-01-01T00:00:00Z',
        details: {
          __typename: 'PaymentMethodDetails',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expirationMonth: null,
          expirationYear: null,
        },
      }

      render(
        <PaymentInvoiceDetails
          paymentMethod={paymentMethod}
          paymentMethodType={PaymentMethodTypeEnum.Provider}
        />,
      )

      expect(
        screen.queryByTestId(PAYMENT_METHOD_TYPE(PaymentMethodTypeEnum.Provider)),
      ).not.toBeInTheDocument()
    })
  })

  describe('WHEN paymentMethodType is Manual', () => {
    it('THEN renders manual payment method type', () => {
      render(
        <PaymentInvoiceDetails
          paymentMethod={undefined}
          paymentMethodType={PaymentMethodTypeEnum.Manual}
        />,
      )

      expect(
        screen.getByTestId(PAYMENT_METHOD_TYPE(PaymentMethodTypeEnum.Manual)),
      ).toBeInTheDocument()
    })
  })
})
