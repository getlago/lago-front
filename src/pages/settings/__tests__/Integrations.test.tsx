import {
  act,
  cleanup,
  RenderOptions,
  render as rtlRender,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement } from 'react'
import { generatePath } from 'react-router'

import { SELECTOR_HOVER_ACTIONS_TEST_ID } from '~/components/designSystem/Selector'
import { initializeTranslations } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { X402_INTEGRATION_ROUTE } from '~/core/router'
import {
  FeatureFlagEnum,
  GetBillingEntitiesDocument,
  GetX402ConnectionsPresenceDocument,
  IntegrationsSettingDocument,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn, TestMocksType } from '~/test-utils'

import Integrations, {
  INTEGRATIONS_HUBSPOT_TEST_ID,
  INTEGRATIONS_NETSUITE_TEST_ID,
  INTEGRATIONS_SALESFORCE_TEST_ID,
  INTEGRATIONS_SEGMENT_TEST_ID,
  INTEGRATIONS_STRIPE_TEST_ID,
  INTEGRATIONS_X402_TEST_ID,
} from '../Integrations'

// Mock dialog components that transitively import @nangohq/frontend (ESM)
jest.mock('~/components/settings/integrations/AddAnrokDialog', () => ({
  useAddAnrokDialog: () => ({ openAddAnrokDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddAvalaraDialog', () => ({
  useAddAvalaraDialog: () => ({
    openAddAvalaraDialog: jest.fn(),
  }),
}))
jest.mock('~/components/settings/integrations/AddNetsuiteDialog', () => ({
  useAddNetsuiteDialog: () => ({ openAddNetsuiteDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddXeroDialog', () => ({
  useAddXeroDialog: () => ({ openAddXeroDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddHubspotDialog', () => ({
  useAddHubspotDialog: () => ({ openAddHubspotDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddSalesforceDialog', () => ({
  useAddSalesforceDialog: () => ({ openAddSalesforceDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddAdyenDialog', () => ({
  useAddAdyenDialog: () => ({ openAddAdyenDialog: () => null }),
}))
jest.mock('~/components/settings/integrations/AddStripeDialog', () => ({
  useAddStripeDialog: () => ({ openAddStripeDialog: () => null }),
}))
jest.mock('~/components/settings/integrations/AddGocardlessDialog', () => ({
  useAddGocardlessDialog: () => ({ openAddGocardlessDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddCashfreeDialog', () => ({
  useAddCashfreeDialog: () => ({
    openAddCashfreeDialog: jest.fn(),
  }),
}))
jest.mock('~/components/settings/integrations/AddMoneyhashDialog', () => ({
  useAddMoneyhashDialog: () => ({
    openAddMoneyhashDialog: jest.fn(),
  }),
}))
jest.mock('~/components/settings/integrations/AddLagoTaxManagementDialog', () => ({
  useAddLagoTaxManagementDialog: () => ({ openAddLagoTaxManagementDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/AddFlutterwaveDialog', () => ({
  useAddFlutterwaveDialog: () => ({ openAddFlutterwaveDialog: jest.fn() }),
}))
jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({
    open: jest.fn(),
    close: jest.fn(),
  }),
}))

const mockOpenAddX402Dialog = jest.fn()

jest.mock('~/components/settings/integrations/AddX402Dialog', () => ({
  useAddX402Dialog: () => ({ openAddX402Dialog: mockOpenAddX402Dialog }),
}))

const mockRefetch = jest.fn()
let mockIsPremium = true

let mockOrganizationData: {
  premiumIntegrations?: PremiumIntegrationTypeEnum[]
} = {
  premiumIntegrations: [
    PremiumIntegrationTypeEnum.Netsuite,
    PremiumIntegrationTypeEnum.Xero,
    PremiumIntegrationTypeEnum.Hubspot,
    PremiumIntegrationTypeEnum.Salesforce,
    PremiumIntegrationTypeEnum.Avalara,
  ],
}

const mockHasFeatureFlag = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: mockOrganizationData,
    loading: false,
    refetchOrganizationInfos: mockRefetch,
    hasFeatureFlag: mockHasFeatureFlag,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: mockIsPremium,
  }),
}))

function emptyBillingEntitiesMock() {
  return {
    request: {
      query: GetBillingEntitiesDocument,
    },
    result: {
      data: {
        billingEntities: {
          __typename: 'BillingEntityCollection',
          collection: [],
        },
      },
    },
  }
}

function emptyIntegrationsMock(): TestMocksType {
  return [
    {
      request: {
        query: IntegrationsSettingDocument,
        variables: { limit: 1000 },
      },
      result: {
        data: {
          paymentProviders: {
            __typename: 'PaymentProviderCollection',
            collection: [],
          },
          integrations: {
            __typename: 'IntegrationCollection',
            collection: [],
          },
        },
      },
    },
    emptyBillingEntitiesMock(),
  ]
}

function stripeConnectedMock(): TestMocksType {
  return [
    {
      request: {
        query: IntegrationsSettingDocument,
        variables: { limit: 1000 },
      },
      result: {
        data: {
          paymentProviders: {
            __typename: 'PaymentProviderCollection',
            collection: [
              {
                __typename: 'StripeProvider',
                id: 'stripe-123',
              },
            ],
          },
          integrations: {
            __typename: 'IntegrationCollection',
            collection: [],
          },
        },
      },
    },
    emptyBillingEntitiesMock(),
  ]
}

function netsuiteConnectedMock(): TestMocksType {
  return [
    {
      request: {
        query: IntegrationsSettingDocument,
        variables: { limit: 1000 },
      },
      result: {
        data: {
          paymentProviders: {
            __typename: 'PaymentProviderCollection',
            collection: [],
          },
          integrations: {
            __typename: 'IntegrationCollection',
            collection: [
              {
                __typename: 'NetsuiteIntegration',
                id: 'netsuite-123',
              },
            ],
          },
        },
      },
    },
    emptyBillingEntitiesMock(),
  ]
}

function x402ConnectionsMock(count: number, delay = 0): TestMocksType[number] {
  return {
    delay,
    request: { query: GetX402ConnectionsPresenceDocument },
    result: {
      data: {
        x402Connections: {
          __typename: 'X402ConnectionObjectCollection',
          collection: Array.from({ length: count }, (_, index) => ({
            __typename: 'X402ConnectionObject',
            id: `x402-${index}`,
            name: 'Coinbase Devnet',
            code: 'coinbase_devnet',
            cdpApiKeyId: '••••••••…abc',
            cdpApiKeySecret: '••••••••…xyz',
            networks: ['eip155:84532'],
            allowedOrigins: ['https://example.com'],
            autoCreateCustomers: true,
            payoutAddresses: {
              __typename: 'X402PayoutAddresses',
              evm: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
              svm: null,
            },
          })),
        },
      },
    },
  }
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { mocks?: TestMocksType },
) =>
  rtlRender(ui, {
    wrapper: (props) => <AllTheProviders {...props} mocks={options?.mocks} forceTypenames={true} />,
    ...options,
  })

async function prepare({ mocks = emptyIntegrationsMock() }: { mocks?: TestMocksType } = {}) {
  window.history.pushState({}, '', '/settings/integrations/lago')
  await act(() => customRender(<Integrations />, { mocks }))
}

describe('Integrations', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium = true
    mockHasFeatureFlag.mockReturnValue(false)
    mockOrganizationData = {
      premiumIntegrations: [
        PremiumIntegrationTypeEnum.Netsuite,
        PremiumIntegrationTypeEnum.Xero,
        PremiumIntegrationTypeEnum.Hubspot,
        PremiumIntegrationTypeEnum.Salesforce,
        PremiumIntegrationTypeEnum.Avalara,
      ],
    }
  })

  afterEach(cleanup)

  describe('basic rendering', () => {
    it('renders integration selectors on the Lago tab', async () => {
      await prepare()

      await waitFor(() => {
        // Selectors are rendered as div[role="button"]
        const selectors = screen.getAllByRole('button').filter((el) => el.tagName === 'DIV')

        // Lago tab should show multiple integration selectors
        expect(selectors.length).toBeGreaterThanOrEqual(5)
      })
    })

    it('renders chevron-right icons for non-connected integrations', async () => {
      await prepare()

      await waitFor(() => {
        const chevrons = screen.getAllByTestId('chevron-right/medium')

        // Multiple integrations should show chevron-right when not connected
        expect(chevrons.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('renders outside icons for external documentation links', async () => {
      await prepare()

      await waitFor(() => {
        const outsideIcons = screen.getAllByTestId('outside/medium')

        // Oso, HightTouch, Segment, Airbyte have outside icons
        expect(outsideIcons.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('connected integration state', () => {
    it('shows Connected chip when integration is connected', async () => {
      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        const chips = screen.getAllByText('Connected')

        expect(chips.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows chevron-right alongside Connected chip for connected integrations', async () => {
      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        const chips = screen.getAllByText('Connected')

        expect(chips.length).toBeGreaterThanOrEqual(1)

        // At least one chevron-right for the connected integration endContent
        const chevrons = screen.getAllByTestId('chevron-right/medium')

        expect(chevrons.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('navigates to integration route when clicking connected integration', async () => {
      const user = userEvent.setup()

      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        expect(screen.getAllByText('Connected').length).toBeGreaterThanOrEqual(1)
      })

      // Find Stripe selector by its title text and click its parent button
      const stripeTitle = screen.getByText('Stripe')
      const stripeSelector = stripeTitle.closest('[role="button"]') as HTMLElement

      await user.click(stripeSelector)

      expect(testMockNavigateFn).toHaveBeenCalled()
    })
  })

  describe('premium gating', () => {
    it('shows sparkles icon for premium integrations when user is not premium', async () => {
      mockIsPremium = false

      await prepare()

      await waitFor(() => {
        // Anrok shows sparkles when not premium
        const sparklesIcons = screen.getAllByTestId('sparkles/medium')

        expect(sparklesIcons.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('does not show sparkles for premium integrations when user is premium', async () => {
      mockIsPremium = true

      await prepare()

      await waitFor(() => {
        // When premium, sparkles should not appear for Anrok
        // (but may still appear for integrations gated by premiumIntegrations)
        const sparklesIcons = screen.queryAllByTestId('sparkles/medium')

        // With all premium integrations granted, no sparkles should show
        expect(sparklesIcons).toHaveLength(0)
      })
    })

    it('shows sparkles for premium integrations without organization access', async () => {
      mockIsPremium = true
      // Remove Netsuite from premium integrations
      mockOrganizationData = {
        premiumIntegrations: [
          PremiumIntegrationTypeEnum.Xero,
          PremiumIntegrationTypeEnum.Hubspot,
          PremiumIntegrationTypeEnum.Salesforce,
          PremiumIntegrationTypeEnum.Avalara,
        ],
      }

      await prepare()

      await waitFor(() => {
        // Netsuite should show sparkles since org doesn't have access
        const sparklesIcons = screen.getAllByTestId('sparkles/medium')

        expect(sparklesIcons.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('hover actions', () => {
    it('renders pen action button for connected integration', async () => {
      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        // The pen icon in hover actions is rendered (hidden via CSS)
        expect(screen.getByTestId('pen/medium')).toBeInTheDocument()
      })
    })

    it('does not render pen action button when integration is not connected', async () => {
      await prepare()

      await waitFor(() => {
        // No pen icons should appear when no integrations are connected
        expect(screen.queryByTestId('pen/medium')).not.toBeInTheDocument()
      })
    })

    it('renders hover zone for connected integration', async () => {
      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        const hoverZone = screen.getByTestId(SELECTOR_HOVER_ACTIONS_TEST_ID)

        expect(hoverZone).toBeInTheDocument()
        expect(hoverZone.className).toContain('group-hover/selector:flex')
      })
    })

    it('renders Connected chip in both endContent and hoverActions', async () => {
      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        // Two "Connected" chips: one in endContent (visible by default) and one in hoverActions
        const connectedChips = screen.getAllByText('Connected')

        expect(connectedChips).toHaveLength(2)
      })
    })

    it('renders hover actions with pen button for connected premium integration', async () => {
      await prepare({ mocks: netsuiteConnectedMock() })

      await waitFor(() => {
        // Connected chip visible + pen action
        expect(screen.getAllByText('Connected').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByTestId('pen/medium')).toBeInTheDocument()
      })
    })

    it('does not render hover actions for premium integration without access', async () => {
      // Remove Netsuite from premium integrations
      mockOrganizationData = {
        premiumIntegrations: [],
      }

      await prepare({ mocks: netsuiteConnectedMock() })

      await waitFor(() => {
        // No pen icon since user doesn't have premium access for Netsuite
        expect(screen.queryByTestId('pen/medium')).not.toBeInTheDocument()
      })
    })
  })

  describe('click behavior', () => {
    it('navigates to integration detail when clicking connected non-premium integration', async () => {
      const user = userEvent.setup()

      await prepare({ mocks: stripeConnectedMock() })

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument()
      })

      const stripeTitle = screen.getByText('Stripe')
      const stripeSelector = stripeTitle.closest('[role="button"]') as HTMLElement

      await user.click(stripeSelector)

      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
    })

    it('navigates to integration detail when clicking connected premium integration', async () => {
      const user = userEvent.setup()

      await prepare({ mocks: netsuiteConnectedMock() })

      await waitFor(() => {
        expect(screen.getAllByText('Connected').length).toBeGreaterThanOrEqual(1)
      })

      const netsuiteTitle = screen.getByText('NetSuite')
      const netsuiteSelector = netsuiteTitle.closest('[role="button"]') as HTMLElement

      await user.click(netsuiteSelector)

      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Coinbase x402', () => {
    it('is hidden when the organization does not have the x402_payments flag', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId(INTEGRATIONS_STRIPE_TEST_ID)).toBeInTheDocument()
      })
      expect(screen.queryByTestId(INTEGRATIONS_X402_TEST_ID)).not.toBeInTheDocument()
    })

    it('is hidden when the license is not premium, even with the flag', async () => {
      mockIsPremium = false
      mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.X402Payments)

      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId(INTEGRATIONS_STRIPE_TEST_ID)).toBeInTheDocument()
      })
      expect(screen.queryByTestId(INTEGRATIONS_X402_TEST_ID)).not.toBeInTheDocument()
    })

    it('opens the connection dialog when nothing is connected yet', async () => {
      const user = userEvent.setup()

      mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.X402Payments)

      await prepare({ mocks: [...emptyIntegrationsMock(), x402ConnectionsMock(0)] })
      await user.click(await screen.findByTestId(INTEGRATIONS_X402_TEST_ID))

      expect(mockOpenAddX402Dialog).toHaveBeenCalledTimes(1)
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })

    it('shows the connection once it loads after the other integrations', async () => {
      mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.X402Payments)

      await prepare({ mocks: [...emptyIntegrationsMock(), x402ConnectionsMock(1, 50)] })

      await waitFor(() => {
        expect(screen.getByTestId(INTEGRATIONS_X402_TEST_ID)).toHaveTextContent('Connected')
      })
    })

    it('navigates to its connections when one is connected', async () => {
      const user = userEvent.setup()

      mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.X402Payments)

      await prepare({ mocks: [...emptyIntegrationsMock(), x402ConnectionsMock(1)] })

      const selector = await screen.findByTestId(INTEGRATIONS_X402_TEST_ID)

      await waitFor(() => {
        expect(selector).toHaveTextContent('Connected')
      })
      await user.click(selector)

      expect(testMockNavigateFn).toHaveBeenCalledWith(
        generatePath(X402_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
        }),
      )
      expect(mockOpenAddX402Dialog).not.toHaveBeenCalled()
    })
  })

  describe('product catalog organizations', () => {
    it('shows only tax and payment integrations on the Lago tab', async () => {
      mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.ProductCatalog)

      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId(INTEGRATIONS_STRIPE_TEST_ID)).toBeInTheDocument()
      })

      expect(screen.queryByTestId(INTEGRATIONS_HUBSPOT_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(INTEGRATIONS_NETSUITE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(INTEGRATIONS_SALESFORCE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(INTEGRATIONS_SEGMENT_TEST_ID)).not.toBeInTheDocument()
    })

    it('keeps every integration for legacy organizations', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId(INTEGRATIONS_STRIPE_TEST_ID)).toBeInTheDocument()
      })

      expect(screen.getByTestId(INTEGRATIONS_HUBSPOT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(INTEGRATIONS_NETSUITE_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(INTEGRATIONS_SALESFORCE_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(INTEGRATIONS_SEGMENT_TEST_ID)).toBeInTheDocument()
    })
  })
})
