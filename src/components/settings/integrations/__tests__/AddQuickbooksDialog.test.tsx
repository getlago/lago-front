import { act, cleanup, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { MappingTypeEnum, QuickbooksForCreateDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { describeDuplicateRejectionRouting, rejectedUnder } from './duplicateRejectionHelpers'

import { useAddQuickbooksDialog } from '../AddQuickbooksDialog'

const mockDialogOpen = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockDestroyNango = jest.fn()
const mockNangoAuth = jest.fn()
const mockGetCollectionMappings = jest.fn()

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
  useGetQuickbooksFallbackItemMappingLazyQuery: () => [mockGetCollectionMappings],
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

const collectionMappings = (mappingTypes: MappingTypeEnum[]) => ({
  data: {
    integrationCollectionMappings: {
      collection: mappingTypes.map((mappingType, index) => ({
        id: `mapping-${index}`,
        mappingType,
      })),
    },
  },
})

const syncInvoicesCheckbox = (): HTMLInputElement | null =>
  document.querySelector('input[aria-labelledby="syncInvoices"]')

const openDialog = async (
  provider?: QuickbooksForCreateDialogFragment,
): Promise<() => Promise<unknown>> => {
  const { result } = renderHook(() => useAddQuickbooksDialog(), { wrapper })

  act(() => {
    result.current.openAddQuickbooksDialog(provider ? { provider } : undefined)
  })

  await waitFor(() => expect(mockDialogOpen).toHaveBeenCalled())

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
    mockGetCollectionMappings.mockResolvedValue(collectionMappings([]))
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
    it('THEN keeps the confirm dialog open and shows an error toast', async () => {
      const { result } = renderHook(() => useAddQuickbooksDialog(), { wrapper })

      act(() => {
        result.current.openAddQuickbooksDialog({ provider: quickbooksProvider })
      })

      await waitFor(() => expect(mockDialogOpen).toHaveBeenCalled())

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

  describe('GIVEN the invoices sync', () => {
    it('THEN cannot be turned on for a new connection', async () => {
      await openDialog()

      expect(mockGetCollectionMappings).not.toHaveBeenCalled()
      expect(syncInvoicesCheckbox()).toBeDisabled()
    })

    it('THEN cannot be turned on while no fallback item is mapped', async () => {
      mockGetCollectionMappings.mockResolvedValue(collectionMappings([MappingTypeEnum.Coupon]))

      await openDialog({ ...quickbooksProvider, syncInvoices: false })

      expect(mockGetCollectionMappings).toHaveBeenCalledWith({
        variables: { integrationId: 'quickbooks-integration-id' },
      })
      expect(syncInvoicesCheckbox()).toBeDisabled()
    })

    it('THEN can be turned on once a fallback item is mapped', async () => {
      mockGetCollectionMappings.mockResolvedValue(
        collectionMappings([MappingTypeEnum.FallbackItem]),
      )

      await openDialog({ ...quickbooksProvider, syncInvoices: false })

      expect(syncInvoicesCheckbox()).toBeEnabled()
    })

    it('THEN can still be turned off when already on without a fallback item', async () => {
      await openDialog(quickbooksProvider)

      expect(syncInvoicesCheckbox()).toBeEnabled()
    })
  })
})
