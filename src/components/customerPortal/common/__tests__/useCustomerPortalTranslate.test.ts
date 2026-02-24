import { renderHook } from '@testing-library/react'

import { LocaleEnum } from '~/core/translations'
import { AllTheProviders } from '~/test-utils'

import useCustomerPortalTranslate from '../useCustomerPortalTranslate'

// -- Mocks --

const mockTranslateWithContextualLocal = jest.fn((key: string) => key)

let mockIsPortalAuthenticated = true

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => ({
    isPortalAuthenticated: mockIsPortalAuthenticated,
  }),
}))

jest.mock('~/hooks/core/useContextualLocale', () => ({
  useContextualLocale: () => ({
    translateWithContextualLocal: mockTranslateWithContextualLocal,
  }),
}))

const mockUseGetPortalLocaleQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPortalLocaleQuery: (...args: unknown[]) => mockUseGetPortalLocaleQuery(...args),
}))

// -- Helpers --

function prepare(params?: { token?: string }) {
  const token = params?.token ?? 'test-token'

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      useParams: { token },
    })

  const { result } = renderHook(() => useCustomerPortalTranslate(), { wrapper })

  return { result }
}

// -- Tests --

describe('useCustomerPortalTranslate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPortalAuthenticated = true
    mockUseGetPortalLocaleQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      loading: false,
    })
  })

  describe('isUnauthenticated', () => {
    describe('GIVEN loading is false AND customerPortalUser is null (expired token)', () => {
      it('THEN isUnauthenticated should be true', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: { customerPortalUser: null },
          error: undefined,
          loading: false,
        })

        const { result } = prepare()

        expect(result.current.isUnauthenticated).toBe(true)
      })
    })

    describe('GIVEN the query is still loading', () => {
      it('THEN isUnauthenticated should be false', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: undefined,
          error: undefined,
          loading: true,
        })

        const { result } = prepare()

        expect(result.current.isUnauthenticated).toBe(false)
      })
    })

    describe('GIVEN customerPortalUser has data (valid token)', () => {
      it('THEN isUnauthenticated should be false', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: {
            customerPortalUser: {
              id: 'user-1',
              billingConfiguration: { id: 'bc-1', documentLocale: 'fr' },
              billingEntityBillingConfiguration: { id: 'bbc-1', documentLocale: 'de' },
            },
          },
          error: undefined,
          loading: false,
        })

        const { result } = prepare()

        expect(result.current.isUnauthenticated).toBe(false)
      })
    })

    describe('GIVEN the query is skipped (data is undefined)', () => {
      it('THEN isUnauthenticated should be false because undefined !== null', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: undefined,
          error: undefined,
          loading: false,
        })

        const { result } = prepare({ token: '' })

        expect(result.current.isUnauthenticated).toBe(false)
      })
    })
  })

  describe('documentLocale', () => {
    describe('GIVEN billingConfiguration has a documentLocale', () => {
      it('THEN should use billingConfiguration locale', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: {
            customerPortalUser: {
              id: 'user-1',
              billingConfiguration: { id: 'bc-1', documentLocale: 'fr' },
              billingEntityBillingConfiguration: { id: 'bbc-1', documentLocale: 'de' },
            },
          },
          error: undefined,
          loading: false,
        })

        const { result } = prepare()

        expect(result.current.documentLocale).toBe(LocaleEnum.fr)
      })
    })

    describe('GIVEN billingConfiguration locale is null', () => {
      it('THEN should fall back to billingEntityBillingConfiguration locale', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: {
            customerPortalUser: {
              id: 'user-1',
              billingConfiguration: { id: 'bc-1', documentLocale: null },
              billingEntityBillingConfiguration: { id: 'bbc-1', documentLocale: 'it' },
            },
          },
          error: undefined,
          loading: false,
        })

        const { result } = prepare()

        expect(result.current.documentLocale).toBe(LocaleEnum.it)
      })
    })

    describe('GIVEN no locale data on either configuration', () => {
      it('THEN should fall back to en', () => {
        mockUseGetPortalLocaleQuery.mockReturnValue({
          data: {
            customerPortalUser: {
              id: 'user-1',
              billingConfiguration: { id: 'bc-1', documentLocale: null },
              billingEntityBillingConfiguration: { id: 'bbc-1', documentLocale: null },
            },
          },
          error: undefined,
          loading: false,
        })

        const { result } = prepare()

        expect(result.current.documentLocale).toBe(LocaleEnum.en)
      })
    })
  })
})
