import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { generatePath } from 'react-router-dom'

import {
  CLOSE_CREATE_WALLET_BUTTON_DATA_TEST,
  SUBMIT_WALLET_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import {
  CREATE_WALLET_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  EDIT_WALLET_ROUTE,
  WALLET_DETAILS_ROUTE,
} from '~/core/router'
import { CurrencyEnum } from '~/generated/graphql'
import CreateWallet from '~/pages/wallet/CreateWallet'
import { WalletDetailsTabsOptionsEnum } from '~/pages/wallet/WalletDetails'
import { render } from '~/test-utils'

const mockGoBack = jest.fn()
const mockDialogOpen = jest.fn()
const mockCreateWallet = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockUpdateWallet = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockOpenRuleDrawer = jest.fn()

let mockWalletData: unknown = undefined
let mockWalletLoading = false
let mockLocationState: Record<string, unknown> | null = null

// The drawer stack relies on import.meta (unsupported in jest)
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    customerId: 'customer-id',
    walletId: mockWalletData || mockWalletLoading ? 'wallet-id' : '',
  }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  // The intent flag (auto-open rule drawer) travels through router state
  useLocation: () => ({
    pathname: '/',
    strippedPathname: '/',
    state: mockLocationState,
  }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: mockGoBack,
    onRouteEnter: jest.fn(),
  }),
}))

// Stub the rule drawer hook so the auto-open wiring (location.state →
// autoOpenRuleDrawer → effect) can be asserted end-to-end at the page level
jest.mock('~/pages/wallet/components/RecurringRuleDrawer', () => {
  const actual = jest.requireActual('~/pages/wallet/components/RecurringRuleDrawer')

  return {
    ...actual,
    useRecurringRuleDrawer: () => ({ openDrawer: mockOpenRuleDrawer }),
  }
})

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'USD' },
    hasFeatureFlag: () => false,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/components/billingEntity/BillingEntityFormPicker', () => ({
  BillingEntityFormPicker: () => <div data-test="billing-entity-form-picker-stub" />,
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerInfosForWalletFormQuery: () => ({
    data: {
      customer: {
        id: 'customer-id',
        externalId: 'ext-1',
        currency: 'USD',
        timezone: null,
        billingEntity: { id: 'be-1' },
      },
    },
    loading: false,
  }),
  useGetWalletInfosForWalletFormQuery: () => ({
    data: mockWalletData ? { wallet: mockWalletData } : undefined,
    loading: mockWalletLoading,
  }),
  useCreateCustomerWalletMutation: () => [mockCreateWallet],
  useUpdateCustomerWalletMutation: () => [mockUpdateWallet],
  useGetBillableMetricsForWalletLazyQuery: () => [jest.fn(), { loading: false, data: undefined }],
}))

const queryInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

