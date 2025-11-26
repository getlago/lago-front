import { ApolloError } from '@apollo/client'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import { initializeYup } from '~/formValidation/initializeYup'
import { LagoApiError } from '~/generated/graphql'
import * as useIsCustomerReadyForOverduePaymentModule from '~/hooks/useIsCustomerReadyForOverduePayment'
import { render } from '~/test-utils'

import CustomerRequestOverduePayment, { SUBMIT_PAYMENT_REQUEST_TEST_ID } from '../index'

initializeYup()

const mockNavigate = jest.fn()
const mockUseGetRequestOverduePaymentInfosQuery = jest.fn()
const mockCreatePaymentRequest = jest.fn()
let mockOnError: ((error: ApolloError) => void) | undefined

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(() => ({
    isPremium: true,
  })),
}))

jest.mock('~/hooks/useIsCustomerReadyForOverduePayment', () => ({
  useIsCustomerReadyForOverduePayment: jest.fn(() => ({
    data: true,
    loading: false,
    error: undefined,
  })),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ customerId: 'test-customer-id' }),
  useNavigate: () => mockNavigate,
  generatePath: jest.fn((route: string, params: { customerId: string }) => {
    return route.replace(':customerId', params.customerId)
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetRequestOverduePaymentInfosQuery: jest.fn(() => mockUseGetRequestOverduePaymentInfosQuery()),
  useCreatePaymentRequestMutation: jest.fn(
    (options?: { onError?: (error: ApolloError) => void }) => {
      if (options?.onError) {
        mockOnError = options.onError
      }
      return [
        mockCreatePaymentRequest,
        { loading: false, error: undefined, client: { refetchQueries: jest.fn() } },
      ]
    },
  ),
}))

describe('CustomerRequestOverduePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnError = undefined
    mockUseGetRequestOverduePaymentInfosQuery.mockReturnValue({
      data: {},
      loading: false,
      error: undefined,
    })
  })

  describe('WHEN user submits and mutation returns InvoicesNotReadyForPaymentProcessing error', () => {
    it('THEN shows error toast and navigates to customer details', async () => {
      const user = userEvent.setup()

      mockUseGetRequestOverduePaymentInfosQuery.mockReturnValue({
        data: {
          customer: { externalId: 'test-external-id', email: 'test@example.com', currency: 'USD' },
          organization: { defaultCurrency: 'USD' },
          paymentRequests: { collection: [] },
          invoices: {
            collection: [
              {
                id: 'invoice-1',
                totalDueAmountCents: 10000,
                currency: 'USD',
              },
            ],
          },
        },
        loading: false,
        error: undefined,
      })

      const mockError: ApolloError = {
        graphQLErrors: [
          {
            extensions: {
              code: LagoApiError.InvoicesNotReadyForPaymentProcessing,
            },
          },
        ],
      } as unknown as ApolloError

      await act(async () => {
        return render(<CustomerRequestOverduePayment />)
      })

      await waitFor(() => {
        const submitButton = screen.getByTestId(SUBMIT_PAYMENT_REQUEST_TEST_ID)

        expect(submitButton).not.toBeDisabled()
      })

      const submitButton = screen.getByTestId(SUBMIT_PAYMENT_REQUEST_TEST_ID)

      await user.click(submitButton)

      // Manually call onError callback to simulate Apollo's behavior when mutation fails
      // This simulates what Apollo does when the mutation promise is rejected
      await act(async () => {
        if (mockOnError) {
          mockOnError(mockError)
        }
      })

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'danger',
            translateKey: 'text_1763545922743q5ic2kklick',
          }),
        )
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/test-customer-id')
      })
    })
  })

  describe('WHEN user lands on the view and useIsCustomerReadyForOverduePayment is false', () => {
    it('THEN shows error toast and navigates to customer details', async () => {
      jest
        .mocked(useIsCustomerReadyForOverduePaymentModule.useIsCustomerReadyForOverduePayment)
        .mockReturnValue({
          data: false,
          loading: false,
          error: undefined,
        })

      await act(async () => {
        return render(<CustomerRequestOverduePayment />)
      })

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'danger',
          }),
        )
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/customer/test-customer-id'),
        )
      })
    })
  })
})
