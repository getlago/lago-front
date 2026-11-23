import { act, cleanup, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { QuickbooksForCreateDialogFragment } from '~/generated/graphql'
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
        })
      })
    })
  })
})
