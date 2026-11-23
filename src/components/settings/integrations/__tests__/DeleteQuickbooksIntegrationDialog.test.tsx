import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { AllTheProviders } from '~/test-utils'

import { useDeleteQuickbooksIntegrationDialog } from '../DeleteQuickbooksIntegrationDialog'

const mockDialogOpen = jest.fn()
const mockDestroy = jest.fn()
const mockCallback = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDestroyNangoIntegrationMutation: () => [mockDestroy],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const openDialog = () => {
  const { result } = renderHook(() => useDeleteQuickbooksIntegrationDialog(), { wrapper })

  act(() => {
    result.current.openDeleteQuickbooksIntegrationDialog({
      provider: { __typename: 'QuickbooksIntegration', id: 'quickbooks-id', name: 'QuickBooks' },
      callback: mockCallback,
    })
  })

  return mockDialogOpen.mock.calls[0][0]
}

describe('useDeleteQuickbooksIntegrationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the delete succeeds', () => {
    it('THEN runs the callback', async () => {
      mockDestroy.mockResolvedValue({ data: { destroyIntegration: { id: 'quickbooks-id' } } })

      const dialogProps = openDialog()

      await act(() => dialogProps.onAction())

      expect(mockDestroy).toHaveBeenCalledWith({
        variables: { input: { id: 'quickbooks-id' } },
      })
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN the delete fails on the network', () => {
    it('THEN keeps the dialog open, skips the callback and shows an error toast', async () => {
      mockDestroy.mockRejectedValue(new Error('Network error'))

      const dialogProps = openDialog()

      expect(dialogProps.closeOnError).toBe(false)

      await act(async () => {
        await expect(dialogProps.onAction()).rejects.toThrow('Network error')
      })
      dialogProps.onError(new Error('Network error'))

      expect(mockCallback).not.toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
    })
  })
})
