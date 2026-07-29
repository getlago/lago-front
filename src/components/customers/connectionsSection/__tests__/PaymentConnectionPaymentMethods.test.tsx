import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LinkedPaymentProvider } from '~/components/customers/types'
import { CustomerDetailsFragment, ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ADD_PAYMENT_METHOD_TEST_ID,
  INELIGIBLE_PAYMENT_METHODS_TEST_ID,
  PAYMENT_METHODS_LIST_TEST_ID,
} from '../constants'
import { PaymentConnectionPaymentMethods } from '../PaymentConnectionPaymentMethods'

const mockOpenAddPaymentMethodDialog = jest.fn()

jest.mock('~/components/customers/useAddPaymentMethodDialog', () => ({
  useAddPaymentMethodDialog: () => ({
    openAddPaymentMethodDialog: mockOpenAddPaymentMethodDialog,
  }),
}))

jest.mock('~/components/paymentMethodsList/PaymentMethodList', () => ({
  PaymentMethodsList: () => <div data-test="mock-payment-methods-list" />,
}))

const LINKED_PROVIDER = {
  __typename: 'StripeProvider',
  id: 'stripe-id',
  name: 'Stripe EU',
  code: 'stripe-eu',
} as unknown as LinkedPaymentProvider

const buildCustomer = (
  providerPaymentMethods: ProviderPaymentMethodsEnum[],
): CustomerDetailsFragment =>
  ({
    id: 'cust-1',
    externalId: 'ext-1',
    providerCustomer: {
      id: 'pc-1',
      providerCustomerId: 'cus_123',
      providerPaymentMethods,
    },
  }) as unknown as CustomerDetailsFragment

describe('PaymentConnectionPaymentMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a connection with eligible payment methods', () => {
    describe('WHEN the block renders', () => {
      it('THEN should show the payment methods list', () => {
        render(
          <PaymentConnectionPaymentMethods
            customer={buildCustomer([ProviderPaymentMethodsEnum.Card])}
            linkedPaymentProvider={LINKED_PROVIDER}
          />,
        )

        expect(screen.getByTestId(PAYMENT_METHODS_LIST_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking "Add a payment method"', () => {
      it('THEN should open the dialog scoped to the selected connection', async () => {
        const user = userEvent.setup()

        render(
          <PaymentConnectionPaymentMethods
            customer={buildCustomer([ProviderPaymentMethodsEnum.Card])}
            linkedPaymentProvider={LINKED_PROVIDER}
          />,
        )

        await user.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

        expect(mockOpenAddPaymentMethodDialog).toHaveBeenCalledWith({
          customerId: 'cust-1',
          linkedPaymentProvider: expect.objectContaining({ code: 'stripe-eu' }),
        })
      })
    })
  })

  describe('GIVEN a connection with only ineligible payment methods', () => {
    describe('WHEN the block renders', () => {
      it('THEN should disable the add action and show the explainer instead of the list', () => {
        render(
          <PaymentConnectionPaymentMethods
            customer={buildCustomer([
              ProviderPaymentMethodsEnum.CustomerBalance,
              ProviderPaymentMethodsEnum.Crypto,
            ])}
            linkedPaymentProvider={LINKED_PROVIDER}
          />,
        )

        expect(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(PAYMENT_METHODS_LIST_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
