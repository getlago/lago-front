import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetQuickbooksIntegrationsListDocument, IntegrationTypeEnum } from '~/generated/graphql'

import {
  createIntegrationListLoadingMock,
  createIntegrationListMock,
  renderIntegrationPage,
} from './integrationTestHelpers'

import QuickbooksIntegrations from '../QuickbooksIntegrations'

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn(),
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

      await userEvent.click(await screen.findByTestId('plan-item-options'))
      await userEvent.click(await screen.findByRole('button', { name: label }))

      expect(getMock()).toHaveBeenCalledWith(
        expect.objectContaining({ provider: expect.objectContaining({ id: 'test-id-1' }) }),
      )
    })
  })
})
