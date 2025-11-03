import { act, screen } from '@testing-library/react'

import {
  ADD_PAYMENT_METHOD_TEST_ID,
  CustomerPaymentMethods,
  EMPTY_STATE_TEST_ID,
  INELIGIBLE_PAYMENT_METHODS_TEST_ID,
} from '~/components/customers/CustomerPaymentMethods'
import { ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { createMockCustomerDetails } from './factories/CustomerDetails.factory'
import { createMockLinkedPaymentProvider } from './factories/LinkedPaymentProvider.factory'

const baseProviderCustomer = {
  __typename: 'ProviderCustomer' as const,
  id: 'prov_cust_001',
  providerCustomerId: 'ProviderCustomer',
}

const linkedPaymentProvider = createMockLinkedPaymentProvider()

describe('CustomerPaymentMethods', () => {
  describe('WHEN customer available payment methods are NOT only Crypto or CustomerBalance', () => {
    it('THEN enable add-payment-method button and shows eligible text', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          ...baseProviderCustomer,
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      expect(screen.queryByTestId(EMPTY_STATE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(ADD_PAYMENT_METHOD_TEST_ID)).not.toBeDisabled()
      expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('WHEN customer available payment methods are only Crypto or CustomerBalance, or both', () => {
    it('THEN disables add-payment-method button and shows ineligible text', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          ...baseProviderCustomer,
          providerPaymentMethods: [
            ProviderPaymentMethodsEnum.CustomerBalance,
            ProviderPaymentMethodsEnum.Crypto,
          ],
        },
      })

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      expect(screen.queryByTestId(EMPTY_STATE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(ADD_PAYMENT_METHOD_TEST_ID)).toBeDisabled()
      expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('WHEN customer available payment methods are Crypto or CustomerBalance and has other methods', () => {
    it('THEN enable add-payment-method button and shows eligible text', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          ...baseProviderCustomer,
          providerPaymentMethods: [
            ProviderPaymentMethodsEnum.Card,
            ProviderPaymentMethodsEnum.CustomerBalance,
            ProviderPaymentMethodsEnum.Crypto,
          ],
        },
      })

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      expect(screen.queryByTestId(EMPTY_STATE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(ADD_PAYMENT_METHOD_TEST_ID)).not.toBeDisabled()
      expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('WHEN there are no available payment methods', () => {
    it('THEN shows the empty state text', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          ...baseProviderCustomer,
          providerPaymentMethods: [],
        },
      })

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      expect(screen.queryByTestId(EMPTY_STATE_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(ADD_PAYMENT_METHOD_TEST_ID)).not.toBeDisabled()
      expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
