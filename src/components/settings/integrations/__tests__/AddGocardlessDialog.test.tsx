import { act, cleanup, renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { AddGocardlessProviderDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useAddGocardlessDialog } from '../AddGocardlessDialog'

const mockDialogOpen = jest.fn()
const mockUpdate = jest.fn()
const mockGetProviderByCode = jest.fn()
const mockDelete = jest.fn()

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
  useUpdateGocardlessApiKeyMutation: () => [mockUpdate],
  useGetProviderByCodeForGocardlessLazyQuery: () => [mockGetProviderByCode],
  useDeleteGocardlessMutation: () => [mockDelete],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const provider: AddGocardlessProviderDialogFragment = {
  __typename: 'GocardlessProvider',
  id: 'gocardless-provider-id',
  name: 'Test Integration',
  code: 'test_integration',
}

describe('useAddGocardlessDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
  })

  describe('GIVEN the code is already taken by another provider', () => {
    const submitEditionWithTakenCode = async (): Promise<() => Promise<unknown>> => {
      mockGetProviderByCode.mockResolvedValue({
        data: { paymentProvider: { id: 'another-provider-id' } },
      })

      const { result } = renderHook(() => useAddGocardlessDialog(), { wrapper })

      act(() => {
        result.current.openAddGocardlessDialog({ provider })
      })

      const dialogProps = mockDialogOpen.mock.calls[0][0]

      await act(() => render(<>{dialogProps.children}</>))

      return dialogProps.form.submit
    }

    describe('WHEN submitting the dialog', () => {
      it('THEN surfaces the shared duplicate-code message under the code input', async () => {
        const submit = await submitEditionWithTakenCode()

        await act(async () => {
          await expect(submit()).rejects.toThrow()
        })

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
      })

      it('THEN does not call the update mutation', async () => {
        const submit = await submitEditionWithTakenCode()

        await act(async () => {
          await expect(submit()).rejects.toThrow()
        })

        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })
  })
})
