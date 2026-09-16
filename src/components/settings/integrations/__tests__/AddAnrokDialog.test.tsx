import { act, cleanup, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { AddAnrokIntegrationDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { describeDuplicateRejectionRouting, rejectedUnder } from './duplicateRejectionHelpers'

import { useAddAnrokDialog } from '../AddAnrokDialog'

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
  useCreateAnrokIntegrationMutation: () => [mockCreate],
  useUpdateAnrokIntegrationMutation: () => [mockUpdate],
  useDestroyNangoIntegrationMutation: () => [mockDestroyNango],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const anrokIntegration: AddAnrokIntegrationDialogFragment = {
  __typename: 'AnrokIntegration',
  id: 'anrok-integration-id',
  name: 'Test Integration',
  code: 'test_integration',
  apiKey: 'api-key',
}

describe('useAddAnrokDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
  })

  describeDuplicateRejectionRouting('update', async (detailsKey) => {
    mockUpdate.mockResolvedValue(rejectedUnder(detailsKey))

    const { result } = renderHook(() => useAddAnrokDialog(), { wrapper })

    act(() => {
      result.current.openAddAnrokDialog({ integration: anrokIntegration })
    })

    const dialogProps = mockDialogOpen.mock.calls[0][0]

    await act(() => render(<>{dialogProps.children}</>))

    return dialogProps.form.submit
  })
})
