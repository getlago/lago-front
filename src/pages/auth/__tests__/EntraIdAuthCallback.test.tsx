import { renderHook, waitFor } from '@testing-library/react'

import { getItemFromLS, removeItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'

// Import after mocks
import EntraIdAuthCallback from '../EntraIdAuthCallback'

const mockNavigate = jest.fn()
const mockGetItemFromLS = getItemFromLS as jest.Mock
const mockRemoveItemFromLS = removeItemFromLS as jest.Mock
const mockOnLogIn = jest.fn()
const mockEntraIdLoginUser = jest.fn()
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
}))

jest.mock('~/core/utils/localStorage', () => ({
  ...jest.requireActual('~/core/utils/localStorage'),
  getItemFromLS: jest.fn(),
  removeItemFromLS: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useEntraIdLoginUserMutation: () => [mockEntraIdLoginUser],
}))

const buildSearchParams = (params: Record<string, string>) => {
  const sp = new URLSearchParams()

  Object.entries(params).forEach(([k, v]) => sp.set(k, v))

  return [sp, jest.fn()] as const
}

describe('EntraIdAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLogIn.mockResolvedValue(undefined)
  })

  describe('GIVEN a successful Entra ID login with a redirect path in localStorage', () => {
    const redirectPath = '/customers/456/information'

    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'entra-auth-code',
          state: JSON.stringify({ state: 'entra-state-value' }),
        }),
      )
      mockEntraIdLoginUser.mockResolvedValue({
        data: { entraIdLogin: { token: 'test-token' } },
      })
      mockGetItemFromLS.mockImplementation((key: string) => {
        if (key === REDIRECT_AFTER_LOGIN_LS_KEY) return redirectPath

        return undefined
      })
    })

    describe('WHEN the callback processes', () => {
      it('THEN should call onLogIn', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })
      })

      it('THEN should NOT remove redirect path from localStorage (Home.tsx handles cleanup)', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockRemoveItemFromLS).not.toHaveBeenCalledWith(REDIRECT_AFTER_LOGIN_LS_KEY)
      })

      it('THEN should NOT navigate directly (Home.tsx handles redirect via localStorage bridge)', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockNavigate).not.toHaveBeenCalledWith({ pathname: redirectPath })
      })
    })
  })

  describe('GIVEN a successful Entra ID login without a redirect path in localStorage', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'entra-auth-code',
          state: JSON.stringify({ state: 'entra-state-value' }),
        }),
      )
      mockEntraIdLoginUser.mockResolvedValue({
        data: { entraIdLogin: { token: 'test-token' } },
      })
      mockGetItemFromLS.mockReturnValue(undefined)
    })

    describe('WHEN the callback processes', () => {
      it('THEN should call onLogIn', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })
      })

      it('THEN should not navigate to any redirect path', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockNavigate).not.toHaveBeenCalledWith(
          expect.objectContaining({ pathname: expect.any(String) }),
        )
      })
    })
  })

  describe('GIVEN Entra ID login returns an error', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'entra-auth-code',
          state: JSON.stringify({ state: 'entra-state-value' }),
        }),
      )
    })

    describe('WHEN EntraIdUserinfoError is returned', () => {
      it('THEN should navigate to Entra ID login with the error code', async () => {
        mockEntraIdLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'EntraIdUserinfoError' } }],
        })

        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/auth/entra',
              search: expect.stringContaining('lago_error_code'),
            }),
          )
        })
      })
    })

    describe('WHEN LoginMethodNotAuthorized is returned', () => {
      it('THEN should navigate to login with the error code', async () => {
        mockEntraIdLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'LoginMethodNotAuthorized' } }],
        })

        renderHook(() => EntraIdAuthCallback())

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
        mockEntraIdLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'SomeOtherError' } }],
        })

        renderHook(() => EntraIdAuthCallback())

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
          code: 'entra-auth-code',
          state: JSON.stringify({ state: 'entra-state-value', invitationToken: 'inv-token' }),
        }),
      )
    })

    describe('WHEN the callback processes', () => {
      it('THEN should navigate to invitation form with entra id code and state', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              search: expect.stringContaining('entraIdCode=entra-auth-code'),
            }),
          )
        })
      })

      it('THEN should not call onLogIn', async () => {
        renderHook(() => EntraIdAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled()
        })

        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })
})
