import { ApolloError } from '@apollo/client'
import { act, waitFor } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { initializeYup } from '~/formValidation/initializeYup'
import { LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import CustomerRequestOverduePayment from '../index'

initializeYup()

const mockNavigate = jest.fn()
const mockUseGetRequestOverduePaymentInfosQuery = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(() => ({
    isPremium: true,
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
}))

describe('CustomerRequestOverduePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetRequestOverduePaymentInfosQuery.mockReturnValue({
      data: {},
      loading: false,
      error: undefined,
    })
  })

  describe('WHEN query returns InvoicesNotOverdue error', () => {
    it('THEN shows error toast and navigates to customer details', async () => {
      const mockError: ApolloError = {
        graphQLErrors: [
          {
            extensions: {
              code: LagoApiError.InvoicesNotOverdue,
            },
          },
        ],
      } as unknown as ApolloError

      mockUseGetRequestOverduePaymentInfosQuery.mockReturnValue({
        data: {},
        loading: false,
        error: mockError,
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
        expect(mockNavigate).toHaveBeenCalledWith('/customer/test-customer-id')
      })
    })
  })
})
