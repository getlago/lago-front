import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { AgentStorefrontIntegrationDetailsFragment, CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import { renderIntegrationPage } from './integrationTestHelpers'

import AgentStorefrontIntegrationDetails, {
  AGENT_ACCESS_COPY_TEST_ID,
  AGENT_STOREFRONT_ACTIONS_DELETE_TEST_ID,
  AGENT_STOREFRONT_ACTIONS_EDIT_TEST_ID,
  AGENT_STOREFRONT_ACTIONS_TEST_ID,
  AGENT_STOREFRONT_EDIT_CONNECTION_TEST_ID,
  AGENT_STOREFRONT_PLAN_EDIT_TEST_ID,
  AGENT_STOREFRONT_PLAN_STOP_SELLING_TEST_ID,
  AGENT_STOREFRONT_SELL_PLAN_TEST_ID,
} from '../AgentStorefrontIntegrationDetails'

const mockOpenEditConnection = jest.fn()
const mockOpenDeleteConnection = jest.fn()
const mockOpenSellPlan = jest.fn()
const mockOpenEditPlan = jest.fn()
const mockOpenStopSelling = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/components/settings/integrations/agentStorefront/AddAgentStorefrontDialog', () => ({
  useAddAgentStorefrontDialog: () => ({
    openAddAgentStorefrontDialog: jest.fn(),
    openEditAgentStorefrontDialog: mockOpenEditConnection,
  }),
}))

jest.mock(
  '~/components/settings/integrations/agentStorefront/DeleteAgentStorefrontIntegrationDialog',
  () => ({
    useDeleteAgentStorefrontIntegrationDialog: () => ({
      openDeleteAgentStorefrontIntegrationDialog: mockOpenDeleteConnection,
      getDeleteAgentStorefrontIntegrationDialogProps: jest.fn(),
    }),
  }),
)

jest.mock('~/components/settings/integrations/agentStorefront/SellPlanToAgentsDialog', () => ({
  useSellPlanToAgentsDialog: () => ({
    openSellPlanDialog: mockOpenSellPlan,
    openEditPlanDialog: mockOpenEditPlan,
  }),
}))

