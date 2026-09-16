import { act, cleanup, renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { AddAvalaraIntegrationDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { describeDuplicateRejectionRouting, rejectedUnder } from './duplicateRejectionHelpers'

import { useAddAvalaraDialog } from '../AddAvalaraDialog'

const mockDialogOpen = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockDestroyNango = jest.fn()
const mockNangoAuth = jest.fn()

jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: class {
    auth = mockNangoAuth
  },
  AuthError: class AuthError extends Error {},
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
  useCreateAvalaraIntegrationMutation: () => [mockCreate],
  useUpdateAvalaraIntegrationMutation: () => [mockUpdate],
  useDestroyNangoIntegrationMutation: () => [mockDestroyNango],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const avalaraIntegration: AddAvalaraIntegrationDialogFragment = {
  __typename: 'AvalaraIntegration',
  id: 'avalara-integration-id',
  name: 'Test Integration',
  code: 'test_integration',
  accountId: 'account-id',
  companyCode: 'company-code',
  licenseKey: 'license-key',
}

const getInput = (name: string): HTMLInputElement =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

describe('useAddAvalaraDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
    mockNangoAuth.mockResolvedValue({ connectionId: 'nango-connection-id' })
  })

  describeDuplicateRejectionRouting('edition', async (detailsKey) => {
    mockUpdate.mockResolvedValue(rejectedUnder(detailsKey))

    const { result } = renderHook(() => useAddAvalaraDialog(), { wrapper })

    act(() => {
      result.current.openAddAvalaraDialog({ integration: avalaraIntegration })
    })

    const dialogProps = mockDialogOpen.mock.calls[0][0]

    await act(() => render(<>{dialogProps.children}</>))

    return dialogProps.form.submit
  })

  describeDuplicateRejectionRouting('creation', async (detailsKey) => {
    mockCreate.mockResolvedValue(rejectedUnder(detailsKey))

    const user = userEvent.setup()
    const { result } = renderHook(() => useAddAvalaraDialog(), { wrapper })

    act(() => {
      result.current.openAddAvalaraDialog()
    })

    const dialogProps = mockDialogOpen.mock.calls[0][0]

    await act(() => render(<>{dialogProps.children}</>))

    await user.type(getInput('name'), 'Test Integration')
    await user.type(getInput('accountId'), 'account-id')
    await user.type(getInput('licenseKey'), 'license-key')
    await user.type(getInput('companyCode'), 'company-code')

    return dialogProps.form.submit
  })
})
