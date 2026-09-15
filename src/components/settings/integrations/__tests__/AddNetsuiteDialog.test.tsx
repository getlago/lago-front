import { act, cleanup, renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { LagoApiError, NetsuiteForCreateDialogDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useAddNetsuiteDialog } from '../AddNetsuiteDialog'

const mockDialogOpen = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockDestroyNango = jest.fn()

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
  useCreateNetsuiteIntegrationMutation: () => [mockCreate],
  useUpdateNetsuiteIntegrationMutation: () => [mockUpdate],
  useDestroyNangoIntegrationMutation: () => [mockDestroyNango],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const netsuiteProvider: NetsuiteForCreateDialogDialogFragment = {
  __typename: 'NetsuiteIntegration',
  id: 'netsuite-integration-id',
  name: 'Test Integration',
  code: 'test_integration',
  accountId: 'account-id',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  tokenId: 'token-id',
  tokenSecret: 'token-secret',
  scriptEndpointUrl: 'https://example.com/script',
  syncCreditNotes: true,
  syncInvoices: true,
  syncPayments: true,
}

describe('useAddNetsuiteDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
  })

  describe('GIVEN the backend rejects the update for a duplicate code', () => {
    const submitEdition = async (): Promise<() => Promise<unknown>> => {
      mockUpdate.mockResolvedValue({
        errors: [{ extensions: { details: { code: [LagoApiError.ValueAlreadyExist] } } }],
      })

      const { result } = renderHook(() => useAddNetsuiteDialog(), { wrapper })

      act(() => {
        result.current.openAddNetsuiteDialog({ provider: netsuiteProvider })
      })

      const dialogProps = mockDialogOpen.mock.calls[0][0]

      await act(() => render(<>{dialogProps.children}</>))

      return dialogProps.form.submit
    }

    describe('WHEN submitting the dialog', () => {
      it('THEN surfaces the shared duplicate-code message under the code input', async () => {
        const submit = await submitEdition()

        await act(async () => {
          await expect(submit()).rejects.toThrow()
        })

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
      })
    })
  })
})
