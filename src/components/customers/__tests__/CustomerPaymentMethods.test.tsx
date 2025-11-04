import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  ADD_PAYMENT_METHOD_TEST_ID,
  CANCEL_DIALOG_BUTTON_TEST_ID,
  CHECKOUT_URL_TEXT_TEST_ID,
  CustomerPaymentMethods,
  EMPTY_STATE_TEST_ID,
  ERROR_ALERT_TEST_ID,
  GENERATE_CHECKOUT_URL_BUTTON_TEST_ID,
  INELIGIBLE_PAYMENT_METHODS_TEST_ID,
} from '~/components/customers/CustomerPaymentMethods'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { createMockCustomerDetails } from './factories/CustomerDetails.factory'
import { createMockLinkedPaymentProvider } from './factories/LinkedPaymentProvider.factory'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

const linkedPaymentProvider = createMockLinkedPaymentProvider({
  __typename: 'StripeProvider',
  id: 'provider_001',
  name: 'Stripe',
  code: 'stripe',
})

const mockGenerateCheckoutUrlMutation = jest.fn()
const mockMutationState: {
  data: { generateCheckoutUrl: { checkoutUrl: string } } | null
  loading: boolean
  error: Error | null
} = {
  data: null,
  loading: false,
  error: null,
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGenerateCheckoutUrlMutation: jest.fn(() => [
    mockGenerateCheckoutUrlMutation,
    mockMutationState,
  ]),
}))

describe('CustomerPaymentMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutationState.data = null
    mockMutationState.loading = false
    mockMutationState.error = null
  })

  describe('WHEN checking customer payment methods eligibility', () => {
    it('THEN enable add-payment-method button when methods are NOT only Crypto or CustomerBalance', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
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

    it('THEN disables add-payment-method button when methods are only Crypto or CustomerBalance', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
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

    it('THEN enable add-payment-method button when methods include Crypto or CustomerBalance with other methods', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
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

    it('THEN shows the empty state text when there are no available payment methods', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
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

  describe('WHEN opening dialog and selecting payment provider', () => {
    it('THEN opens dialog when clicking add payment method button', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
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

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })
    })

    it('THEN pre-selects payment provider when only one is available', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
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

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        const comboBox = screen.getByRole('combobox')

        expect(comboBox).toHaveValue('Stripe')
        expect(comboBox).toBeDisabled()
      })
    })
  })

  describe('WHEN generating checkout URL', () => {
    it('THEN calls mutation and displays checkout URL on success', async () => {
      const checkoutUrl = 'https://checkout.example.com/abc123'
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      mockMutationState.data = {
        generateCheckoutUrl: {
          checkoutUrl,
        },
      }
      mockMutationState.loading = false
      mockMutationState.error = null

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const generateButton = screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)

      await userEvent.click(generateButton)

      await waitFor(() => {
        expect(mockGenerateCheckoutUrlMutation).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText(checkoutUrl)).toBeInTheDocument()
      })
    })

    it('THEN shows loading state while generating checkout URL', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      mockMutationState.data = null
      mockMutationState.loading = true
      mockMutationState.error = null

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const generateButton = screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)

      await userEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.queryByTestId(CHECKOUT_URL_TEXT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('THEN copies checkout URL to clipboard when clicking on it', async () => {
      const checkoutUrl = 'https://checkout.example.com/abc123'
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      mockMutationState.data = {
        generateCheckoutUrl: {
          checkoutUrl,
        },
      }
      mockMutationState.loading = false
      mockMutationState.error = null

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const generateButton = screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)

      await userEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId(CHECKOUT_URL_TEXT_TEST_ID)).toBeInTheDocument()
      })

      const checkoutUrlElement = screen.getByTestId(CHECKOUT_URL_TEXT_TEST_ID)

      await userEvent.click(checkoutUrlElement)

      await waitFor(() => {
        expect(copyToClipboard).toHaveBeenCalledWith(checkoutUrl)
        expect(addToast).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN handling errors', () => {
    it('THEN shows error alert when mutation fails', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      const mockError = new Error('Failed to generate checkout URL')

      mockMutationState.data = null
      mockMutationState.loading = false
      mockMutationState.error = mockError

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const generateButton = screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)

      await userEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId(ERROR_ALERT_TEST_ID)).toBeInTheDocument()
      })
    })

    it('THEN resets error when dialog is closed', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      const mockError = new Error('Failed to generate checkout URL')

      mockMutationState.data = null
      mockMutationState.loading = false
      mockMutationState.error = mockError

      await act(() =>
        render(
          <CustomerPaymentMethods
            customer={customer}
            linkedPaymentProvider={linkedPaymentProvider}
          />,
        ),
      )

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const generateButton = screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)

      await userEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId(ERROR_ALERT_TEST_ID)).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId(CANCEL_DIALOG_BUTTON_TEST_ID)

      await userEvent.click(cancelButton)

      mockMutationState.error = null

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.queryByTestId(ERROR_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('THEN disables generate button when no payment provider is selected', async () => {
      const customer = createMockCustomerDetails({
        providerCustomer: {
          __typename: 'ProviderCustomer' as const,
          id: 'prov_cust_001',
          providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
        },
      })

      mockMutationState.data = null
      mockMutationState.loading = false
      mockMutationState.error = null

      await act(() =>
        render(<CustomerPaymentMethods customer={customer} linkedPaymentProvider={undefined} />),
      )

      const addButton = screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const generateButton = screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)

      expect(generateButton).toBeDisabled()
    })
  })
})
