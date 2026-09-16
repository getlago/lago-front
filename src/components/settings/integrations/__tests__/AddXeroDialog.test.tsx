import { act, cleanup, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { XeroForCreateDialogDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { describeDuplicateRejectionRouting, rejectedUnder } from './duplicateRejectionHelpers'

import { useAddXeroDialog } from '../AddXeroDialog'

const mockDialogOpen = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockDestroyNango = jest.fn()

// `XeroIntegrationDetails`, reached through the dialog's route import, pulls in
// @nangohq/frontend, which jest cannot load as ESM.
jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn(),
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
  useCreateXeroIntegrationMutation: () => [mockCreate],
  useUpdateXeroIntegrationMutation: () => [mockUpdate],
  useDestroyNangoIntegrationMutation: () => [mockDestroyNango],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const xeroProvider: XeroForCreateDialogDialogFragment = {
  __typename: 'XeroIntegration',
  id: 'xero-integration-id',
  name: 'Test Integration',
  code: 'test_integration',
  connectionId: 'connection-id',
  hasMappingsConfigured: true,
  syncCreditNotes: true,
  syncInvoices: true,
  syncPayments: true,
}

describe('useAddXeroDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
  })

  describeDuplicateRejectionRouting('update', async (detailsKey) => {
    mockUpdate.mockResolvedValue(rejectedUnder(detailsKey))

    const { result } = renderHook(() => useAddXeroDialog(), { wrapper })

    act(() => {
      result.current.openAddXeroDialog({ provider: xeroProvider })
    })

    const dialogProps = mockDialogOpen.mock.calls[0][0]

    await act(() => render(<>{dialogProps.children}</>))

    return dialogProps.form.submit
  })
})
