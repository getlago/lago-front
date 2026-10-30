import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { generatePath } from 'react-router'

import { X402_TEST_CATALOG } from '~/components/settings/integrations/__tests__/x402NetworksFixture'
import { initializeTranslations } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { testMockNavigateFn } from '~/test-utils'

import { renderIntegrationPage } from './integrationTestHelpers'

import X402Integrations from '../X402Integrations'

const EDIT_ACTION = 'Edit connection'
const DELETE_ACTION = 'Delete connection'

const mockOpenAddDialog = jest.fn()
const mockOpenDeleteDialog = jest.fn()

jest.mock('~/hooks/useX402Networks', () => ({
  useX402Networks: () => ({
    networks: jest.requireActual('~/components/settings/integrations/__tests__/x402NetworksFixture')
      .X402_TEST_CATALOG,
    loading: false,
  }),
}))

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
  useGetX402IntegrationsListQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

const connection = {
  __typename: 'X402ConnectionObject',
  id: 'connection-id',
  name: 'Coinbase Devnet',
  code: 'coinbase_devnet',
}

const rowActionsButton = (): HTMLElement => {
  const button = screen.getByTestId('dots-horizontal/medium').closest('button')

  if (!button) throw new Error('No row actions button')

  return button
}

describe('X402Integrations', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()
    mockQueryResult.mockReturnValue({
      data: {
        x402Connections: {
          __typename: 'X402ConnectionObjectCollection',
          collection: [connection],
        },
      },
      loading: false,
    })
  })

  describe('GIVEN one connection', () => {
    it('THEN lists it by name and code', async () => {
      await renderIntegrationPage(X402Integrations)

      expect(screen.getByText('Coinbase Devnet')).toBeInTheDocument()
      expect(screen.getByText('coinbase_devnet')).toBeInTheDocument()
    })

    it('WHEN editing it THEN opens the dialog on that connection', async () => {
      const user = userEvent.setup()

      await renderIntegrationPage(X402Integrations)
      await user.click(rowActionsButton())
      await user.click(screen.getByText(EDIT_ACTION))

      expect(mockOpenAddDialog).toHaveBeenCalledWith({ connection, catalog: X402_TEST_CATALOG })
      expect(mockOpenDeleteDialog).not.toHaveBeenCalled()
    })

    it('WHEN deleting it THEN goes back to the integrations, since none is left', async () => {
      const user = userEvent.setup()

      await renderIntegrationPage(X402Integrations)
      await user.click(rowActionsButton())
      await user.click(screen.getByText(DELETE_ACTION))

      const { connection: deleted, callback } = mockOpenDeleteDialog.mock.calls[0][0]

      act(() => callback())

      expect(deleted).toEqual(connection)
      expect(testMockNavigateFn).toHaveBeenCalledWith(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )
    })
  })

  describe('GIVEN cached connections while the query refreshes', () => {
    it('THEN keeps showing them instead of skeletons', async () => {
      mockQueryResult.mockReturnValue({ ...mockQueryResult(), loading: true })

      const { container } = await renderIntegrationPage(X402Integrations)

      expect(screen.getByText('Coinbase Devnet')).toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the page is loading', () => {
    it('THEN shows skeletons', async () => {
      mockQueryResult.mockReturnValue({ data: undefined, loading: true })

      const { container } = await renderIntegrationPage(X402Integrations)

      expect(screen.queryByText('Coinbase Devnet')).not.toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })
})
