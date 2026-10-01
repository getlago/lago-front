import { act, waitFor } from '@testing-library/react'
// eslint-disable-next-line lago/no-direct-rrd-nav-import
import { useLocation, useParams } from 'react-router'

import { initializeYup } from '~/formValidation/initializeYup'
import { render } from '~/test-utils'

import CustomerDetails from '../CustomerDetails'

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: () => null,
  },
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => null,
}))

// The drawer stack uses `import.meta`, unsupported by jest: the connections
// section reached through the information tab pulls it in transitively
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

initializeYup()

const mockUseGetCustomerQuery = jest.fn()
const mockAddToast = jest.fn()
const mockHasDefinedGQLError = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
  hasDefinedGQLError: (...args: unknown[]) => mockHasDefinedGQLError(...args),
}))

jest.mock('~/hooks/useIsCustomerReadyForOverduePayment', () => ({
  useIsCustomerReadyForOverduePayment: jest.fn(() => ({
    isCustomerReadyForOverduePayment: true,
    loading: false,
    error: undefined,
  })),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({
    hasPermissions: jest.fn(() => true),
  })),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(() => ({
    isPremium: true,
  })),
}))

jest.mock('~/core/utils/downloadFile', () => ({
  handleDownloadFile: jest.fn(),
}))

const mockNavigate = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(() => ({
    customerId: 'test-customer-id',
    tab: 'overview',
  })),
  useNavigate: jest.fn(() => mockNavigate),
  useLocation: jest.fn(() => ({
    pathname: '/customers/test-customer-id/information',
    state: null,
  })),
  generatePath: jest.fn((route: string, params: { customerId: string; tab?: string }) => {
    let result = route.replace(':customerId', params.customerId)

    if (params.tab) {
      result = result.replace(':tab', params.tab)
    }

    return result
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerQuery: jest.fn(() => mockUseGetCustomerQuery()),
  useGenerateCustomerPortalUrlMutation: jest.fn(() => [
    jest.fn(),
    { loading: false, error: undefined },
  ]),
}))

describe('CustomerDetails', () => {
  const mockRefetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useParams).mockReturnValue({ customerId: 'test-customer-id', tab: 'overview' })

    mockUseGetCustomerQuery.mockReturnValue({
      data: {
        customer: {
          id: 'test-customer-id',
          displayName: 'Test Customer',
          externalId: 'ext-123',
          hasOverdueInvoices: true,
          hasActiveWallet: false,
          hasCreditNotes: false,
          currency: 'USD',
          applicableTimezone: 'UTC',
          accountType: 'standard',
          integrationCustomers: [],
        },
      },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    })
  })

  describe('Customer not found handling', () => {
    it('should redirect to customers list and show toast when customer is not found', async () => {
      mockHasDefinedGQLError.mockReturnValue(true)

      jest.mocked(useLocation).mockReturnValue({
        pathname: '/customers/non-existent-id',
        state: null,
        search: '',
        hash: '',
        key: 'default',
      })

      mockUseGetCustomerQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: { graphQLErrors: [{ extensions: { code: 'not_found' } }] },
        refetch: mockRefetch,
      })

      await act(async () => {
        render(<CustomerDetails />)
      })

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
      })
    })

    it('should not redirect when customer is found', async () => {
      mockHasDefinedGQLError.mockReturnValue(false)

      jest.mocked(useLocation).mockReturnValue({
        pathname: '/customers/test-customer-id',
        state: null,
        search: '',
        hash: '',
        key: 'default',
      })

      mockUseGetCustomerQuery.mockReturnValue({
        data: {
          customer: {
            id: 'test-customer-id',
            displayName: 'Test Customer',
            externalId: 'ext-123',
            hasOverdueInvoices: false,
            hasActiveWallet: false,
            hasCreditNotes: false,
            currency: 'USD',
            applicableTimezone: 'UTC',
            accountType: 'standard',
          },
        },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      })

      await act(async () => {
        render(<CustomerDetails />)
      })

      expect(mockAddToast).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalledWith('/customers', expect.anything())
    })

    it('should not redirect while loading', async () => {
      mockHasDefinedGQLError.mockReturnValue(true)

      jest.mocked(useLocation).mockReturnValue({
        pathname: '/customers/test-customer-id',
        state: null,
        search: '',
        hash: '',
        key: 'default',
      })

      mockUseGetCustomerQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: mockRefetch,
      })

      await act(async () => {
        render(<CustomerDetails />)
      })

      expect(mockAddToast).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalledWith('/customers', expect.anything())
    })
  })
})
