import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { generatePath } from 'react-router'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { initializeTranslations } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, X402_INTEGRATION_ROUTE } from '~/core/router'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

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
const EDIT_ACTION = 'Edit connection'

const mockOpenDeleteDialog = jest.fn()
const mockOpenAddDialog = jest.fn()

jest.mock('~/components/settings/integrations/AddX402Dialog', () => ({
  useAddX402Dialog: () => ({ openAddX402Dialog: mockOpenAddDialog }),
}))
jest.mock('~/components/settings/integrations/DeleteX402IntegrationDialog', () => ({
  useDeleteX402IntegrationDialog: () => ({
    openDeleteX402IntegrationDialog: mockOpenDeleteDialog,
  }),
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

const buildQueryResult = (otherConnections: number, allowedOrigins = ['https://example.com']) => ({
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
      allowedOrigins,
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

const PageWithHeader = () => (
  <>
    <MainHeader />
    <X402IntegrationDetails />
  </>
)

const valueOf = (label: string): string | null | undefined =>
  screen.getByText(label).parentElement?.textContent

describe('X402IntegrationDetails', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()
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

  describe('GIVEN the connection was just edited without renaming it', () => {
    it('WHEN reopening the edit action from the header THEN it opens on the saved values', async () => {
      const user = userEvent.setup()

      mockQueryResult.mockReturnValue(buildQueryResult(0))
      // One component type across renders, so the rerender updates the page like a refetch
      // does instead of mounting a fresh header.
      const { rerender } = render(<PageWithHeader />, {
        wrapper: ({ children }) => (
          <AllTheProviders useParams={{ integrationId: 'connection-id' }}>
            {children}
          </AllTheProviders>
        ),
      })

      mockQueryResult.mockReturnValue(buildQueryResult(0, ['https://saved.example.com']))
      await act(async () => {
        rerender(<PageWithHeader />)
      })

      await user.click(screen.getByText('Actions'))
      await user.click(screen.getByText(EDIT_ACTION))

      expect(mockOpenAddDialog).toHaveBeenLastCalledWith({
        connection: expect.objectContaining({ allowedOrigins: ['https://saved.example.com'] }),
      })
    })
  })

  describe('GIVEN cached data while the query refreshes', () => {
    it('THEN keeps showing the fields instead of skeletons', async () => {
      mockQueryResult.mockReturnValue({ ...buildQueryResult(0), loading: true })

      const { container } = await renderIntegrationPage(X402IntegrationDetails, {
        useParams: { integrationId: 'connection-id' },
      })

      expect(valueOf(SECRET_LABEL)).toContain('••••••••…xyz')
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
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