describe('CreateWallet', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletData = undefined
    mockWalletLoading = false
    mockLocationState = null
  })

  describe('GIVEN the creation mode', () => {
    describe('WHEN submitting with the default values', () => {
      it('THEN should call the create mutation with the serialized input', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        // code is required — typing a name auto-generates it
        await user.type(queryInput('name'), 'My wallet')
        await user.click(screen.getByTestId(SUBMIT_WALLET_DATA_TEST))

        await waitFor(() => {
          expect(mockCreateWallet).toHaveBeenCalledWith({
            variables: {
              input: expect.objectContaining({
                customerId: 'customer-id',
                name: 'My wallet',
                code: 'my_wallet',
                currency: CurrencyEnum.Usd,
                rateAmount: '1.00',
                paidCredits: '0',
                grantedCredits: '0',
                priority: 50,
                billingEntityId: 'be-1',
                appliesTo: { feeTypes: [], billableMetricIds: [] },
                recurringTransactionRules: [],
              }),
            },
          })
        })
        // Creation has no walletId → return through history with the customer
        // wallet-tab fallback, never landing back on the form routes
        expect(mockGoBack).toHaveBeenCalledWith(
          generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
            customerId: 'customer-id',
            tab: CustomerDetailsTabsOptions.wallet,
          }),
          { exclude: [CREATE_WALLET_ROUTE, EDIT_WALLET_ROUTE] },
        )
      })
    })

    describe('WHEN submitting without a code', () => {
      it('THEN should block the submission and not call the mutation', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        await user.click(screen.getByTestId(SUBMIT_WALLET_DATA_TEST))

        await waitFor(() => {
          expect(mockCreateWallet).not.toHaveBeenCalled()
        })
        expect(mockGoBack).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting with an empty rate amount', () => {
      it('THEN should block the submission and not call the mutation', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        await user.clear(queryInput('rateAmount'))
        await user.click(screen.getByTestId(SUBMIT_WALLET_DATA_TEST))

        await waitFor(() => {
          expect(document.querySelector('[data-test="text-field-error"]')).toBeInTheDocument()
        })
        expect(mockCreateWallet).not.toHaveBeenCalled()
        expect(mockGoBack).not.toHaveBeenCalled()
      })
    })

    describe('WHEN closing with unsaved changes', () => {
      it('THEN should open the dirty warning dialog', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        await user.type(queryInput('name'), 'My wallet')
        await user.click(screen.getByTestId(CLOSE_CREATE_WALLET_BUTTON_DATA_TEST))

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
        expect(mockGoBack).not.toHaveBeenCalled()
      })
    })

    describe('WHEN closing without changes', () => {
      it('THEN should return through history without a warning', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        await user.click(screen.getByTestId(CLOSE_CREATE_WALLET_BUTTON_DATA_TEST))

        expect(mockDialogOpen).not.toHaveBeenCalled()
        expect(mockGoBack).toHaveBeenCalledWith(expect.any(String), {
          exclude: [CREATE_WALLET_ROUTE, EDIT_WALLET_ROUTE],
        })
      })
    })
  })

  describe('GIVEN the edition mode', () => {
    beforeEach(() => {
      mockWalletData = {
        id: 'wallet-id',
        billingEntityId: 'be-wallet',
        currency: 'USD',
        expirationAt: null,
        name: 'Existing wallet',
        code: 'abc',
        rateAmount: '2',
        invoiceRequiresSuccessfulPayment: false,
        paidTopUpMinAmountCents: null,
        paidTopUpMaxAmountCents: null,
        priority: 10,
        paymentMethodType: null,
        paymentMethod: null,
        skipInvoiceCustomSections: false,
        selectedInvoiceCustomSections: [],
        appliesTo: { feeTypes: [], billableMetrics: [] },
        recurringTransactionRules: [],
      }
    })

    describe('WHEN the form renders', () => {
      it('THEN should prefill and disable the rate amount', () => {
        render(<CreateWallet />)

        const rateInput = queryInput('rateAmount')

        expect(rateInput).toHaveValue('2.00')
        expect(rateInput).toBeDisabled()
      })

      it('THEN should prefill the wallet name and code', () => {
        render(<CreateWallet />)

        expect(queryInput('name')).toHaveValue('Existing wallet')
        expect(queryInput('code')).toHaveValue('abc')
      })

      it('THEN should prefill when the wallet arrives asynchronously', async () => {
        // mirror the real page: skeleton while the query is in flight,
        // wallet data landing on a later render — under StrictMode like the app
        const walletData = mockWalletData

        mockWalletData = undefined
        mockWalletLoading = true

        const { rerender } = render(
          <StrictMode>
            <CreateWallet />
          </StrictMode>,
        )

        expect(queryInput('code')).toBeNull()

        mockWalletData = walletData
        mockWalletLoading = false
        rerender(
          <StrictMode>
            <CreateWallet />
          </StrictMode>,
        )

        await waitFor(() => {
          expect(queryInput('code')).toHaveValue('abc')
        })
        expect(queryInput('name')).toHaveValue('Existing wallet')
        expect(queryInput('rateAmount')).toHaveValue('2.00')
      })
    })

    describe('WHEN submitting', () => {
      it('THEN should call the update mutation without create-only fields', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        await user.click(screen.getByTestId(SUBMIT_WALLET_DATA_TEST))

        await waitFor(() => {
          expect(mockUpdateWallet).toHaveBeenCalledWith({
            variables: {
              input: expect.objectContaining({
                id: 'wallet-id',
                priority: 10,
                // cleared min/max are sent as explicit nulls on update
                paidTopUpMinAmountCents: null,
                paidTopUpMaxAmountCents: null,
              }),
            },
          })
        })

        const input = (
          mockUpdateWallet.mock.calls[0] as unknown as [
            { variables: { input: Record<string, unknown> } },
          ]
        )[0].variables.input

        expect(input).not.toHaveProperty('currency')
        expect(input).not.toHaveProperty('rateAmount')
        expect(input).not.toHaveProperty('customerId')
        expect(input).not.toHaveProperty('transactionName')
        expect(input).not.toHaveProperty('ignorePaidTopUpLimitsOnCreation')
      })

      it('THEN should return through history with the wallet overview fallback', async () => {
        const user = userEvent.setup()

        render(<CreateWallet />)

        await user.click(screen.getByTestId(SUBMIT_WALLET_DATA_TEST))

        await waitFor(() => {
          expect(mockGoBack).toHaveBeenCalledWith(
            generatePath(WALLET_DETAILS_ROUTE, {
              walletId: 'wallet-id',
              customerId: 'customer-id',
              tab: WalletDetailsTabsOptionsEnum.overview,
            }),
            { exclude: [CREATE_WALLET_ROUTE, EDIT_WALLET_ROUTE] },
          )
        })
      })
    })

    describe('WHEN entered from the details-tab Edit (auto-open intent flag)', () => {
      beforeEach(() => {
        mockLocationState = { openRecurringRuleDrawer: true }
      })

      it('THEN should auto-open the rule drawer once the wallet is loaded', async () => {
        render(<CreateWallet />)

        await waitFor(() => {
          expect(mockOpenRuleDrawer).toHaveBeenCalledTimes(1)
        })
      })

      it('THEN should not open the drawer while the wallet query is in flight', () => {
        mockWalletData = undefined
        mockWalletLoading = true

        render(<CreateWallet />)

        expect(mockOpenRuleDrawer).not.toHaveBeenCalled()
      })
    })

    describe('WHEN entered without the auto-open intent flag', () => {
      it('THEN should not open the rule drawer on its own', () => {
        render(<CreateWallet />)

        expect(mockOpenRuleDrawer).not.toHaveBeenCalled()
      })
    })
  })
})
