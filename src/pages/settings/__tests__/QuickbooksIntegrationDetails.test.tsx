import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'

import { renderIntegrationPage } from './integrationTestHelpers'

import QuickbooksIntegrationDetails from '../QuickbooksIntegrationDetails'

const mockNangoAuth = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ auth: mockNangoAuth })),
}))
jest.mock('~/components/settings/integrations/AddQuickbooksDialog', () => ({
  useAddQuickbooksDialog: () => ({ openAddQuickbooksDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/DeleteQuickbooksIntegrationDialog', () => ({
  useDeleteQuickbooksIntegrationDialog: () => ({
    openDeleteQuickbooksIntegrationDialog: jest.fn(),
  }),
}))
jest.mock('~/components/settings/integrations/QuickbooksIntegrationSettings', () => ({
  __esModule: true,
  default: () => null,
}))
const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))
const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetQuickbooksIntegrationsDetailsQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

describe('QuickbooksIntegrationDetails', () => {
  beforeEach(() => mockHasPermissions.mockReturnValue(true))
  afterEach(cleanup)

  describe('GIVEN the page is rendered with data', () => {
    it('THEN renders integration name in header when loaded', async () => {
      mockQueryResult.mockReturnValue({
        data: {
          integration: {
            __typename: 'QuickbooksIntegration',
            id: 'test-id',
            name: 'Test Integration',
            connectionId: 'quickbooks-conn-123',
            sandbox: false,
          },
          integrations: { __typename: 'IntegrationCollection', collection: [] },
        },
        loading: false,
      })

      await renderIntegrationPage(QuickbooksIntegrationDetails, {
        useParams: { integrationId: 'test-id' },
      })

      await waitFor(() => {
        const viewName = screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)

        expect(viewName[0]).toHaveTextContent('Test Integration')
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    it('THEN renders loading state', async () => {
      mockQueryResult.mockReturnValue({ data: undefined, loading: true })

      const { container } = await renderIntegrationPage(QuickbooksIntegrationDetails, {
        useParams: { integrationId: 'test-id' },
      })

      expect(screen.queryByText('Test Integration')).not.toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('GIVEN a sandbox connection', () => {
    describe('WHEN re-authenticating', () => {
      it('THEN opens the sandbox Nango integration for the same connection', async () => {
        mockNangoAuth.mockResolvedValue({})
        mockQueryResult.mockReturnValue({
          data: {
            integration: {
              __typename: 'QuickbooksIntegration',
              id: 'test-id',
              name: 'Test Integration',
              connectionId: 'quickbooks-conn-123',
              sandbox: true,
            },
            integrations: { __typename: 'IntegrationCollection', collection: [] },
          },
          loading: false,
        })

        await renderIntegrationPage(QuickbooksIntegrationDetails, {
          useParams: { integrationId: 'test-id' },
        })

        await userEvent.click(await screen.findByRole('button', { name: /Actions/ }))
        await userEvent.click(await screen.findByRole('button', { name: /Re-authenticate/ }))

        await waitFor(() => {
          expect(mockNangoAuth).toHaveBeenCalledWith('quickbooks-sandbox', 'quickbooks-conn-123')
        })
      })
    })
  })

  describe('GIVEN the re-authentication window is closed', () => {
    it('THEN shows no toast', async () => {
      mockAddToast.mockClear()
      mockNangoAuth.mockRejectedValue(Object.assign(new Error('closed'), { type: 'window_closed' }))
      mockQueryResult.mockReturnValue({
        data: {
          integration: {
            __typename: 'QuickbooksIntegration',
            id: 'test-id',
            name: 'Test Integration',
            connectionId: 'quickbooks-conn-123',
            sandbox: false,
          },
          integrations: { __typename: 'IntegrationCollection', collection: [] },
        },
        loading: false,
      })

      await renderIntegrationPage(QuickbooksIntegrationDetails, {
        useParams: { integrationId: 'test-id' },
      })

      await userEvent.click(await screen.findByRole('button', { name: /Actions/ }))
      await userEvent.click(await screen.findByRole('button', { name: /Re-authenticate/ }))

      await waitFor(() =>
        expect(mockNangoAuth).toHaveBeenCalledWith('quickbooks', 'quickbooks-conn-123'),
      )
      expect(mockAddToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a member without integration permissions', () => {
    it('THEN hides the actions menu', async () => {
      mockHasPermissions.mockReturnValue(false)
      mockQueryResult.mockReturnValue({
        data: {
          integration: {
            __typename: 'QuickbooksIntegration',
            id: 'test-id',
            name: 'Test Integration',
            connectionId: 'quickbooks-conn-123',
            sandbox: true,
          },
          integrations: { __typename: 'IntegrationCollection', collection: [] },
        },
        loading: false,
      })

      await renderIntegrationPage(QuickbooksIntegrationDetails, {
        useParams: { integrationId: 'test-id' },
      })

      expect(await screen.findByText('Test Integration')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Actions/ })).not.toBeInTheDocument()
    })
  })
})
