import { act, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
// eslint-disable-next-line lago/no-direct-rrd-nav-import
import { useLocation, useParams } from 'react-router-dom'

import { initializeYup } from '~/formValidation/initializeYup'
import { IntegrationTypeEnum } from '~/generated/graphql'
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

jest.mock('~/hooks/useDownloadFile', () => ({
  useDownloadFile: jest.fn(() => ({
    handleDownloadFile: jest.fn(),
  })),
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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

/** Integration customers now reach the page through the `integrationCustomers` array */
const NETSUITE_INTEGRATION_CUSTOMER = {
  __typename: 'NetsuiteCustomer',
  id: 'netsuite-123',
  integrationType: IntegrationTypeEnum.Netsuite,
}

const XERO_INTEGRATION_CUSTOMER = {
  __typename: 'XeroCustomer',
  id: 'xero-123',
  integrationType: IntegrationTypeEnum.Xero,
}

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

  describe('Integration polling', () => {
    const pathname = '/acme/customers/test-customer-id/information'

    const advancePolling = async (milliseconds = 1000): Promise<void> => {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(milliseconds)
      })
    }

    beforeEach(() => {
      jest.useFakeTimers()
      jest.mocked(useParams).mockReturnValue({
        customerId: 'test-customer-id',
        organizationSlug: 'acme',
        tab: 'information',
      })
      jest.mocked(useLocation).mockReturnValue({
        pathname,
        state: { shouldPollIntegrations: true },
        search: '',
        hash: '',
        key: 'polling-visit',
      })
      mockRefetch.mockReset()
      mockRefetch.mockResolvedValue({ data: mockUseGetCustomerQuery().data })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('counts three identical completed polls without consuming attempts on rerenders', async () => {
      const { rerender } = render(<CustomerDetails />)

      for (let renderCount = 0; renderCount < 5; renderCount += 1) {
        rerender(<CustomerDetails />)
      }

      expect(mockRefetch).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()

      for (let pollCount = 1; pollCount < 3; pollCount += 1) {
        await advancePolling()
        expect(mockRefetch).toHaveBeenCalledTimes(pollCount)
        expect(mockNavigate).not.toHaveBeenCalled()
        rerender(<CustomerDetails />)
      }

      await advancePolling()
      expect(mockRefetch).toHaveBeenCalledTimes(3)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(pathname, {
        replace: true,
        state: {},
      })

      rerender(<CustomerDetails />)
      await advancePolling(10_000)
      expect(mockRefetch).toHaveBeenCalledTimes(3)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('waits for the initial query without counting it as a poll', async () => {
      const initialResult = mockUseGetCustomerQuery()

      mockUseGetCustomerQuery.mockReturnValue({ ...initialResult, data: undefined, loading: true })
      const { rerender } = render(<CustomerDetails />)

      await advancePolling(5000)
      expect(mockRefetch).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()

      mockUseGetCustomerQuery.mockReturnValue(initialResult)
      rerender(<CustomerDetails />)
      await advancePolling(2000)
      expect(mockRefetch).toHaveBeenCalledTimes(2)
      expect(mockNavigate).not.toHaveBeenCalled()
      await advancePolling()
      expect(mockRefetch).toHaveBeenCalledTimes(3)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('stops without polling when the initial query returns an integration', async () => {
      const initialResult = mockUseGetCustomerQuery()

      mockUseGetCustomerQuery.mockReturnValue({ ...initialResult, data: undefined, loading: true })
      const { rerender } = render(<CustomerDetails />)

      await advancePolling()
      mockUseGetCustomerQuery.mockReturnValue({
        ...initialResult,
        data: {
          customer: {
            ...initialResult.data.customer,
            integrationCustomers: [NETSUITE_INTEGRATION_CUSTOMER],
          },
        },
      })
      rerender(<CustomerDetails />)
      await advancePolling(5000)
      expect(mockRefetch).not.toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(pathname, { replace: true, state: {} })
    })

    it('keeps a single polling loop when StrictMode replays effects', async () => {
      render(
        <StrictMode>
          <CustomerDetails />
        </StrictMode>,
      )
      await advancePolling(3000)
      expect(mockRefetch).toHaveBeenCalledTimes(3)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it.each([false, undefined])('does not poll when the navigation flag is %s', async (flag) => {
      jest.mocked(useLocation).mockReturnValue({
        ...useLocation(),
        state: flag === undefined ? null : { shouldPollIntegrations: flag },
      })
      render(<CustomerDetails />)
      await advancePolling(5000)
      expect(mockRefetch).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it.each([
      ['NetsuiteCustomer', IntegrationTypeEnum.Netsuite],
      ['AnrokCustomer', IntegrationTypeEnum.Anrok],
      ['AvalaraCustomer', IntegrationTypeEnum.Avalara],
      ['XeroCustomer', IntegrationTypeEnum.Xero],
      ['HubspotCustomer', IntegrationTypeEnum.Hubspot],
      ['SalesforceCustomer', IntegrationTypeEnum.Salesforce],
    ])(
      'clears the slug-prefixed route state when %s already exists',
      async (__typename, integrationType) => {
        const initialResult = mockUseGetCustomerQuery()

        mockUseGetCustomerQuery.mockReturnValue({
          ...initialResult,
          data: {
            customer: {
              ...initialResult.data.customer,
              integrationCustomers: [{ __typename, id: 'integration-id', integrationType }],
            },
          },
        })
        render(<CustomerDetails />)
        await advancePolling(5000)
        expect(mockRefetch).not.toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(pathname, {
          replace: true,
          state: {},
        })
      },
    )

    it('stops when an integration appears in a completed poll', async () => {
      mockRefetch.mockResolvedValueOnce({
        data: {
          customer: {
            ...mockUseGetCustomerQuery().data.customer,
            integrationCustomers: [XERO_INTEGRATION_CUSTOMER],
          },
        },
      })
      render(<CustomerDetails />)
      await advancePolling()
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(pathname, {
        replace: true,
        state: {},
      })
      await advancePolling(5000)
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('does not overlap requests or count a pending request as completed', async () => {
      let completePoll!: (result: unknown) => void

      mockRefetch.mockReturnValueOnce(
        new Promise((resolve) => {
          completePoll = resolve
        }),
      )
      const { rerender } = render(<CustomerDetails />)

      await advancePolling(10_000)
      expect(mockRefetch).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
      const initialResult = mockUseGetCustomerQuery()

      mockUseGetCustomerQuery.mockReturnValue({ ...initialResult, loading: true })
      rerender(<CustomerDetails />)
      mockUseGetCustomerQuery.mockReturnValue(initialResult)
      rerender(<CustomerDetails />)
      await act(async () => {
        completePoll({ data: initialResult.data })
      })
      await advancePolling()
      expect(mockRefetch).toHaveBeenCalledTimes(2)
      expect(mockNavigate).not.toHaveBeenCalled()
      await advancePolling()
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('bounds rejected refetches and clears state after the third failure', async () => {
      mockRefetch.mockRejectedValue(new Error('Network unavailable'))
      render(<CustomerDetails />)
      await advancePolling(2000)
      expect(mockNavigate).not.toHaveBeenCalled()
      await advancePolling()
      expect(mockRefetch).toHaveBeenCalledTimes(3)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      await advancePolling(5000)
      expect(mockRefetch).toHaveBeenCalledTimes(3)
    })

    it('cancels the scheduled poll on unmount', async () => {
      const { unmount } = render(<CustomerDetails />)

      unmount()
      await advancePolling(5000)
      expect(mockRefetch).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('ignores an in-flight completion after unmount', async () => {
      let completePoll!: (result: unknown) => void

      mockRefetch.mockReturnValueOnce(
        new Promise((resolve) => {
          completePoll = resolve
        }),
      )
      const { unmount } = render(<CustomerDetails />)

      await advancePolling()
      unmount()
      await act(async () => {
        completePoll({
          data: { customer: { integrationCustomers: [XERO_INTEGRATION_CUSTOMER] } },
        })
      })
      await advancePolling(5000)
      expect(mockRefetch).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('cancels polling when navigation removes the flag', async () => {
      const { rerender } = render(<CustomerDetails />)

      await advancePolling()
      jest.mocked(useLocation).mockReturnValue({ ...useLocation(), state: {} })
      rerender(<CustomerDetails />)
      await advancePolling(5000)
      expect(mockRefetch).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('ignores the previous customer response and resets attempts on a new route', async () => {
      let completeOldPoll!: (result: unknown) => void

      mockRefetch.mockReturnValueOnce(
        new Promise((resolve) => {
          completeOldPoll = resolve
        }),
      )
      const { rerender } = render(<CustomerDetails />)

      await advancePolling()
      jest.mocked(useParams).mockReturnValue({
        customerId: 'other-customer',
        organizationSlug: 'other-org',
        tab: 'information',
      })
      const nextPathname = '/other-org/customers/other-customer/information'

      jest.mocked(useLocation).mockReturnValue({
        ...useLocation(),
        pathname: nextPathname,
        key: 'next-visit',
      })
      rerender(<CustomerDetails />)
      await act(async () => {
        completeOldPoll({
          data: {
            customer: {
              integrationCustomers: [{ ...XERO_INTEGRATION_CUSTOMER, id: 'old-integration' }],
            },
          },
        })
      })
      expect(mockNavigate).not.toHaveBeenCalled()
      await advancePolling(2000)
      expect(mockRefetch).toHaveBeenCalledTimes(3)
      expect(mockNavigate).not.toHaveBeenCalled()
      await advancePolling()
      expect(mockRefetch).toHaveBeenCalledTimes(4)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(nextPathname, {
        replace: true,
        state: {},
      })
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
