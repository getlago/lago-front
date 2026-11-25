import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetQuickbooksIntegrationsListDocument, IntegrationTypeEnum } from '~/generated/graphql'

import {
  createIntegrationListLoadingMock,
  createIntegrationListMock,
  renderIntegrationPage,
} from './integrationTestHelpers'

import QuickbooksIntegrations, {
  QUICKBOOKS_INTEGRATION_ITEM_OPTIONS_TEST_ID,
} from '../QuickbooksIntegrations'

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn(),
}))
const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))
const mockOpenAdd = jest.fn()
const mockOpenDelete = jest.fn()

jest.mock('~/components/settings/integrations/AddQuickbooksDialog', () => ({
  useAddQuickbooksDialog: () => ({ openAddQuickbooksDialog: mockOpenAdd }),
}))
jest.mock('~/components/settings/integrations/DeleteQuickbooksIntegrationDialog', () => ({
  useDeleteQuickbooksIntegrationDialog: () => ({
    openDeleteQuickbooksIntegrationDialog: mockOpenDelete,
  }),
}))

describe('QuickbooksIntegrations', () => {
  beforeEach(() => mockHasPermissions.mockReturnValue(true))
  afterEach(cleanup)

  describe('GIVEN the page is rendered with data', () => {
    it('THEN renders connection items when data is loaded', async () => {
      await renderIntegrationPage(QuickbooksIntegrations, {
        mocks: createIntegrationListMock(
          GetQuickbooksIntegrationsListDocument,
          IntegrationTypeEnum.Quickbooks,
          'QuickbooksIntegration',
        ),
      })

      await waitFor(() => {
        expect(screen.getByText('Test Connection')).toBeInTheDocument()
        expect(screen.getByText('test-code')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    it('THEN shows loading skeletons while fetching', async () => {
      const { container } = await renderIntegrationPage(QuickbooksIntegrations, {
        mocks: createIntegrationListLoadingMock(
          GetQuickbooksIntegrationsListDocument,
          IntegrationTypeEnum.Quickbooks,
        ),
      })

      expect(screen.queryByText('Test Connection')).not.toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('GIVEN a connection row menu', () => {
    it.each([
      ['Edit connection', () => mockOpenAdd],
      ['Delete connection', () => mockOpenDelete],
    ])('THEN %s opens its dialog for that connection', async (label, getMock) => {
      await renderIntegrationPage(QuickbooksIntegrations, {
        mocks: createIntegrationListMock(
          GetQuickbooksIntegrationsListDocument,
          IntegrationTypeEnum.Quickbooks,
          'QuickbooksIntegration',
        ),
      })

      await userEvent.click(await screen.findByTestId(QUICKBOOKS_INTEGRATION_ITEM_OPTIONS_TEST_ID))
      await userEvent.click(await screen.findByRole('button', { name: label }))

      expect(getMock()).toHaveBeenCalledWith(
        expect.objectContaining({ provider: expect.objectContaining({ id: 'test-id-1' }) }),
      )
    })
  })

  describe('GIVEN a member without integration permissions', () => {
    it('THEN hides the connect action and the row menu', async () => {
      mockHasPermissions.mockReturnValue(false)

      await renderIntegrationPage(QuickbooksIntegrations, {
        mocks: createIntegrationListMock(
          GetQuickbooksIntegrationsListDocument,
          IntegrationTypeEnum.Quickbooks,
          'QuickbooksIntegration',
        ),
      })

      expect(await screen.findByText('Test Connection')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add a connection' })).not.toBeInTheDocument()
      expect(
        screen.queryByTestId(QUICKBOOKS_INTEGRATION_ITEM_OPTIONS_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })
})
