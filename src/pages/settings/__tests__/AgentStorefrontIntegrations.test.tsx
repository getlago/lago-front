import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { GetAgentStorefrontIntegrationsListQuery, IntegrationTypeEnum } from '~/generated/graphql'

import { renderIntegrationPage } from './integrationTestHelpers'

import AgentStorefrontIntegrations, {
  AGENT_STOREFRONT_ADD_CONNECTION_TEST_ID,
  AGENT_STOREFRONT_CONNECTION_DELETE_TEST_ID,
  AGENT_STOREFRONT_CONNECTION_EDIT_TEST_ID,
  AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID,
} from '../AgentStorefrontIntegrations'

const mockOpenAddAgentStorefrontDialog = jest.fn()
const mockOpenEditAgentStorefrontDialog = jest.fn()
const mockOpenDeleteDialog = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/components/settings/integrations/agentStorefront/AddAgentStorefrontDialog', () => ({
  useAddAgentStorefrontDialog: () => ({
    openAddAgentStorefrontDialog: mockOpenAddAgentStorefrontDialog,
    openEditAgentStorefrontDialog: mockOpenEditAgentStorefrontDialog,
  }),
}))

jest.mock(
  '~/components/settings/integrations/agentStorefront/DeleteAgentStorefrontIntegrationDialog',
  () => ({
    useDeleteAgentStorefrontIntegrationDialog: () => ({
      openDeleteAgentStorefrontIntegrationDialog: mockOpenDeleteDialog,
      getDeleteAgentStorefrontIntegrationDialogProps: jest.fn(),
    }),
  }),
)

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAgentStorefrontIntegrationsListQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

const connectionA = {
  __typename: 'AgentStorefrontIntegration' as const,
  id: 'storefront-a',
  name: 'Agentic Flow A',
  code: 'agentic_flow_a',
  paymentProviderCode: 'stripe_1',
  resourceEndpoint: null,
  resourceInstructions: null,
  hasAgentsWithStripeCustomer: false,
  hasEnrolledAgents: false,
}

const twoConnections: GetAgentStorefrontIntegrationsListQuery = {
  integrations: {
    __typename: 'IntegrationCollection',
    collection: [
      connectionA,
      {
        ...connectionA,
        id: 'storefront-b',
        name: 'Agentic Flow B',
        code: 'agentic_flow_b',
        hasEnrolledAgents: true,
      },
    ],
  },
}

const allowOnly = (allowed: string[]): void => {
  mockHasPermissions.mockImplementation((permissions: string[]) =>
    permissions.every((permission) => allowed.includes(permission)),
  )
}

describe('AgentStorefrontIntegrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    allowOnly(['organizationIntegrationsUpdate', 'organizationIntegrationsDelete'])
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

      it('THEN should not show the empty state', async () => {
        await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should render a row menu on each connection', async () => {
        await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(
          screen.getByTestId(`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-storefront-a`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-storefront-b`),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN picking edit in a row menu', () => {
      it('THEN should open the edit dialog seeded with that connection', async () => {
        const user = userEvent.setup()

        await renderIntegrationPage(AgentStorefrontIntegrations)

        await user.click(
          screen.getByTestId(`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-storefront-a`),
        )
        await user.click(await screen.findByTestId(AGENT_STOREFRONT_CONNECTION_EDIT_TEST_ID))

        expect(mockOpenEditAgentStorefrontDialog).toHaveBeenCalledWith({
          integration: connectionA,
        })
      })
    })

    describe('WHEN picking delete in a row menu', () => {
      it('THEN should open the delete dialog with that connection', async () => {
        const user = userEvent.setup()

        await renderIntegrationPage(AgentStorefrontIntegrations)

        await user.click(
          screen.getByTestId(`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-storefront-b`),
        )
        await user.click(await screen.findByTestId(AGENT_STOREFRONT_CONNECTION_DELETE_TEST_ID))

        expect(mockOpenDeleteDialog).toHaveBeenCalledWith({
          integration: expect.objectContaining({ id: 'storefront-b', hasEnrolledAgents: true }),
        })
      })
    })

    describe('WHEN the user can only edit integrations', () => {
      it('THEN should offer edit but not delete', async () => {
        const user = userEvent.setup()

        allowOnly(['organizationIntegrationsUpdate'])

        await renderIntegrationPage(AgentStorefrontIntegrations)

        await user.click(
          screen.getByTestId(`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-storefront-a`),
        )

        expect(
          await screen.findByTestId(AGENT_STOREFRONT_CONNECTION_EDIT_TEST_ID),
        ).toBeInTheDocument()
        expect(
          screen.queryByTestId(AGENT_STOREFRONT_CONNECTION_DELETE_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user can neither edit nor delete integrations', () => {
      it('THEN should not render any row menu', async () => {
        allowOnly([])

        await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(
          screen.queryByTestId(`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-storefront-a`),
        ).not.toBeInTheDocument()
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

  describe('GIVEN no Storefront connection exists', () => {
    beforeEach(() => {
      mockQueryResult.mockReturnValue({
        data: { integrations: { __typename: 'IntegrationCollection', collection: [] } },
        loading: false,
      })
    })

    describe('WHEN the list renders', () => {
      it('THEN should show the empty state', async () => {
        await renderIntegrationPage(AgentStorefrontIntegrations)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN clicking the empty state button', () => {
      it('THEN should open the connect dialog', async () => {
        const user = userEvent.setup()

        await renderIntegrationPage(AgentStorefrontIntegrations)

        await user.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

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
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
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
