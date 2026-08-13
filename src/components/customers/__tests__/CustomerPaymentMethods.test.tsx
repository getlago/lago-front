import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  ADD_PAYMENT_METHOD_TEST_ID,
  CustomerPaymentMethods,
  INELIGIBLE_PAYMENT_METHODS_TEST_ID,
  PAYMENT_METHODS_LIST_TEST_ID,
} from '~/components/customers/CustomerPaymentMethods'
import {
  CHECKOUT_URL_TEXT_TEST_ID,
  GENERATE_CHECKOUT_URL_BUTTON_TEST_ID,
} from '~/components/customers/paymentMethodsDataTestConstants'
import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { createMockCustomerDetails } from './factories/CustomerDetails.factory'
import { createMockLinkedPaymentProvider } from './factories/LinkedPaymentProvider.factory'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)
NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/components/paymentMethodsList/PaymentMethodList', () => ({
  PaymentMethodsList: () => <div>Payment Methods List</div>,
}))

const linkedPaymentProvider = createMockLinkedPaymentProvider({
  __typename: 'StripeProvider',
  id: 'provider_001',
  name: 'Stripe',
  code: 'stripe',
})

const mockGenerateCheckoutUrlMutation = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGenerateCheckoutUrlMutation: jest.fn(() => [mockGenerateCheckoutUrlMutation, {}]),
}))

const CUSTOMER_ID = 'customer-id'

type RenderOptions = {
  provider?: ReturnType<typeof createMockLinkedPaymentProvider> | null
  methods?: ProviderPaymentMethodsEnum[]
}

const renderComponent = async ({
  provider = linkedPaymentProvider,
  methods = [ProviderPaymentMethodsEnum.Card],
}: RenderOptions = {}) => {
  const customer = createMockCustomerDetails({
    id: CUSTOMER_ID,
    providerCustomer: {
      __typename: 'ProviderCustomer' as const,
      id: 'prov_cust_001',
      providerPaymentMethods: methods,
    },
  })

  await act(() =>
    render(
      <NiceModal.Provider>
        <CustomerPaymentMethods customer={customer} linkedPaymentProvider={provider ?? undefined} />
      </NiceModal.Provider>,
    ),
  )
}

describe('CustomerPaymentMethods', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    // NiceModal keeps open modals in module-level state that survives cleanup().
    // Purge them so leaked dialogs from one test don't bleed into the next.
    NiceModal.remove(FORM_DIALOG_NAME)
    NiceModal.remove(CENTRALIZED_DIALOG_NAME)
  })

  describe('WHEN checking customer payment methods eligibility', () => {
    it('THEN enable add-payment-method button when methods are NOT only Crypto or CustomerBalance', async () => {
      await renderComponent({
        methods: [
          ProviderPaymentMethodsEnum.Card,
          ProviderPaymentMethodsEnum.CustomerBalance,
          ProviderPaymentMethodsEnum.Crypto,
        ],
      })

      expect(screen.queryByTestId(ADD_PAYMENT_METHOD_TEST_ID)).not.toBeDisabled()
      expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(PAYMENT_METHODS_LIST_TEST_ID)).toBeInTheDocument()
    })

    it('THEN disables add-payment-method button when methods are only Crypto or CustomerBalance', async () => {
      await renderComponent({
        methods: [ProviderPaymentMethodsEnum.CustomerBalance, ProviderPaymentMethodsEnum.Crypto],
      })

      expect(screen.queryByTestId(ADD_PAYMENT_METHOD_TEST_ID)).toBeDisabled()
      expect(screen.queryByTestId(INELIGIBLE_PAYMENT_METHODS_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(PAYMENT_METHODS_LIST_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('WHEN opening dialog and selecting payment provider', () => {
    it('THEN opens dialog when clicking add payment method button', async () => {
      await renderComponent()

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })

    it('THEN pre-selects payment provider combobox option when only one is available', async () => {
      await renderComponent()

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        const comboBox = screen.getByRole('combobox')

        expect(comboBox).toHaveValue('Stripe')
        expect(comboBox).toBeDisabled()
      })
    })
  })

  describe('WHEN generating checkout URL', () => {
    it('THEN calls mutation and opens checkout URL dialog on success', async () => {
      const checkoutUrl = 'https://checkout.example.com/abc123'

      mockGenerateCheckoutUrlMutation.mockResolvedValue({
        data: { generateCheckoutUrl: { checkoutUrl } },
      })

      await renderComponent()

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await userEvent.click(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockGenerateCheckoutUrlMutation).toHaveBeenCalledWith({
          variables: { input: { customerId: CUSTOMER_ID } },
        })
      })

      await waitFor(
        () => {
          expect(screen.getByTestId(CHECKOUT_URL_TEXT_TEST_ID)).toHaveTextContent(checkoutUrl)
        },
        { timeout: 5000 },
      )
    })

    it('THEN copies checkout URL to clipboard when clicking the copy button', async () => {
      const checkoutUrl = 'https://checkout.example.com/abc123'

      mockGenerateCheckoutUrlMutation.mockResolvedValue({
        data: { generateCheckoutUrl: { checkoutUrl } },
      })

      await renderComponent()

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await userEvent.click(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID))

      await waitFor(
        () => {
          expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      await userEvent.click(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(copyToClipboard).toHaveBeenCalledWith(checkoutUrl)
        expect(addToast).toHaveBeenCalledWith({
          severity: 'info',
          translateKey: 'text_1762185015908yvajftyvcnq',
        })
      })
    })
  })

  describe('WHEN handling errors', () => {
    it('THEN keeps the dialog open and shows a toast when the mutation returns no url', async () => {
      mockGenerateCheckoutUrlMutation.mockResolvedValue({ data: { generateCheckoutUrl: null } })

      await renderComponent()

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await userEvent.click(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: 'text_1762182354095wfjiizpju0e',
        })
      })

      expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
    })

    it('THEN closes the dialog when the cancel button is clicked', async () => {
      await renderComponent()

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      await userEvent.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('THEN disables generate button when no payment provider is selected', async () => {
      await renderComponent({ provider: null })

      await userEvent.click(screen.getByTestId(ADD_PAYMENT_METHOD_TEST_ID))

      await waitFor(() => {
        expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(screen.getByTestId(GENERATE_CHECKOUT_URL_BUTTON_TEST_ID)).toBeDisabled()
    })
  })
})
