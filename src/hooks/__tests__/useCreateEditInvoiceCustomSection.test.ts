import { renderHook } from '@testing-library/react'

import { isSilencedGQLError } from '~/core/apolloClient/errorUtils'
import { ERROR_404_ROUTE } from '~/core/router'
import { LagoApiError } from '~/generated/graphql'
import { useCreateEditInvoiceCustomSection } from '~/hooks/useCreateEditInvoiceCustomSection'

type QueryOptions = { context?: { silentErrorCodes?: unknown[] } }

let mockSingleSectionOptions: QueryOptions = {}
let mockSingleSectionResult: { data?: unknown; loading: boolean; error?: unknown } = {
  data: undefined,
  loading: false,
  error: undefined,
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSingleInvoiceCustomSectionQuery: (options: QueryOptions) => {
    mockSingleSectionOptions = options

    return mockSingleSectionResult
  },
  useCreateInvoiceCustomSectionMutation: () => [jest.fn(), { error: undefined }],
  useUpdateInvoiceCustomSectionMutation: () => [jest.fn(), { error: undefined }],
}))

const mockNavigate = jest.fn()
const mockParams: { sectionId?: string } = {}

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

describe('useCreateEditInvoiceCustomSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.sectionId = 'section-1'
    mockSingleSectionOptions = {}
    mockSingleSectionResult = { data: undefined, loading: false, error: undefined }
    mockHasDefinedGQLError.mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the edit page is opened with an id that does not exist', () => {
    describe('WHEN the single-section query runs', () => {
      it('THEN should silence NotFound so the global error link reports no Sentry event and no toast', () => {
        renderHook(() => useCreateEditInvoiceCustomSection())

        const silentErrorCodes = mockSingleSectionOptions.context?.silentErrorCodes ?? []

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
          renderHook(() => useCreateEditInvoiceCustomSection())

          const silentErrorCodes = mockSingleSectionOptions.context?.silentErrorCodes ?? []

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
        mockSingleSectionResult = { data: undefined, loading: false, error: {} }
        mockHasDefinedGQLError.mockImplementation((code: string) => code === 'NotFound')

        renderHook(() => useCreateEditInvoiceCustomSection())

        expect(mockNavigate).toHaveBeenCalledWith(ERROR_404_ROUTE)
      })
    })
  })
})