jest.mock('~/components/settings/integrations/agentStorefront/StopSellingPlanDialog', () => ({
  useStopSellingPlanDialog: () => ({ openStopSellingPlanDialog: mockOpenStopSelling }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

const ALL_PERMISSIONS = [
  'organizationIntegrationsUpdate',
  'organizationIntegrationsDelete',
  'plansView',
]

const allowOnly = (allowed: string[]): void => {
  mockHasPermissions.mockImplementation((permissions: string[]) =>
    permissions.every((permission) => allowed.includes(permission)),
  )
}

jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAgentStorefrontIntegrationDetailsQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

type SoldPlan = AgentStorefrontIntegrationDetailsFragment['plans'][number]

const AGENT_ACCESS_TABLE_TEST_ID = 'table-agent-storefront-agent-access'
const PLANS_TABLE_TEST_ID = 'table-agent-storefront-plans'

const usdPlan: NonNullable<SoldPlan['plan']> = {
  __typename: 'Plan',
  id: 'plan-count',
  name: 'Count',
  code: 'count',
  invoiceDisplayName: null,
  amountCurrency: CurrencyEnum.Usd,
}

const createSoldPlan = (overrides: Partial<SoldPlan> = {}): SoldPlan => ({
  __typename: 'AgentStorefrontPlan',
  planCode: 'count',
  minimumTopupCents: 500,
  maximumTopupCents: 10000,
  freeCreditsCents: 1000,
  plan: usdPlan,
  ...overrides,
})

const createIntegration = (
  overrides: Partial<AgentStorefrontIntegrationDetailsFragment> = {},
): AgentStorefrontIntegrationDetailsFragment => ({
  __typename: 'AgentStorefrontIntegration',
  id: 'storefront-a',
  name: 'Agentic Flow A',
  code: 'agentic_flow_a',
  paymentProviderCode: 'stripe_prod',
  paymentProvider: { __typename: 'StripeProvider', id: 'stripe-1', name: 'Stripe SPT Prod' },
  resourceEndpoint: 'https://api.acme.example/v1/count',
  resourceInstructions: 'https://api.acme.example/v1/COUNT.md',
  agentUrl: 'https://api.getlago.com/agents/v1/abc',
  authDocumentUrl: 'https://api.getlago.com/agents/v1/abc/AUTH.md',
  billingDocumentUrl: 'https://api.getlago.com/agents/v1/abc/BILLING.md',
  claimUrl: 'https://app.getlago.com/agent-claim/abc',
  hasEnrolledAgents: false,
  hasAgentsWithStripeCustomer: false,
  plans: [createSoldPlan()],
  ...overrides,
})

const renderWith = async (
  integration: AgentStorefrontIntegrationDetailsFragment,
): Promise<ReturnType<typeof renderIntegrationPage>> => {
  mockQueryResult.mockReturnValue({ data: { integration }, loading: false })

  return renderIntegrationPage(AgentStorefrontIntegrationDetails, {
    useParams: { integrationId: integration.id },
  })
}

describe('AgentStorefrontIntegrationDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    allowOnly(ALL_PERMISSIONS)
  })

  afterEach(cleanup)

  describe('GIVEN the connection is loaded', () => {
    describe('WHEN the page renders', () => {
      it('THEN should query the connection from the route param', async () => {
        await renderWith(createIntegration())

        expect(mockQueryResult).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: 'storefront-a' }, skip: false }),
        )
      })

      it('THEN should show the connection name in the header', async () => {
        await renderWith(createIntegration())

        await waitFor(() => {
          expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
            'Agentic Flow A',
          )
        })
      })
    })
  })

  describe('GIVEN the user can edit and delete integrations and view plans', () => {
    describe('WHEN clicking the Edit link of the connection details', () => {
      it('THEN should open the edit dialog with the connection and a delete callback', async () => {
        const integration = createIntegration()

        await renderWith(integration)

        fireEvent.click(screen.getByTestId(AGENT_STOREFRONT_EDIT_CONNECTION_TEST_ID))

        expect(mockOpenEditConnection).toHaveBeenCalledWith({
          integration,
          deleteCallback: expect.any(Function),
        })
      })
    })

    describe('WHEN picking edit in the header actions', () => {
      it('THEN should open the edit dialog with the connection', async () => {
        const user = userEvent.setup()
        const integration = createIntegration()

        await renderWith(integration)

        await user.click(screen.getByTestId(AGENT_STOREFRONT_ACTIONS_TEST_ID))
        await user.click(await screen.findByTestId(AGENT_STOREFRONT_ACTIONS_EDIT_TEST_ID))

        expect(mockOpenEditConnection).toHaveBeenCalledWith(
          expect.objectContaining({ integration }),
        )
      })
    })

    describe('WHEN picking delete in the header actions', () => {
      it('THEN should open the delete dialog whose callback returns to the connections list', async () => {
        const user = userEvent.setup()
        const integration = createIntegration()

        await renderWith(integration)

        await user.click(screen.getByTestId(AGENT_STOREFRONT_ACTIONS_TEST_ID))
        await user.click(await screen.findByTestId(AGENT_STOREFRONT_ACTIONS_DELETE_TEST_ID))

        expect(mockOpenDeleteConnection).toHaveBeenCalledWith({
          integration,
          callback: expect.any(Function),
        })

        mockOpenDeleteConnection.mock.calls[0][0].callback()

        expect(testMockNavigateFn).toHaveBeenCalledWith(
          '/settings/integrations/lago/agent-storefront',
        )
      })
    })

    describe('WHEN clicking Sell a plan on the plans section', () => {
      it('THEN should open the sell dialog with the codes already sold', async () => {
        await renderWith(createIntegration())

        fireEvent.click(screen.getByTestId(AGENT_STOREFRONT_SELL_PLAN_TEST_ID))

        expect(mockOpenSellPlan).toHaveBeenCalledWith(['count'])
      })
    })

    describe('WHEN no plan is sold and the empty state button is clicked', () => {
      it('THEN should open the sell dialog with no sold codes', async () => {
        await renderWith(createIntegration({ plans: [] }))

        fireEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

        expect(mockOpenSellPlan).toHaveBeenCalledWith([])
      })
    })

    describe('WHEN picking edit in a plan row menu', () => {
      it('THEN should open the edit plan dialog with that sold plan', async () => {
        await renderWith(createIntegration())

        fireEvent.click(screen.getByTestId(OPEN_ACTION_BUTTON_TEST_ID))
        fireEvent.click(await screen.findByTestId(AGENT_STOREFRONT_PLAN_EDIT_TEST_ID))

        expect(mockOpenEditPlan).toHaveBeenCalledWith(expect.objectContaining(createSoldPlan()))
      })
    })

    describe('WHEN picking stop selling in a plan row menu', () => {
      it('THEN should open the stop selling dialog with that sold plan', async () => {
        await renderWith(createIntegration())

        fireEvent.click(screen.getByTestId(OPEN_ACTION_BUTTON_TEST_ID))
        fireEvent.click(await screen.findByTestId(AGENT_STOREFRONT_PLAN_STOP_SELLING_TEST_ID))

        expect(mockOpenStopSelling).toHaveBeenCalledWith(expect.objectContaining(createSoldPlan()))
      })
    })

    describe('WHEN the sold plan was deleted', () => {
      it('THEN should offer stop selling but not edit', async () => {
        await renderWith(createIntegration({ plans: [createSoldPlan({ plan: null })] }))

        fireEvent.click(screen.getByTestId(OPEN_ACTION_BUTTON_TEST_ID))

        expect(
          await screen.findByTestId(AGENT_STOREFRONT_PLAN_STOP_SELLING_TEST_ID),
        ).toBeInTheDocument()
        expect(screen.queryByTestId(AGENT_STOREFRONT_PLAN_EDIT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user can edit integrations but cannot view plans', () => {
    describe('WHEN the page renders', () => {
      it('THEN should hide both Sell a plan entry points but keep the edit actions', async () => {
        allowOnly(['organizationIntegrationsUpdate'])

        await renderWith(createIntegration({ plans: [] }))

        expect(screen.queryByTestId(AGENT_STOREFRONT_SELL_PLAN_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(AGENT_STOREFRONT_EDIT_CONNECTION_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user cannot edit integrations', () => {
    describe('WHEN the page renders', () => {
      it('THEN should hide the edit link, the sell entry points and the plan row menu', async () => {
        allowOnly(['organizationIntegrationsDelete', 'plansView'])

        await renderWith(createIntegration())

        expect(
          screen.queryByTestId(AGENT_STOREFRONT_EDIT_CONNECTION_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(AGENT_STOREFRONT_SELL_PLAN_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(OPEN_ACTION_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the header actions are configured once', () => {
    describe('WHEN the connection data changes without remounting the page', () => {
      it('THEN should open the edit dialog with the latest connection', async () => {
        const user = userEvent.setup()
        const Host = (): JSX.Element => (
          <AllTheProviders useParams={{ integrationId: 'storefront-a' }} forceTypenames>
            <MainHeader />
            <AgentStorefrontIntegrationDetails />
          </AllTheProviders>
        )

        mockQueryResult.mockReturnValue({
          data: { integration: createIntegration() },
          loading: false,
        })

        let rerender: ReturnType<typeof render>['rerender'] = () => undefined

        await act(async () => {
          ;({ rerender } = render(<Host />))
        })

        const updated = createIntegration({
          resourceInstructions: 'https://api.acme.example/v2.md',
        })

        mockQueryResult.mockReturnValue({ data: { integration: updated }, loading: false })

        await act(async () => {
          rerender(<Host />)
        })

        await user.click(screen.getByTestId(AGENT_STOREFRONT_ACTIONS_TEST_ID))
        await user.click(await screen.findByTestId(AGENT_STOREFRONT_ACTIONS_EDIT_TEST_ID))

        expect(mockOpenEditConnection).toHaveBeenCalledWith(
          expect.objectContaining({ integration: updated }),
        )
      })
    })
  })

  describe('GIVEN the optional resource URLs', () => {
    describe('WHEN both are empty', () => {
      it('THEN should hide the endpoint and agent instructions rows', async () => {
        await renderWith(createIntegration({ resourceEndpoint: null, resourceInstructions: '' }))

        expect(screen.getByText('agentic_flow_a')).toBeInTheDocument()
        expect(screen.queryByText('https://api.acme.example/v1/count')).not.toBeInTheDocument()
        expect(screen.queryByText('https://api.acme.example/v1/COUNT.md')).not.toBeInTheDocument()
      })
    })

    describe('WHEN both are set', () => {
      it('THEN should show both rows', async () => {
        await renderWith(createIntegration())

        expect(screen.getByText('https://api.acme.example/v1/count')).toBeInTheDocument()
        expect(screen.getByText('https://api.acme.example/v1/COUNT.md')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the payment connection', () => {
    describe('WHEN the Stripe provider is resolved', () => {
      it('THEN should show its name', async () => {
        await renderWith(createIntegration())

        expect(screen.getByText('Stripe SPT Prod')).toBeInTheDocument()
      })
    })

    describe('WHEN the Stripe provider is not resolved', () => {
      it('THEN should fall back to the payment provider code', async () => {
        await renderWith(createIntegration({ paymentProvider: null }))

        expect(screen.getByText('stripe_prod')).toBeInTheDocument()
        expect(screen.queryByText('Stripe SPT Prod')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the agent access table', () => {
    describe('WHEN the page renders', () => {
      it.each([
        ['agentUrl', 'https://api.getlago.com/agents/v1/abc'],
        ['authDocumentUrl', 'https://api.getlago.com/agents/v1/abc/AUTH.md'],
        ['billingDocumentUrl', 'https://api.getlago.com/agents/v1/abc/BILLING.md'],
        ['claimUrl', 'https://app.getlago.com/agent-claim/abc'],
      ])('THEN should render %s as an external link', async (_, url) => {
        await renderWith(createIntegration())

        const table = screen.getByTestId(AGENT_ACCESS_TABLE_TEST_ID)
        const link = within(table).getByText(url).closest('a') as HTMLAnchorElement

        expect(link).toHaveAttribute('href', url)
        expect(link).toHaveAttribute('target', '_blank')
      })
    })

    describe('WHEN clicking a copy button', () => {
      it.each([
        ['agentUrl', 'https://api.getlago.com/agents/v1/abc'],
        ['authDocumentUrl', 'https://api.getlago.com/agents/v1/abc/AUTH.md'],
        ['billingDocumentUrl', 'https://api.getlago.com/agents/v1/abc/BILLING.md'],
        ['claimUrl', 'https://app.getlago.com/agent-claim/abc'],
      ])('THEN should copy the %s value and toast', async (rowId, url) => {
        await renderWith(createIntegration())

        fireEvent.click(screen.getByTestId(`${AGENT_ACCESS_COPY_TEST_ID}-${rowId}`))

        expect(copyToClipboard).toHaveBeenCalledWith(url)
        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'info', translateKey: expect.any(String) }),
        )
      })

      it('THEN should use a distinct toast per row', async () => {
        await renderWith(createIntegration())

        fireEvent.click(screen.getByTestId(`${AGENT_ACCESS_COPY_TEST_ID}-agentUrl`))
        fireEvent.click(screen.getByTestId(`${AGENT_ACCESS_COPY_TEST_ID}-claimUrl`))

        const [[agentToast], [claimToast]] = jest.mocked(addToast).mock.calls

        expect(agentToast.translateKey).not.toEqual(claimToast.translateKey)
      })
    })
  })

  describe('GIVEN the plans sold to agents', () => {
    describe('WHEN a plan is sold in USD', () => {
      it('THEN should render its name, code, top-up range and free credits', async () => {
        await renderWith(createIntegration())

        const table = screen.getByTestId(PLANS_TABLE_TEST_ID)

        expect(within(table).getByText('Count')).toBeInTheDocument()
        expect(within(table).getByText('count')).toBeInTheDocument()
        expect(within(table).getByText('$5.00 – $100.00')).toBeInTheDocument()
        expect(within(table).getByText('$10.00')).toBeInTheDocument()
      })
    })

    describe('WHEN free credits are zero', () => {
      it('THEN should render a zero amount, not a dash', async () => {
        await renderWith(createIntegration({ plans: [createSoldPlan({ freeCreditsCents: 0 })] }))

        expect(
          within(screen.getByTestId(PLANS_TABLE_TEST_ID)).getByText('$0.00'),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN free credits are null', () => {
      it('THEN should render a dash', async () => {
        await renderWith(createIntegration({ plans: [createSoldPlan({ freeCreditsCents: null })] }))

        expect(within(screen.getByTestId(PLANS_TABLE_TEST_ID)).getByText('-')).toBeInTheDocument()
      })
    })

    describe('WHEN the sold plan was deleted', () => {
      it('THEN should show the plan code and dashes for both amounts', async () => {
        await renderWith(
          createIntegration({ plans: [createSoldPlan({ planCode: 'gone', plan: null })] }),
        )

        const table = screen.getByTestId(PLANS_TABLE_TEST_ID)

        expect(within(table).getByText('gone')).toBeInTheDocument()
        expect(within(table).getAllByText('-')).toHaveLength(2)
        expect(within(table).queryByText('$10.00')).not.toBeInTheDocument()
      })
    })

    describe('WHEN no plan is sold', () => {
      it('THEN should show the empty state with a sell button', async () => {
        await renderWith(createIntegration({ plans: [] }))

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the first load is in flight', () => {
    describe('WHEN no data is cached yet', () => {
      it('THEN should render skeletons and no section content', async () => {
        mockQueryResult.mockReturnValue({ data: undefined, loading: true })

        const { container } = await renderIntegrationPage(AgentStorefrontIntegrationDetails, {
          useParams: { integrationId: 'storefront-a' },
        })

        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
        expect(screen.queryByTestId(AGENT_ACCESS_TABLE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN cached data is already available', () => {
      it('THEN should render the sections', async () => {
        mockQueryResult.mockReturnValue({
          data: { integration: createIntegration() },
          loading: true,
        })

        await renderIntegrationPage(AgentStorefrontIntegrationDetails, {
          useParams: { integrationId: 'storefront-a' },
        })

        expect(screen.getByTestId(AGENT_ACCESS_TABLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
