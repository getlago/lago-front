import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { AgentStorefrontIntegrationDetailsFragment, CurrencyEnum } from '~/generated/graphql'

import { renderIntegrationPage } from './integrationTestHelpers'

import AgentStorefrontIntegrationDetails, {
  AGENT_ACCESS_COPY_TEST_ID,
} from '../AgentStorefrontIntegrationDetails'

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

      it('THEN should not render any edit or sell action', async () => {
        const { container } = await renderWith(createIntegration())

        expect(container.querySelector('[data-test="open-action-button"]')).not.toBeInTheDocument()
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
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
      it('THEN should show the empty state without a button', async () => {
        await renderWith(createIntegration({ plans: [] }))

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
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
