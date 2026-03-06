import { renderHook, waitFor } from '@testing-library/react'

import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/constants/localStorageKeys'

// Import after mocks
import OktaAuthCallback from '../OktaAuthCallback'

const mockNavigate = jest.fn()
const mockGetItemFromLS = jest.fn()
const mockRemoveItemFromLS = jest.fn()
const mockOnLogIn = jest.fn()
const mockOktaLoginUser = jest.fn()
const mockUseSearchParams = jest.fn()
const mockApolloClient = {}

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockApolloClient,
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
  generatePath: jest.fn((route, params) => {
    return route.replace(':token', params.token)
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  hasDefinedGQLError: jest.fn((code: string, errors: Array<{ extensions?: { code?: string } }>) =>
    errors?.some((e) => e.extensions?.code === code),
  ),
  onLogIn: (...args: unknown[]) => mockOnLogIn(...args),
  getItemFromLS: (key: string) => mockGetItemFromLS(key),
  removeItemFromLS: (key: string) => mockRemoveItemFromLS(key),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useOktaLoginUserMutation: () => [mockOktaLoginUser],
}))

const buildSearchParams = (params: Record<string, string>) => {
  const sp = new URLSearchParams()

  Object.entries(params).forEach(([k, v]) => sp.set(k, v))

  return [sp, jest.fn()] as const
}

describe('OktaAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLogIn.mockResolvedValue(undefined)
  })

  describe('GIVEN a successful Okta login with a redirect path in localStorage', () => {
    const redirectPath = '/customers/456/information'

    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'okta-auth-code',
          state: JSON.stringify({ state: 'okta-state-value' }),
        }),
      )
      mockOktaLoginUser.mockResolvedValue({
        data: { oktaLogin: { token: 'test-token' } },
      })
      mockGetItemFromLS.mockImplementation((key: string) => {
        if (key === REDIRECT_AFTER_LOGIN_LS_KEY) return redirectPath

        return undefined
      })
    })

    describe('WHEN the callback processes', () => {
      it('THEN should read the redirect path from localStorage', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockGetItemFromLS).toHaveBeenCalledWith(REDIRECT_AFTER_LOGIN_LS_KEY)
        })
      })

      it('THEN should remove the redirect path from localStorage after onLogIn', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockRemoveItemFromLS).toHaveBeenCalledWith(REDIRECT_AFTER_LOGIN_LS_KEY)
        })

        // Verify removeItemFromLS was called after onLogIn
        const removeOrder = mockRemoveItemFromLS.mock.invocationCallOrder[0]
        const onLogInOrder = mockOnLogIn.mock.invocationCallOrder[0]

        expect(removeOrder).toBeGreaterThan(onLogInOrder)
      })

      it('THEN should navigate to the redirect path', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith({ pathname: redirectPath })
        })
      })
    })
  })

  describe('GIVEN a successful Okta login without a redirect path in localStorage', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'okta-auth-code',
          state: JSON.stringify({ state: 'okta-state-value' }),
        }),
      )
      mockOktaLoginUser.mockResolvedValue({
        data: { oktaLogin: { token: 'test-token' } },
      })
      mockGetItemFromLS.mockReturnValue(undefined)
    })

    describe('WHEN the callback processes', () => {
      it('THEN should call onLogIn', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })
      })

      it('THEN should not navigate to any redirect path', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockNavigate).not.toHaveBeenCalledWith(
          expect.objectContaining({ pathname: expect.any(String) }),
        )
      })
    })
  })

  describe('GIVEN Okta login returns an error', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'okta-auth-code',
          state: JSON.stringify({ state: 'okta-state-value' }),
        }),
      )
    })

    describe('WHEN OktaUserinfoError is returned', () => {
      it('THEN should navigate to Okta login with the error code', async () => {
        mockOktaLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'OktaUserinfoError' } }],
        })

        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/login/okta',
              search: expect.stringContaining('lago_error_code'),
            }),
          )
        })
      })
    })

    describe('WHEN LoginMethodNotAuthorized is returned', () => {
      it('THEN should navigate to login with the error code', async () => {
        mockOktaLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'LoginMethodNotAuthorized' } }],
        })

        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/login',
              search: expect.stringContaining('lago_error_code'),
            }),
          )
        })
      })
    })

    describe('WHEN a generic error is returned', () => {
      it('THEN should navigate to login with the error code', async () => {
        mockOktaLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'SomeOtherError' } }],
        })

        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/login',
              search: expect.stringContaining('lago_error_code'),
            }),
          )
        })
      })
    })
  })

  describe('GIVEN the callback has an invitation token', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'okta-auth-code',
          state: JSON.stringify({ state: 'okta-state-value', invitationToken: 'inv-token' }),
        }),
      )
    })

    describe('WHEN the callback processes', () => {
      it('THEN should navigate to invitation form with okta code and state', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              search: expect.stringContaining('oktaCode=okta-auth-code'),
            }),
          )
        })
      })

      it('THEN should not call onLogIn', async () => {
        renderHook(() => OktaAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled()
        })

        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })
})
