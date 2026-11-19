import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetAgentStorefrontIntegrationsListQuery, IntegrationTypeEnum } from '~/generated/graphql'

import { renderIntegrationPage } from './integrationTestHelpers'

import AgentStorefrontIntegrations, {
  AGENT_STOREFRONT_ADD_CONNECTION_TEST_ID,
} from '../AgentStorefrontIntegrations'

const mockOpenAddAgentStorefrontDialog = jest.fn()

jest.mock('~/components/settings/integrations/agentStorefront/AddAgentStorefrontDialog', () => ({
  useAddAgentStorefrontDialog: () => ({
    openAddAgentStorefrontDialog: mockOpenAddAgentStorefrontDialog,
  }),
}))

const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAgentStorefrontIntegrationsListQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

const twoConnections: GetAgentStorefrontIntegrationsListQuery = {
  integrations: {
    __typename: 'IntegrationCollection',
    collection: [
      {
        __typename: 'AgentStorefrontIntegration',
        id: 'storefront-a',
        name: 'Agentic Flow A',
        code: 'agentic_flow_a',
      },
      {
        __typename: 'AgentStorefrontIntegration',
        id: 'storefront-b',
        name: 'Agentic Flow B',
        code: 'agentic_flow_b',
      },
    ],
  },
}

describe('AgentStorefrontIntegrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(cleanup)

  describe('GIVEN the page is rendered', () => {
    describe('WHEN the query runs', () => {
      it('THEN should request only Storefront integrations', async () => {
        mockQueryResult.mockReturnValue({ data: twoConnections, loading: false })

        await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(mockQueryResult).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { limit: 1000, types: [IntegrationTypeEnum.AgentStorefront] },
          }),
        )
      })
    })
  })

  describe('GIVEN two Storefront connections exist', () => {
    beforeEach(() => {
      mockQueryResult.mockReturnValue({ data: twoConnections, loading: false })
    })

    describe('WHEN the list renders', () => {
      it.each([
        ['Agentic Flow A', 'agentic_flow_a', 'storefront-a'],
        ['Agentic Flow B', 'agentic_flow_b', 'storefront-b'],
      ])(
        'THEN should render %s with its code and a link to its connection page',
        async (name, code, id) => {
          await renderIntegrationPage(AgentStorefrontIntegrations)

          const link = screen.getByText(name).closest('a') as HTMLAnchorElement

          expect(within(link).getByText(code)).toBeInTheDocument()
          expect(link.getAttribute('href')).toMatch(
            new RegExp(`/settings/integrations/lago/agent-storefront/${id}$`),
          )
        },
      )

      it('THEN should not render any row menu', async () => {
        const { container } = await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(container.querySelector('[data-test="plan-item-options"]')).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking the add connection action', () => {
      it('THEN should open the connect dialog', async () => {
        const user = userEvent.setup()

        await renderIntegrationPage(AgentStorefrontIntegrations)

        await user.click(screen.getByTestId(AGENT_STOREFRONT_ADD_CONNECTION_TEST_ID))

        expect(mockOpenAddAgentStorefrontDialog).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the first load is in flight', () => {
    describe('WHEN no data is cached yet', () => {
      it('THEN should render skeletons instead of rows', async () => {
        mockQueryResult.mockReturnValue({ data: undefined, loading: true })

        const { container } = await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(screen.queryByText('Agentic Flow A')).not.toBeInTheDocument()
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      })
    })

    describe('WHEN cached data is already available', () => {
      it('THEN should render the rows, not skeletons', async () => {
        mockQueryResult.mockReturnValue({ data: twoConnections, loading: true })

        await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(screen.getByText('Agentic Flow A')).toBeInTheDocument()
        expect(screen.getByText('Agentic Flow B')).toBeInTheDocument()
      })
    })
  })
})
