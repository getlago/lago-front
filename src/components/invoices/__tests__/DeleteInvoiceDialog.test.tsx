import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { AllTheProviders } from '~/test-utils'

import { useDeleteInvoiceDialog } from '../DeleteInvoiceDialog'

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({
    open: mockDialogOpen,
  }),
}))

const mockDeleteInvoice = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDeleteInvoiceMutation: () => [mockDeleteInvoice],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const successResult = { data: { deleteInvoice: { id: 'invoice-1' } } }

describe('useDeleteInvoiceDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns an openDeleteInvoiceDialog function', () => {
    const { result } = renderHook(() => useDeleteInvoiceDialog(), { wrapper })

    expect(typeof result.current.openDeleteInvoiceDialog).toBe('function')
  })

  it('opens a danger dialog with title, description and action text', () => {
    const { result } = renderHook(() => useDeleteInvoiceDialog(), { wrapper })

    act(() => {
      result.current.openDeleteInvoiceDialog({ id: 'invoice-1' })
    })

    expect(mockDialogOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        colorVariant: 'danger',
        cancelOrCloseText: 'cancel',
        title: expect.any(String),
        description: expect.any(String),
        actionText: expect.any(String),
      }),
    )
  })

  describe('when the deletion succeeds', () => {
    it('calls the mutation with the invoice id', async () => {
      mockDeleteInvoice.mockResolvedValueOnce(successResult)

      const { result } = renderHook(() => useDeleteInvoiceDialog(), { wrapper })

      act(() => {
        result.current.openDeleteInvoiceDialog({ id: 'invoice-42' })
      })

      await act(async () => {
        await mockDialogOpen.mock.calls[0][0].onAction()
      })

      expect(mockDeleteInvoice).toHaveBeenCalledWith({
        variables: { input: { id: 'invoice-42' } },
      })
    })

    it('shows a success toast and runs the callback', async () => {
      mockDeleteInvoice.mockResolvedValueOnce(successResult)
      const callback = jest.fn()

      const { result } = renderHook(() => useDeleteInvoiceDialog(), { wrapper })

      act(() => {
        result.current.openDeleteInvoiceDialog({ id: 'invoice-1' }, callback)
      })

      await act(async () => {
        await mockDialogOpen.mock.calls[0][0].onAction()
      })

      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('when the deletion returns no invoice', () => {
    it('does not toast or run the callback', async () => {
      mockDeleteInvoice.mockResolvedValueOnce({ data: { deleteInvoice: null } })
      const callback = jest.fn()

      const { result } = renderHook(() => useDeleteInvoiceDialog(), { wrapper })

      act(() => {
        result.current.openDeleteInvoiceDialog({ id: 'invoice-1' }, callback)
      })

      await act(async () => {
        await mockDialogOpen.mock.calls[0][0].onAction()
      })

      expect(addToast).not.toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
    })
  })

  it('falls back to an empty id when no invoice is passed', async () => {
    mockDeleteInvoice.mockResolvedValueOnce(successResult)

    const { result } = renderHook(() => useDeleteInvoiceDialog(), { wrapper })

    act(() => {
      result.current.openDeleteInvoiceDialog(null)
    })

    await act(async () => {
      await mockDialogOpen.mock.calls[0][0].onAction()
    })

    expect(mockDeleteInvoice).toHaveBeenCalledWith({
      variables: { input: { id: '' } },
    })
  })
})
