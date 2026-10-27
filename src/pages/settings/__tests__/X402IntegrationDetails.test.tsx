import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { generatePath } from 'react-router'

import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { initializeTranslations } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, X402_INTEGRATION_ROUTE } from '~/core/router'
import { testMockNavigateFn } from '~/test-utils'

import { renderIntegrationPage } from './integrationTestHelpers'

import X402IntegrationDetails from '../X402IntegrationDetails'

const ENVIRONMENT_LABEL = 'Environment'
const NETWORKS_LABEL = 'Networks'
const SVM_LABEL = 'SVM Payout address'
const SECRET_LABEL = 'CDP API key Secret'
const AUTO_CREATE_LABEL = 'Auto-create customers - Unknown buyers'
const MAINNET_VALUE = 'Mainnet'
const NO_VALUE = 'No'
const DELETE_ACTION = 'Delete connection'

const mockOpenDeleteDialog = jest.fn()

jest.mock('~/components/settings/integrations/AddX402Dialog', () => ({
  useAddX402Dialog: () => ({ openAddX402Dialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/DeleteX402IntegrationDialog', () => ({
  useDeleteX402IntegrationDialog: () => ({
    openDeleteX402IntegrationDialog: mockOpenDeleteDialog,
  }),
}))
let mockIsPremium = true

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium, loading: false }),
}))
jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetX402IntegrationDetailsQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

const buildQueryResult = (otherConnections: number) => ({
  data: {
    x402Connection: {
      __typename: 'X402ConnectionObject',
      id: 'connection-id',
      name: 'Coinbase Prod',
      code: 'coinbase_prod',
      asset: 'usdc',
      cdpApiKeyId: '••••••••…abc',
      cdpApiKeySecret: '••••••••…xyz',
      networks: ['eip155:8453'],
      allowedOrigins: ['https://example.com'],
      autoCreateCustomers: false,
      payoutAddresses: {
        __typename: 'X402PayoutAddresses',
        evm: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        svm: null,
      },
    },
    x402Connections: {
      __typename: 'X402ConnectionObjectCollection',
      collection: Array.from({ length: otherConnections + 1 }, (_, index) => ({
        __typename: 'X402ConnectionObject',
        id: `connection-${index}`,
      })),
    },
  },
  loading: false,
})

const valueOf = (label: string): string | null | undefined =>
  screen.getByText(label).parentElement?.textContent

describe('X402IntegrationDetails', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium = true
  })

  describe('GIVEN the connection is loaded', () => {
    it('THEN shows its fields, with the secret masked and the environment derived from its networks', async () => {
      mockQueryResult.mockReturnValue(buildQueryResult(0))

      await renderIntegrationPage(X402IntegrationDetails, {
        useParams: { integrationId: 'connection-id' },
      })

      await waitFor(() => {
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Coinbase Prod',
        )
      })
      expect(valueOf(SECRET_LABEL)).toContain('••••••••…xyz')
      expect(valueOf(ENVIRONMENT_LABEL)).toContain(MAINNET_VALUE)
      expect(valueOf(NETWORKS_LABEL)).toContain('Base')
      expect(valueOf(SVM_LABEL)).toContain('-')
      expect(valueOf(AUTO_CREATE_LABEL)).toContain(NO_VALUE)
    })
  })

  describe('GIVEN the connection is deleted', () => {
    const deleteAndRunCallback = async () => {
      const user = userEvent.setup()

      await renderIntegrationPage(X402IntegrationDetails, {
        useParams: { integrationId: 'connection-id' },
      })
      await user.click(screen.getByText('Actions'))
      await user.click(screen.getByText(DELETE_ACTION))

      const { callback } = mockOpenDeleteDialog.mock.calls[0][0]

      act(() => callback())
    }

    it('WHEN other connections remain THEN goes back to the connections list', async () => {
      mockQueryResult.mockReturnValue(buildQueryResult(1))

      await deleteAndRunCallback()

      expect(testMockNavigateFn).toHaveBeenCalledWith(
        generatePath(X402_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
        }),
      )
      expect(testMockNavigateFn).not.toHaveBeenCalledWith(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )
    })

    it('WHEN it was the last one THEN goes back to the integrations', async () => {
      mockQueryResult.mockReturnValue(buildQueryResult(0))

      await deleteAndRunCallback()

      expect(testMockNavigateFn).toHaveBeenCalledWith(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )
      expect(testMockNavigateFn).not.toHaveBeenCalledWith(
        generatePath(X402_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
        }),
      )
    })
  })

  describe('GIVEN the page is loading', () => {
    it('THEN shows skeletons and no field', async () => {
      mockQueryResult.mockReturnValue({ data: undefined, loading: true })

      const { container } = await renderIntegrationPage(X402IntegrationDetails, {
        useParams: { integrationId: 'connection-id' },
      })

      expect(screen.queryByText(SECRET_LABEL)).not.toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })
})
