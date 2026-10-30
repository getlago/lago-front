import { act, cleanup, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { AddX402ConnectionDialogFragment } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { describeDuplicateRejectionRouting, rejectedUnder } from './duplicateRejectionHelpers'
import { X402_TEST_CATALOG } from './x402NetworksFixture'

import { useAddX402Dialog } from '../AddX402Dialog'

const mockDialogOpen = jest.fn()
const mockUpdateConnection = jest.fn()

jest.mock('~/hooks/useX402Networks', () => ({
  useX402Networks: () => ({
    networks: jest.requireActual('~/components/settings/integrations/__tests__/x402NetworksFixture')
      .X402_TEST_CATALOG,
    loading: false,
  }),
}))

jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

// Identity translate so the surfaced error renders as its message key and can be
// asserted through the exported constant (never a raw translation literal).
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateX402ConnectionMutation: () => [jest.fn()],
  useUpdateX402ConnectionMutation: () => [mockUpdateConnection],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const connection: AddX402ConnectionDialogFragment = {
  __typename: 'X402ConnectionObject',
  id: 'connection-id',
  name: 'Coinbase Prod',
  code: 'coinbase_prod',
  networks: ['eip155:8453'],
  allowedOrigins: ['https://example.com'],
  autoCreateCustomers: true,
  payoutAddresses: {
    __typename: 'X402PayoutAddresses',
    evm: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    svm: null,
  },
}

describe('useAddX402Dialog duplicate code', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
  })

  describeDuplicateRejectionRouting(
    'connection',
    async (detailsKey) => {
      mockUpdateConnection.mockResolvedValue(rejectedUnder(detailsKey))

      const { result } = renderHook(() => useAddX402Dialog(), { wrapper })

      act(() => {
        result.current.openAddX402Dialog({ connection, catalog: X402_TEST_CATALOG })
      })

      const dialogProps = mockDialogOpen.mock.calls[0][0]

      await act(() => render(<>{dialogProps.children}</>))

      return dialogProps.form.submit
    },
    () => {
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
    },
  )
})
