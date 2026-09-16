import { act, cleanup, renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { LagoApiError, SalesforceForCreateDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useAddSalesforceDialog } from '../AddSalesforceDialog'

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
  useCreateSalesforceIntegrationMutation: () => [mockCreate],
  useUpdateSalesforceIntegrationMutation: () => [mockUpdate],
  useDestroyNangoIntegrationMutation: () => [mockDestroyNango],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const salesforceProvider: SalesforceForCreateDialogFragment = {
  __typename: 'SalesforceIntegration',
  id: 'salesforce-integration-id',
  name: 'Test Integration',
  code: 'test_integration',
  instanceId: 'instance-id',
}

describe('useAddSalesforceDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
  })

  const submitEdition = async (detailsKey: string): Promise<() => Promise<unknown>> => {
    mockUpdate.mockResolvedValue({
      errors: [{ extensions: { details: { [detailsKey]: [LagoApiError.ValueAlreadyExist] } } }],
    })

    const { result } = renderHook(() => useAddSalesforceDialog(), { wrapper })

    act(() => {
      result.current.openAddSalesforceDialog({ provider: salesforceProvider })
    })

    const dialogProps = mockDialogOpen.mock.calls[0][0]

    await act(() => render(<>{dialogProps.children}</>))

    return dialogProps.form.submit
  }

  describe('GIVEN the backend rejects the update for a duplicate code', () => {
    describe('WHEN submitting the dialog', () => {
      it('THEN surfaces the shared duplicate-code message under the code input', async () => {
        const submit = await submitEdition('code')

        await act(async () => {
          await expect(submit()).rejects.toThrow()
        })

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the backend reports the collision under another unique field', () => {
    describe('WHEN submitting the dialog', () => {
      it('THEN leaves the code input clean', async () => {
        const submit = await submitEdition('externalId')

        await act(async () => {
          await expect(submit()).rejects.toThrow()
        })

        expect(screen.queryByText(EXISTING_CODE_ERROR_MESSAGE)).not.toBeInTheDocument()
      })
    })
  })
})
