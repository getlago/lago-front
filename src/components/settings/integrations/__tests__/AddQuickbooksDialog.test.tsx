import { act, cleanup, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { LagoApiError, QuickbooksForCreateDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { describeDuplicateRejectionRouting, rejectedUnder } from './duplicateRejectionHelpers'

import { useAddQuickbooksDialog } from '../AddQuickbooksDialog'

const mockDialogOpen = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockDestroyNango = jest.fn()
const mockNangoAuth = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

// `QuickbooksIntegrationDetails`, reached through the dialog's route import, pulls in
// @nangohq/frontend, which jest cannot load as ESM.
jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ auth: mockNangoAuth })),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/components/dialogs/FormDialogOpeningDialog', () => ({
  useFormDialogOpeningDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

// Identity translate so the surfaced error renders as its message key and can be
// asserted through the exported constant (never a raw translation literal).
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateQuickbooksIntegrationMutation: () => [mockCreate],
  useUpdateQuickbooksIntegrationMutation: () => [mockUpdate],
  useDestroyNangoIntegrationMutation: () => [mockDestroyNango],
}))

const NAME_PLACEHOLDER = 'text_6584550dc4cec7adf861504f'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const quickbooksProvider: QuickbooksForCreateDialogFragment = {
  __typename: 'QuickbooksIntegration',
  id: 'quickbooks-integration-id',
  name: 'Test Integration',
  code: 'test_integration',
  connectionId: 'connection-id',
  sandbox: true,
  syncCreditNotes: true,
  syncInvoices: true,
  syncPayments: true,
}

const openDialog = async (
  provider?: QuickbooksForCreateDialogFragment,
): Promise<() => Promise<unknown>> => {
  const { result } = renderHook(() => useAddQuickbooksDialog(), { wrapper })

  act(() => {
    result.current.openAddQuickbooksDialog(provider ? { provider } : undefined)
  })

  const dialogProps = mockDialogOpen.mock.calls[0][0]

  await act(() => render(<>{dialogProps.children}</>))

  return dialogProps.form.submit
}

