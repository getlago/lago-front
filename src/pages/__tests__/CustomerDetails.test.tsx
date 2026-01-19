import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { initializeYup } from '~/formValidation/initializeYup'
import * as useIsCustomerReadyForOverduePaymentModule from '~/hooks/useIsCustomerReadyForOverduePayment'
import { render } from '~/test-utils'

import CustomerDetails, {
  CUSTOMER_ACTIONS_BUTTON_TEST_ID,
  REQUEST_OVERDUE_PAYMENT_BUTTON_TEST_ID,
} from '../CustomerDetails'

initializeYup()

const mockUseGetCustomerQuery = jest.fn()
const mockGenerateCustomerPortalUrl = jest.fn()
const mockHandleDownloadFile = jest.fn()

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
    handleDownloadFile: mockHandleDownloadFile,
  })),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({
    customerId: 'test-customer-id',
    tab: 'overview',
  })),
  useNavigate: jest.fn(() => jest.fn()),
  generatePath: jest.fn((route: string, params: { customerId: string }) => {
    return route.replace(':customerId', params.customerId)
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerQuery: jest.fn(() => mockUseGetCustomerQuery()),
  useGenerateCustomerPortalUrlMutation: jest.fn(() => [
    mockGenerateCustomerPortalUrl,
    { loading: false, error: undefined },
  ]),
}))

describe('CustomerDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      customerId: 'test-customer-id',
      tab: 'overview',
    })
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
        },
      },
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    })
  })

  describe('Request overdue payment button', () => {
    it.each([
      {
        description: 'disabled when payment processing status is loading',
        isCustomerReadyForOverduePayment: false,
        loading: true,
        expectedDisabled: true,
      },
      {
        description: 'disabled when customer is not ready for overdue payment',
        isCustomerReadyForOverduePayment: false,
        loading: false,
        expectedDisabled: true,
      },
      {
        description: 'enabled when payment processing status is not loading and customer is ready',
        isCustomerReadyForOverduePayment: true,
        loading: false,
        expectedDisabled: false,
      },
    ])(
      'should be $description',
      async ({ isCustomerReadyForOverduePayment, loading, expectedDisabled }) => {
        const user = userEvent.setup()

        jest
          .mocked(useIsCustomerReadyForOverduePaymentModule.useIsCustomerReadyForOverduePayment)
          .mockReturnValue({
            isCustomerReadyForOverduePayment,
            loading,
            error: undefined,
          })

        await act(async () => {
          return render(<CustomerDetails />)
        })

        // Open the actions menu
        const actionsButton = screen.getByTestId(CUSTOMER_ACTIONS_BUTTON_TEST_ID)

        await user.click(actionsButton)

        await waitFor(() => {
          const requestButton = screen.getByTestId(REQUEST_OVERDUE_PAYMENT_BUTTON_TEST_ID)

          if (expectedDisabled) {
            expect(requestButton).toBeDisabled()
          } else {
            expect(requestButton).not.toBeDisabled()
          }
        })
      },
    )
  })
})
