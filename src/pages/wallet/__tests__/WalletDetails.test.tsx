import { screen } from '@testing-library/react'

import { ButtonLinkBaseProps } from '~/components/designSystem/ButtonLink'
import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { MainHeaderTab } from '~/components/MainHeader/types'
import { render } from '~/test-utils'

import WalletDetails, { WalletDetailsTabsOptionsEnum } from '../WalletDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { id: 'org-1', defaultCurrency: 'USD' },
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-01' }),
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

jest.mock('~/hooks/wallet/useWalletActions', () => ({
  useWalletActions: () => ({
    actions: [],
    terminateDialogRef: { current: null },
    voidDialogRef: { current: null },
  }),
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => <div data-test="active-tab-content">Tab Content</div>,
}))

let capturedBreadcrumb: Array<{ label: string; path?: string; loading?: boolean }> | undefined
let capturedTabs: MainHeaderTab[] | undefined

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: {
      breadcrumb?: Array<{ label: string; path?: string; loading?: boolean }>
      tabs?: MainHeaderTab[]
    }) => {
      capturedBreadcrumb = props.breadcrumb
      capturedTabs = props.tabs
      return null
    },
  },
}))

// Capture the props each tab's action link receives — routerState (the
// auto-open intent flag) never reaches the DOM, so it can only be asserted here
const mockButtonLink = jest.fn()

jest.mock('~/components/designSystem/ButtonLink', () => ({
  ButtonLink: (props: ButtonLinkBaseProps) => {
    mockButtonLink(props)
    return null
  },
}))

// Mock child components that have their own queries
jest.mock('~/components/wallets/WalletAlerts', () => ({
  __esModule: true,
  default: () => <div data-test="mock-wallet-alerts" />,
}))

jest.mock('~/components/wallets/WalletInformations', () => ({
  __esModule: true,
  default: () => <div data-test="mock-wallet-informations" />,
}))

jest.mock('~/components/wallets/WalletRecurringRules', () => ({
  __esModule: true,
  default: () => <div data-test="mock-wallet-recurring-rules" />,
}))

jest.mock('~/components/wallets/WalletTransactions', () => ({
  WalletTransactions: () => <div data-test="mock-wallet-transactions" />,
}))

const mockUseGetWalletDetailsQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetWalletDetailsQuery: (...args: unknown[]) => mockUseGetWalletDetailsQuery(...args),
}))

const mockWallet = {
  id: 'wallet-1',
  code: 'wallet-code',
  name: 'Test Wallet',
  status: 'active',
  currency: 'USD',
  balanceCents: '10000',
  creditsBalance: 100,
  consumedAmountCents: '5000',
  consumedCredits: '50',
  createdAt: '2024-01-01T00:00:00Z',
  expirationAt: null,
  lastBalanceSyncAt: '2024-01-01T00:00:00Z',
  lastConsumedCreditAt: '2024-01-01T00:00:00Z',
  lastOngoingBalanceSyncAt: '2024-01-01T00:00:00Z',
  rateAmount: 1,
  terminatedAt: null,
  ongoingBalanceCents: '8000',
  creditsOngoingBalance: '80',
  priority: 1,
  paidTopUpMinAmountCents: null,
  paidTopUpMinCredits: null,
  paidTopUpMaxAmountCents: null,
  paymentMethodType: null,
  paymentMethod: null,
  selectedInvoiceCustomSections: [],
  appliesTo: null,
  recurringTransactionRules: [],
  ongoingUsageBalanceCents: '0',
  creditsOngoingUsageBalance: 0,
  traceable: true,
}

