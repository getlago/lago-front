import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast, initializeTranslations } from '~/core/apolloClient'
import { DeleteX402IntegrationDialogFragment } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useDeleteX402IntegrationDialog } from '../DeleteX402IntegrationDialog'

const mockDialogOpen = jest.fn()
const mockDeleteConnection = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDeleteX402ConnectionMutation: () => [mockDeleteConnection],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const connection: DeleteX402IntegrationDialogFragment = {
  __typename: 'X402ConnectionObject',
  id: 'connection-id',
  name: 'Coinbase Prod',
}

const openDialog = (callback = jest.fn()) => {
  const { result } = renderHook(() => useDeleteX402IntegrationDialog(), { wrapper })

  act(() => {
    result.current.openDeleteX402IntegrationDialog({ connection, callback })
  })

  return mockDialogOpen.mock.calls[0][0]
}

describe('useDeleteX402IntegrationDialog', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN the deletion succeeds', () => {
    it('THEN runs the callback and confirms with a toast', async () => {
      mockDeleteConnection.mockResolvedValue({
        data: { destroyX402Connection: { id: 'connection-id' } },
      })
      const callback = jest.fn()
      const dialog = openDialog(callback)

      await act(() => dialog.onAction())

      expect(mockDeleteConnection).toHaveBeenCalledWith({
        variables: { input: { id: 'connection-id' } },
      })
      expect(callback).toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })
  })

  describe('GIVEN the request fails on the network', () => {
    it('THEN keeps the dialog open and says it failed', async () => {
      mockDeleteConnection.mockRejectedValue(new Error('Network error'))
      const callback = jest.fn()
      const dialog = openDialog(callback)

      expect(dialog.closeOnError).toBe(false)
      await expect(dialog.onAction()).rejects.toThrow('Network error')

      act(() => dialog.onError(new Error('Network error')))

      expect(callback).not.toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith({
        message: 'Something went wrong',
        severity: 'danger',
      })
    })
  })
})