describe('useAddQuickbooksDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
    mockNangoAuth.mockResolvedValue({ connectionId: 'connection-id' })
    mockCreate.mockResolvedValue({ data: { createQuickbooksIntegration: { id: 'new-id' } } })
  })

  describeDuplicateRejectionRouting('update', async (detailsKey) => {
    mockUpdate.mockResolvedValue(rejectedUnder(detailsKey))

    return openDialog(quickbooksProvider)
  })

  describe('GIVEN a new connection', () => {
    describe('WHEN the sandbox switch is on', () => {
      it('THEN authenticates with the sandbox Nango integration and creates a sandbox connection', async () => {
        const submit = await openDialog()

        await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')
        await userEvent.click(screen.getByRole('checkbox', { name: 'sandbox' }))

        await act(async () => {
          await submit().catch(() => undefined)
        })

        expect(mockNangoAuth).toHaveBeenCalledWith('quickbooks-sandbox', expect.any(String))
        expect(mockCreate).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              name: 'QuickBooks',
              code: 'quickbooks',
              sandbox: true,
              connectionId: mockNangoAuth.mock.calls[0][1],
            }),
          },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })
      })
    })

    describe('WHEN the sandbox switch is off', () => {
      it('THEN authenticates with the production Nango integration', async () => {
        const submit = await openDialog()

        await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

        await act(async () => {
          await submit().catch(() => undefined)
        })

        expect(mockNangoAuth).toHaveBeenCalledWith('quickbooks', expect.any(String))
        expect(mockCreate).toHaveBeenCalledWith({
          variables: { input: expect.objectContaining({ sandbox: false }) },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })
      })
    })
  })

  describe('GIVEN the QuickBooks authentication fails', () => {
    it('THEN shows an error toast and creates nothing', async () => {
      mockNangoAuth.mockRejectedValue(new Error('closed'))

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(mockCreate).not.toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
    })
  })

  describe('GIVEN the create is refused after the QuickBooks login', () => {
    it('THEN reuses the authorized connection on the next submit', async () => {
      mockCreate.mockResolvedValueOnce(rejectedUnder('code'))

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      const codeInput = screen.getByPlaceholderText('text_6584550dc4cec7adf8615053')

      await userEvent.clear(codeInput)
      await userEvent.type(codeInput, 'quickbooks_2')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(mockNangoAuth).toHaveBeenCalledTimes(1)
      expect(mockCreate).toHaveBeenCalledTimes(2)
      expect(mockCreate.mock.calls[1][0].variables.input.connectionId).toBe(
        mockNangoAuth.mock.calls[0][1],
      )
    })
  })

  describe('GIVEN the create is refused for the QuickBooks connection itself', () => {
    it('THEN asks for a new QuickBooks login on the next submit', async () => {
      mockCreate.mockResolvedValueOnce({
        errors: [{ message: 'error', extensions: { code: 'third_party_error' } }],
      })

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })
      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(mockNangoAuth).toHaveBeenCalledTimes(2)
      expect(mockCreate.mock.calls[1][0].variables.input.connectionId).not.toBe(
        mockCreate.mock.calls[0][0].variables.input.connectionId,
      )
    })
  })

  describe('GIVEN the QuickBooks login window is closed', () => {
    it('THEN creates nothing and shows no error', async () => {
      mockNangoAuth.mockRejectedValueOnce(
        Object.assign(new Error('closed'), { type: 'window_closed' }),
      )

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(mockCreate).not.toHaveBeenCalled()
      expect(addToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the QuickBooks company is already connected', () => {
    it('THEN explains it and asks for a new login on the next submit', async () => {
      mockCreate.mockResolvedValueOnce(rejectedUnder('realmId'))

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'danger',
          translateKey: 'text_1795442089878h1a9gppfypr',
        }),
      )
      expect(addToast).toHaveBeenCalledTimes(1)

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(mockNangoAuth).toHaveBeenCalledTimes(2)
      expect(mockCreate.mock.calls[1][0].variables.input.connectionId).not.toBe(
        mockCreate.mock.calls[0][0].variables.input.connectionId,
      )
    })
  })

  describe('GIVEN the create is refused for another reason', () => {
    it('THEN shows the generic error toast', async () => {
      mockCreate.mockResolvedValueOnce({
        errors: [{ message: 'forbidden', extensions: { code: LagoApiError.Forbidden } }],
      })

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        }),
      )
    })
  })

  describe('GIVEN the create fails with an error the error link already reports', () => {
    it('THEN adds no second toast', async () => {
      mockCreate.mockResolvedValueOnce({
        errors: [{ message: 'not found', extensions: { code: LagoApiError.NotFound } }],
      })

      const submit = await openDialog()

      await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'QuickBooks')

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(addToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the edit fails on the network', () => {
    it('THEN shows an error toast', async () => {
      mockUpdate.mockRejectedValue(new Error('Network error'))

      const submit = await openDialog(quickbooksProvider)

      await act(async () => {
        await submit().catch(() => undefined)
      })

      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
    })
  })

  describe('GIVEN the delete from the edit dialog is refused', () => {
    it('THEN rejects so the error toast shows', async () => {
      mockDestroyNango.mockResolvedValue({ data: { destroyIntegration: null } })

      const { result } = renderHook(() => useAddQuickbooksDialog(), { wrapper })

      act(() => {
        result.current.openAddQuickbooksDialog({ provider: quickbooksProvider })
      })

      const { otherDialogProps } = mockDialogOpen.mock.calls[0][0]

      await expect(otherDialogProps.onAction()).rejects.toThrow()
    })
  })

  describe('GIVEN the delete from the edit dialog fails on the network', () => {
    it('THEN keeps the confirm dialog open and shows an error toast', () => {
      const { result } = renderHook(() => useAddQuickbooksDialog(), { wrapper })

      act(() => {
        result.current.openAddQuickbooksDialog({ provider: quickbooksProvider })
      })

      const { otherDialogProps } = mockDialogOpen.mock.calls[0][0]

      expect(otherDialogProps.closeOnError).toBe(false)

      otherDialogProps.onError(new Error('Network error'))

      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
    })
  })

  describe('GIVEN an existing connection', () => {
    it('THEN keeps the saved values when the host re-renders', async () => {
      const { result, rerender } = renderHook(() => useAddQuickbooksDialog(), { wrapper })

      act(() => {
        result.current.openAddQuickbooksDialog({ provider: quickbooksProvider })
      })
      rerender()

      await act(() => render(<>{mockDialogOpen.mock.calls[0][0].children}</>))

      expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toHaveValue('Test Integration')
      expect(screen.getByPlaceholderText('text_6584550dc4cec7adf8615053')).toHaveValue(
        'test_integration',
      )
    })

    it('THEN locks the sandbox switch', async () => {
      await openDialog(quickbooksProvider)

      expect(screen.getByRole('checkbox', { name: 'sandbox' })).toBeDisabled()
    })

    describe('WHEN saving the edit', () => {
      it('THEN updates without the environment', async () => {
        mockUpdate.mockResolvedValue({ data: { updateQuickbooksIntegration: { id: 'id' } } })

        const submit = await openDialog(quickbooksProvider)

        await act(async () => {
          await submit().catch(() => undefined)
        })

        expect(mockNangoAuth).not.toHaveBeenCalled()
        expect(mockUpdate).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'quickbooks-integration-id',
              name: 'Test Integration',
              code: 'test_integration',
              syncCreditNotes: true,
              syncInvoices: true,
              syncPayments: true,
            },
          },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })
      })
    })
  })
})