describe('WalletDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      walletId: 'wallet-1',
      customerId: 'customer-1',
    })
  })

  describe('GIVEN the wallet query errors', () => {
    describe('WHEN error is present and not loading', () => {
      it('THEN should show error placeholder', () => {
        mockUseGetWalletDetailsQuery.mockReturnValue({
          data: undefined,
          error: new Error('test error'),
          loading: false,
        })

        render(<WalletDetails />)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the wallet query succeeds', () => {
    describe('WHEN wallet data is loaded', () => {
      it('THEN should not show the error placeholder', () => {
        mockUseGetWalletDetailsQuery.mockReturnValue({
          data: { wallet: mockWallet },
          error: undefined,
          loading: false,
        })

        render(<WalletDetails />)

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should render the active tab content', () => {
        mockUseGetWalletDetailsQuery.mockReturnValue({
          data: { wallet: mockWallet },
          error: undefined,
          loading: false,
        })

        render(<WalletDetails />)

        expect(screen.getByTestId('active-tab-content')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the customer breadcrumb label', () => {
    const renderWithCustomer = (customer: Record<string, unknown> | undefined, loading = false) => {
      mockUseGetWalletDetailsQuery.mockReturnValue({
        data: loading ? undefined : { wallet: { ...mockWallet, customer } },
        error: undefined,
        loading,
      })

      render(<WalletDetails />)

      return capturedBreadcrumb?.[1]
    }

    describe('WHEN the customer has a name', () => {
      it('THEN should use the name', () => {
        const item = renderWithCustomer({
          id: 'customer-1',
          name: 'Acme Inc',
          firstname: 'John',
          lastname: 'Doe',
          externalId: 'ext-1',
        })

        expect(item?.label).toBe('Acme Inc')
        expect(item?.loading).toBe(false)
      })
    })

    describe('WHEN the customer has no name but first and last name', () => {
      it('THEN should join first and last name', () => {
        const item = renderWithCustomer({
          id: 'customer-1',
          name: null,
          firstname: 'John',
          lastname: 'Doe',
          externalId: 'ext-1',
        })

        expect(item?.label).toBe('John Doe')
      })
    })

    describe('WHEN the customer has only a first name', () => {
      it('THEN should use the first name alone', () => {
        const item = renderWithCustomer({
          id: 'customer-1',
          name: null,
          firstname: 'John',
          lastname: null,
          externalId: 'ext-1',
        })

        expect(item?.label).toBe('John')
      })
    })

    describe('WHEN the customer has neither name nor first/last name', () => {
      it('THEN should fall back to the external id', () => {
        const item = renderWithCustomer({
          id: 'customer-1',
          name: null,
          firstname: null,
          lastname: null,
          externalId: 'ext-1',
        })

        expect(item?.label).toBe('ext-1')
      })
    })

    describe('WHEN the wallet is still loading', () => {
      it('THEN should mark the breadcrumb item as loading with no label', () => {
        const item = renderWithCustomer(undefined, true)

        expect(item?.loading).toBe(true)
        expect(item?.label).toBe('')
      })
    })
  })

  describe('GIVEN the recurring rule tab', () => {
    const renderAndGetTab = (tab: WalletDetailsTabsOptionsEnum) => {
      mockUseGetWalletDetailsQuery.mockReturnValue({
        data: { wallet: mockWallet },
        error: undefined,
        loading: false,
      })

      render(<WalletDetails />)

      return capturedTabs?.find(({ link }) => link?.includes(tab))
    }

    describe('WHEN the tabs are configured', () => {
      it('THEN should expose a dedicated recurring-rule tab', () => {
        expect(renderAndGetTab(WalletDetailsTabsOptionsEnum.recurringRule)).toBeDefined()
      })
    })

    describe('WHEN its content renders', () => {
      it('THEN should show the recurring rules read view', () => {
        const tab = renderAndGetTab(WalletDetailsTabsOptionsEnum.recurringRule)

        render(<>{tab?.content}</>)

        expect(screen.getByTestId('mock-wallet-recurring-rules')).toBeInTheDocument()
      })

      it('THEN its Edit link should carry the auto-open drawer intent flag', () => {
        const tab = renderAndGetTab(WalletDetailsTabsOptionsEnum.recurringRule)

        mockButtonLink.mockClear()
        render(<>{tab?.content}</>)

        expect(mockButtonLink).toHaveBeenCalledTimes(1)
        expect(mockButtonLink).toHaveBeenCalledWith(
          expect.objectContaining({
            routerState: { openRecurringRuleDrawer: true },
          }),
        )
      })
    })

    describe('WHEN the overview tab content renders', () => {
      it('THEN its Edit link should not carry the auto-open flag', () => {
        const tab = renderAndGetTab(WalletDetailsTabsOptionsEnum.overview)

        mockButtonLink.mockClear()
        render(<>{tab?.content}</>)

        expect(mockButtonLink).toHaveBeenCalledTimes(1)

        const props = mockButtonLink.mock.calls[0][0] as ButtonLinkBaseProps

        expect(props.routerState).toBeUndefined()
      })
    })
  })
})
