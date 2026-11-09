import { renderHook } from '@testing-library/react'

import { isSilencedGQLError } from '~/core/apolloClient/errorUtils'
import { ERROR_404_ROUTE } from '~/core/router'
import { LagoApiError } from '~/generated/graphql'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'

type QueryOptions = { context?: { silentErrorCodes?: unknown[] } }

let mockSingleCustomerOptions: QueryOptions = {}
let mockSingleCustomerResult: { data?: unknown; loading: boolean; error?: unknown } = {
  data: undefined,
  loading: false,
  error: undefined,
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSingleCustomerQuery: (options: QueryOptions) => {
    mockSingleCustomerOptions = options

    return mockSingleCustomerResult
  },
  useCreateCustomerMutation: () => [jest.fn(), { error: undefined }],
  useUpdateCustomerMutation: () => [jest.fn(), { error: undefined }],
}))

const mockNavigate = jest.fn()
const mockParams: { customerId?: string } = {}

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => mockParams,
}))

const mockHasDefinedGQLError = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  hasDefinedGQLError: (...args: unknown[]) => mockHasDefinedGQLError(...args),
}))

describe('useCreateEditCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.customerId = 'customer-1'
    mockSingleCustomerOptions = {}
    mockSingleCustomerResult = { data: undefined, loading: false, error: undefined }
    mockHasDefinedGQLError.mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the edit page is opened with an id that does not exist', () => {
    describe('WHEN the single-customer query runs', () => {
      it('THEN should silence NotFound so the global error link reports no Sentry event and no toast', () => {
        renderHook(() => useCreateEditCustomer())

        const silentErrorCodes = mockSingleCustomerOptions.context?.silentErrorCodes ?? []

        expect(
          isSilencedGQLError({
            extensions: { code: LagoApiError.NotFound },
            silentErrorCodes,
            silentErrorDetails: [],
          }),
        ).toBe(true)
      })

      it.each([LagoApiError.InternalError, LagoApiError.UnprocessableEntity])(
        'THEN should keep reporting %s',
        (code) => {
          renderHook(() => useCreateEditCustomer())

          const silentErrorCodes = mockSingleCustomerOptions.context?.silentErrorCodes ?? []

          expect(
            isSilencedGQLError({
              extensions: { code },
              silentErrorCodes,
              silentErrorDetails: [],
            }),
          ).toBe(false)
        },
      )
    })

    describe('WHEN the query returns a not-found error', () => {
      it('THEN should still redirect to the 404 page', () => {
        mockSingleCustomerResult = { data: undefined, loading: false, error: {} }
        mockHasDefinedGQLError.mockImplementation((code: string) => code === 'NotFound')

        renderHook(() => useCreateEditCustomer())

        expect(mockNavigate).toHaveBeenCalledWith(ERROR_404_ROUTE)
      })
    })
  })
})
