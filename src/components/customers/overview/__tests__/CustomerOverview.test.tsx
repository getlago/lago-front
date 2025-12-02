import { act, screen, waitFor } from '@testing-library/react'

import * as useIsCustomerReadyForOverduePaymentModule from '~/hooks/useIsCustomerReadyForOverduePayment'
import { render } from '~/test-utils'

import { CustomerOverview, OVERDUE_INVOICES_ALERT_TEST_ID } from '../CustomerOverview'

const mockGetCustomerOverdueBalances = jest.fn()
const mockGetCustomerGrossRevenues = jest.fn()

jest.mock('~/hooks/useIsCustomerReadyForOverduePayment', () => ({
  useIsCustomerReadyForOverduePayment: jest.fn(() => ({
    data: true,
    loading: false,
    error: undefined,
  })),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({
    hasPermissions: jest.fn(() => true),
  })),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: jest.fn(() => ({
    organization: {
      defaultCurrency: 'USD' as const,
    },
    intlFormatDateTimeOrgaTZ: jest.fn(() => ({
      time: '12:00:00',
      date: '2024-01-01',
    })),
  })),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({
    customerId: 'test-customer-id',
  })),
  useNavigate: jest.fn(() => jest.fn()),
  generatePath: jest.fn((route: string, params: { customerId: string }) => {
    return route.replace(':customerId', params.customerId)
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerOverdueBalancesLazyQuery: jest.fn(() => [
    mockGetCustomerOverdueBalances,
    {
      data: {
        overdueBalances: {
          collection: [
            {
              amountCents: '10000',
              currency: 'USD' as const,
              lagoInvoiceIds: ['invoice-1', 'invoice-2'],
            },
          ],
        },
        paymentRequests: {
          collection: [],
        },
      },
      loading: false,
      error: undefined,
    },
  ]),
  useGetCustomerGrossRevenuesLazyQuery: jest.fn(() => [
    mockGetCustomerGrossRevenues,
    {
      data: {
        grossRevenues: {
          collection: [],
        },
      },
      loading: false,
      error: undefined,
    },
  ]),
}))

describe('CustomerOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCustomerOverdueBalances.mockClear()
    mockGetCustomerGrossRevenues.mockClear()

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      customerId: 'test-customer-id',
    })
  })

  describe('Overdue invoices alert', () => {
    it.each([
      {
        description: 'not displayed when payment processing status is loading',
        isCustomerReadyForOverduePayment: false,
        loading: true,
        expectedVisible: false,
      },
      {
        description: 'not displayed when data is not ready for overdue payment',
        isCustomerReadyForOverduePayment: false,
        loading: false,
        expectedVisible: false,
      },
      {
        description: 'displayed when payment processing status is not loading and data is ready',
        isCustomerReadyForOverduePayment: true,
        loading: false,
        expectedVisible: true,
      },
    ])(
      'should be $description',
      async ({ isCustomerReadyForOverduePayment, loading, expectedVisible }) => {
        jest
          .mocked(useIsCustomerReadyForOverduePaymentModule.useIsCustomerReadyForOverduePayment)
          .mockReturnValue({
            isCustomerReadyForOverduePayment,
            loading,
            error: undefined,
          })

        await act(async () => {
          return render(<CustomerOverview externalCustomerId="ext-123" />)
        })

        await waitFor(() => {
          if (expectedVisible) {
            expect(screen.getByTestId(OVERDUE_INVOICES_ALERT_TEST_ID)).toBeInTheDocument()
          } else {
            expect(screen.queryByTestId(OVERDUE_INVOICES_ALERT_TEST_ID)).not.toBeInTheDocument()
          }
        })
      },
    )
  })
})
