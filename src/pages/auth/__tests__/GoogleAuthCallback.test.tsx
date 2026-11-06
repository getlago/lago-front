import { render, renderHook, waitFor } from '@testing-library/react'
import { GraphQLFormattedError } from 'graphql'
import { StrictMode } from 'react'

import { GoogleOauthFlow, storeGoogleOauthFlow } from '~/components/auth/googleOauthFlow'
import { envGlobalVar } from '~/core/apolloClient'
import { LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { removeItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken, unloadRecaptcha } from '~/core/utils/recaptcha'
import { GoogleSignUpMutation, LagoApiError } from '~/generated/graphql'

// Import after mocks
import GoogleAuthCallback from '../GoogleAuthCallback'

type EnvGlobal = ReturnType<typeof envGlobalVar>
type SignUpAnswer = { data: GoogleSignUpMutation | null; errors?: GraphQLFormattedError[] }

const mockNavigate = jest.fn()
const mockSetItemFromLS = setItemFromLS as jest.Mock
const mockRemoveItemFromLS = removeItemFromLS as jest.Mock
const mockOnLogIn = jest.fn()
const mockGoogleLoginUser = jest.fn()
const mockGoogleSignUp = jest.fn()
const mockUseGoogleSignUpMutation = jest.fn()
const mockUseSearchParams = jest.fn()
const mockApolloClient = {}

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockApolloClient,
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
  generatePath: jest.fn((route, params) => {
    return route.replace(':token', params.token)
  }),
}))

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  return {
    ...actual,
    envGlobalVar: jest.fn(actual.envGlobalVar),
    hasDefinedGQLError: jest.fn(
      (
        code: Parameters<typeof actual.hasDefinedGQLError>[0],
        errors?: readonly GraphQLFormattedError[],
      ) =>
        !!errors?.some((e) => e.extensions?.code === code) ||
        !!actual.hasDefinedGQLError(code, errors),
    ),
    onLogIn: (...args: unknown[]) => mockOnLogIn(...args),
  }
})

jest.mock('~/core/utils/localStorage', () => ({
  ...jest.requireActual('~/core/utils/localStorage'),
  setItemFromLS: jest.fn(),
  removeItemFromLS: jest.fn(),
}))

jest.mock('~/core/utils/recaptcha', () => ({
  getRecaptchaToken: jest.fn(),
  unloadRecaptcha: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGoogleLoginUserMutation: () => [mockGoogleLoginUser],
  useGoogleSignUpMutation: (...args: unknown[]) => mockUseGoogleSignUpMutation(...args),
}))

const mockedEnvGlobalVar = jest.mocked(envGlobalVar)
const mockedGetRecaptchaToken = jest.mocked(getRecaptchaToken)
const mockedUnloadRecaptcha = jest.mocked(unloadRecaptcha)

const GOOGLE_CODE = 'google-auth-code'
const SIGNED_STATE = '1793952050.abcdef0123456789'
const STATE_SECRET = 'state-secret-1'
const INVITATION_TOKEN = 'inv-token'
const SESSION_TOKEN = 'session-token-1'
const RECAPTCHA_TOKEN = 'recaptcha-token-1'

const SIGN_UP_SUCCESS: SignUpAnswer = { data: { googleSignUp: { token: SESSION_TOKEN } } }

const buildErrorAnswer = (extensions?: Record<string, unknown>): SignUpAnswer => ({
  data: null,
  errors: [{ message: 'error', ...(extensions && { extensions }) }],
})

const LOCK_ERROR = buildErrorAnswer({ status: 422, code: LagoApiError.LockAcquisitionFailed })

const buildSearchParams = (params: Record<string, string>) => {
  const sp = new URLSearchParams()

  Object.entries(params).forEach(([k, v]) => sp.set(k, v))

  return [sp, jest.fn()] as const
}

const getRealEnv = (): EnvGlobal =>
  jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient').envGlobalVar()

const mockSelfServeEnabled = (selfServeEnabled: boolean): void => {
  mockedEnvGlobalVar.mockReturnValue({ ...getRealEnv(), selfServeEnabled })
}

const keepFlow = (flow: Omit<GoogleOauthFlow, 'stateSecret'>): void => {
  storeGoogleOauthFlow({ stateSecret: STATE_SECRET, ...flow })
}

const mockGoogleAnswer = (params: Record<string, string>): void => {
  mockUseSearchParams.mockReturnValue(buildSearchParams(params))
}

const renderCallback = (): void => {
  render(<GoogleAuthCallback />, { wrapper: StrictMode })
}

const REPLACE_NAVIGATION = { replace: true }

const navigationTo = (pathname: string, errorCode: string) => ({
  pathname,
  search: `?lago_error_code=${errorCode}`,
})

describe('GoogleAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    mockSelfServeEnabled(false)
    mockGoogleLoginUser.mockReset()
    mockGoogleSignUp.mockReset()
    mockUseGoogleSignUpMutation.mockReturnValue([mockGoogleSignUp])
    mockedGetRecaptchaToken.mockReset()
    mockedGetRecaptchaToken.mockResolvedValue(RECAPTCHA_TOKEN)
    mockOnLogIn.mockResolvedValue(undefined)
  })

  describe('GIVEN a successful Google login with a redirect path', () => {
    const redirectPath = '/customers/123/information'

    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'google-auth-code',
          state: JSON.stringify({ mode: 'login', redirectPath }),
        }),
      )
      mockGoogleLoginUser.mockResolvedValue({
        data: { googleLoginUser: { token: 'test-token' } },
      })
    })

    describe('WHEN the callback processes', () => {
      it('THEN should store the redirect path in localStorage before onLogIn', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockSetItemFromLS).toHaveBeenCalledWith(REDIRECT_AFTER_LOGIN_LS_KEY, redirectPath)
        })

        // Verify setItemFromLS was called before onLogIn
        const setItemOrder = mockSetItemFromLS.mock.invocationCallOrder[0]
        const onLogInOrder = mockOnLogIn.mock.invocationCallOrder[0]

        expect(setItemOrder).toBeLessThan(onLogInOrder)
      })

      it('THEN should NOT remove redirect path from localStorage (Home.tsx handles cleanup)', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockRemoveItemFromLS).not.toHaveBeenCalledWith(REDIRECT_AFTER_LOGIN_LS_KEY)
      })

      it('THEN should NOT navigate directly (Home.tsx handles redirect via localStorage bridge)', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockNavigate).not.toHaveBeenCalledWith({ pathname: redirectPath })
      })
    })
  })

  describe('GIVEN a successful Google login without a redirect path', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'google-auth-code',
          state: JSON.stringify({ mode: 'login' }),
        }),
      )
      mockGoogleLoginUser.mockResolvedValue({
        data: { googleLoginUser: { token: 'test-token' } },
      })
    })

    describe('WHEN the callback processes', () => {
      it('THEN should not store anything in localStorage', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        expect(mockSetItemFromLS).not.toHaveBeenCalledWith(
          REDIRECT_AFTER_LOGIN_LS_KEY,
          expect.anything(),
        )
      })

      it('THEN should not navigate to any path', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })

        // Should not navigate to a pathname object (only the !code redirect may fire)
        expect(mockNavigate).not.toHaveBeenCalledWith(
          expect.objectContaining({ pathname: expect.any(String) }),
        )
      })
    })
  })

  describe('GIVEN a successful Google login with an off-origin redirect path', () => {
    // `state` is parsed straight off the URL query at GoogleAuthCallback.tsx:35,
    // so this value is attacker-controlled.
    it.each([
      '//evil.com',
      '///evil.com',
      '/\\evil.com',
      '\\/evil.com',
      'https://evil.com',
      'javascript:alert(1)//',
    ])('THEN %s is never persisted to localStorage', async (redirectPath) => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'google-auth-code',
          state: JSON.stringify({ mode: 'login', redirectPath }),
        }),
      )
      mockGoogleLoginUser.mockResolvedValue({
        data: { googleLoginUser: { token: 'test-token' } },
      })

      renderHook(() => GoogleAuthCallback())

      await waitFor(() => {
        expect(mockOnLogIn).toHaveBeenCalled()
      })

      expect(mockSetItemFromLS).not.toHaveBeenCalledWith(
        REDIRECT_AFTER_LOGIN_LS_KEY,
        expect.anything(),
      )
    })
  })

  describe('GIVEN Google login returns an error', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'google-auth-code',
          state: JSON.stringify({ mode: 'login' }),
        }),
      )
    })

    describe('WHEN LoginMethodNotAuthorized error is returned', () => {
      it('THEN should navigate to login with the error code', async () => {
        mockGoogleLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'LoginMethodNotAuthorized' } }],
        })

        renderHook(() => GoogleAuthCallback())

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
      it('THEN should navigate to login with the error details', async () => {
        mockGoogleLoginUser.mockResolvedValue({
          errors: [{ extensions: { code: 'SomeOtherError', details: { base: ['some_error'] } } }],
        })

        renderHook(() => GoogleAuthCallback())

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

  describe('GIVEN the mode is signup', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'google-auth-code',
          state: JSON.stringify({ mode: 'signup' }),
        }),
      )
    })

    describe('WHEN the callback processes', () => {
      it('THEN should navigate to signup with the code', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/sign-up',
              search: '?code=google-auth-code',
            }),
          )
        })
      })
    })
  })

  describe('GIVEN the mode is invite', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(
        buildSearchParams({
          code: 'google-auth-code',
          state: JSON.stringify({ mode: 'invite', invitationToken: 'inv-token' }),
        }),
      )
    })

    describe('WHEN the callback processes', () => {
      it('THEN should navigate to invitation form with the code', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
              search: '?code=google-auth-code',
            }),
            expect.anything(),
          )
        })
      })

      it('THEN should not hand any Google state to the invitation form', async () => {
        renderHook(() => GoogleAuthCallback())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            { pathname: `/invitation/${INVITATION_TOKEN}/form`, search: '?code=google-auth-code' },
            { state: undefined },
          )
        })
      })
    })
  })

  describe('GIVEN a legacy Google login without a kept flow', () => {
    beforeEach(() => {
      mockGoogleAnswer({ code: GOOGLE_CODE, state: JSON.stringify({ mode: 'login' }) })
      mockGoogleLoginUser.mockResolvedValue({ data: { googleLoginUser: { token: SESSION_TOKEN } } })
    })

    describe('WHEN the callback processes', () => {
      it('THEN should log in with the code only', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalledWith(mockApolloClient, SESSION_TOKEN)
        })
        expect(mockGoogleLoginUser).toHaveBeenCalledTimes(1)
        expect(mockGoogleLoginUser).toHaveBeenCalledWith({
          variables: { input: { code: GOOGLE_CODE } },
        })
      })
    })
  })

  describe('GIVEN self-serve is disabled and the legacy state carries a state secret', () => {
    describe('WHEN the mode is login', () => {
      it('THEN should log in with the code only', async () => {
        mockGoogleAnswer({
          code: GOOGLE_CODE,
          state: JSON.stringify({ mode: 'login', stateSecret: 'x' }),
        })
        mockGoogleLoginUser.mockResolvedValue({
          data: { googleLoginUser: { token: SESSION_TOKEN } },
        })

        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalledWith(mockApolloClient, SESSION_TOKEN)
        })
        expect(mockGoogleLoginUser).toHaveBeenCalledTimes(1)
        expect(mockGoogleLoginUser).toHaveBeenCalledWith({
          variables: { input: { code: GOOGLE_CODE } },
        })
      })
    })

    describe('WHEN the mode is signup', () => {
      it('THEN should open the legacy sign-up page with the code without the Google sign-up', () => {
        mockGoogleAnswer({
          code: GOOGLE_CODE,
          state: JSON.stringify({ mode: 'signup', stateSecret: 'x' }),
        })

        renderCallback()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith({
          pathname: SIGN_UP_ROUTE,
          search: `?code=${GOOGLE_CODE}`,
        })
        expect(mockGoogleSignUp).not.toHaveBeenCalled()
        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN self-serve is enabled and this tab kept no flow', () => {
    beforeEach(() => {
      mockSelfServeEnabled(true)
      mockGoogleAnswer({ code: GOOGLE_CODE, state: JSON.stringify({ mode: 'login' }) })
    })

    describe('WHEN the callback processes', () => {
      it('THEN should send the user to the login page with the invalid state error', () => {
        renderCallback()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(
          navigationTo(LOGIN_ROUTE, LagoApiError.InvalidGoogleState),
          REPLACE_NAVIGATION,
        )
      })

      it('THEN should not call the API', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled()
        })
        expect(mockGoogleLoginUser).not.toHaveBeenCalled()
        expect(mockGoogleSignUp).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN this tab kept a sign-up flow', () => {
    beforeEach(() => {
      mockSelfServeEnabled(true)
      keepFlow({ mode: 'signup' })
    })

    describe('WHEN Google returned no code', () => {
      beforeEach(() => {
        mockGoogleAnswer({ error: 'access_denied', state: SIGNED_STATE })
      })

      it('THEN should send the user back to the sign-up page with the incomplete error', () => {
        renderCallback()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(
          navigationTo(SIGN_UP_ROUTE, LagoApiError.InvalidGoogleCode),
          REPLACE_NAVIGATION,
        )
      })

      it('THEN should neither ask for a captcha token nor sign up', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled()
        })
        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()
        expect(mockGoogleSignUp).not.toHaveBeenCalled()
      })
    })

    describe('WHEN Google returned a code', () => {
      beforeEach(() => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleSignUp.mockResolvedValue(SIGN_UP_SUCCESS)
      })

      it('THEN should sign up with the code, the signed state, the kept secret and a signup_google captcha token', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockGoogleSignUp).toHaveBeenCalledTimes(1)
        })
        expect(mockedGetRecaptchaToken.mock.calls).toEqual([['signup_google']])
        expect(mockGoogleSignUp).toHaveBeenCalledWith({
          variables: {
            input: {
              code: GOOGLE_CODE,
              state: SIGNED_STATE,
              stateSecret: STATE_SECRET,
              captchaToken: RECAPTCHA_TOKEN,
            },
          },
        })
      })

      it('THEN should silence the error toasts of the sign-up mutation', () => {
        renderCallback()

        expect(mockUseGoogleSignUpMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
      })

      it('THEN should log the tab in with the returned token without any navigation', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalledWith(mockApolloClient, SESSION_TOKEN)
        })
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('THEN should unload reCAPTCHA once the sign-up has answered', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockedUnloadRecaptcha).toHaveBeenCalledTimes(1)
        })
        expect(mockedUnloadRecaptcha.mock.invocationCallOrder[0]).toBeGreaterThan(
          mockGoogleSignUp.mock.invocationCallOrder[0],
        )
      })

      it('THEN should sign up only once although StrictMode runs the effect twice', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalledTimes(1)
        })
        expect(mockGoogleSignUp).toHaveBeenCalledTimes(1)
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('THEN should not call the Google login', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })
        expect(mockGoogleLoginUser).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the email lock is busy', () => {
      it('THEN should not send the single-use code again and send the error back to the sign-up page', async () => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleSignUp.mockResolvedValue(LOCK_ERROR)

        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            navigationTo(SIGN_UP_ROUTE, LagoApiError.LockAcquisitionFailed),
            REPLACE_NAVIGATION,
          )
        })
        expect(mockGoogleSignUp).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the Google account already has a user', () => {
      it.each([
        [LagoApiError.UserDoesNotExist, LagoApiError.UserDoesNotExist],
        [LagoApiError.LoginMethodNotAuthorized, LagoApiError.GoogleLoginMethodNotAuthorized],
      ])('THEN should send %s to the login page as %s', async (detailCode, expectedErrorCode) => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleSignUp.mockResolvedValue(
          buildErrorAnswer({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { googleOauth: [detailCode] },
          }),
        )

        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            navigationTo(LOGIN_ROUTE, expectedErrorCode),
            REPLACE_NAVIGATION,
          )
        })
        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the sign-up is refused', () => {
      it.each([
        [
          'a personal Google account',
          buildErrorAnswer({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { base: [LagoApiError.CompanyGoogleAccountRequired] },
          }),
          LagoApiError.CompanyGoogleAccountRequired,
        ],
        [
          'a state that does not match the kept secret',
          buildErrorAnswer({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { base: [LagoApiError.InvalidGoogleState] },
          }),
          LagoApiError.InvalidGoogleState,
        ],
        [
          'a Google code that cannot be exchanged',
          buildErrorAnswer({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { base: [LagoApiError.InvalidGoogleCode] },
          }),
          LagoApiError.InvalidGoogleCode,
        ],
        [
          'a failed captcha',
          buildErrorAnswer({ status: 403, code: LagoApiError.CaptchaFailed }),
          LagoApiError.CaptchaFailed,
        ],
        [
          'sign-ups being disabled',
          buildErrorAnswer({ status: 403, code: LagoApiError.SignupDisabled }),
          LagoApiError.SignupDisabled,
        ],
        [
          'Google not being configured',
          buildErrorAnswer({ status: 500, code: LagoApiError.GoogleAuthMissingSetup }),
          LagoApiError.GoogleAuthMissingSetup,
        ],
        ['an error without code', buildErrorAnswer({ status: 500 }), 'unknown'],
        ['an answer without token nor error', { data: { googleSignUp: null } }, 'unknown'],
      ])('THEN should send %s back to the sign-up page', async (_, answer, expectedErrorCode) => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleSignUp.mockResolvedValue(answer)

        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            navigationTo(SIGN_UP_ROUTE, expectedErrorCode),
            REPLACE_NAVIGATION,
          )
        })
        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockGoogleSignUp).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the sign-up request fails', () => {
      it('THEN should send the internal error back to the sign-up page', async () => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleSignUp.mockRejectedValue(new Error('Failed to fetch'))

        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            navigationTo(SIGN_UP_ROUTE, LagoApiError.InternalError),
            REPLACE_NAVIGATION,
          )
        })
        expect(mockedUnloadRecaptcha).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN this tab kept a login flow', () => {
    beforeEach(() => {
      mockSelfServeEnabled(true)
    })

    describe('WHEN Google returned a code', () => {
      beforeEach(() => {
        keepFlow({ mode: 'login' })
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleLoginUser.mockResolvedValue({
          data: { googleLoginUser: { token: SESSION_TOKEN } },
        })
      })

      it('THEN should log in with the code, the signed state and the kept secret', async () => {
        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalledWith(mockApolloClient, SESSION_TOKEN)
        })
        expect(mockGoogleLoginUser).toHaveBeenCalledTimes(1)
        expect(mockGoogleLoginUser).toHaveBeenCalledWith({
          variables: {
            input: { code: GOOGLE_CODE, state: SIGNED_STATE, stateSecret: STATE_SECRET },
          },
        })
        expect(mockGoogleSignUp).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the kept flow holds a redirect path', () => {
      beforeEach(() => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleLoginUser.mockResolvedValue({
          data: { googleLoginUser: { token: SESSION_TOKEN } },
        })
      })

      it('THEN should store an in-app path before logging in', async () => {
        keepFlow({ mode: 'login', redirectPath: '/customers/123/information' })

        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })
        expect(mockSetItemFromLS).toHaveBeenCalledWith(
          REDIRECT_AFTER_LOGIN_LS_KEY,
          '/customers/123/information',
        )
      })

      it('THEN should never store an off-origin path', async () => {
        keepFlow({ mode: 'login', redirectPath: '//evil.com' })

        renderCallback()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalled()
        })
        expect(mockSetItemFromLS).not.toHaveBeenCalledWith(
          REDIRECT_AFTER_LOGIN_LS_KEY,
          expect.anything(),
        )
      })
    })

    describe('WHEN the API refuses the state', () => {
      it('THEN should send the error to the login page', async () => {
        keepFlow({ mode: 'login' })
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })
        mockGoogleLoginUser.mockResolvedValue(
          buildErrorAnswer({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { base: [LagoApiError.InvalidGoogleState] },
          }),
        )

        renderCallback()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            navigationTo(LOGIN_ROUTE, LagoApiError.InvalidGoogleState),
          )
        })
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN Google returned no code', () => {
      it('THEN should send the user back to the login page without calling the API', async () => {
        keepFlow({ mode: 'login' })
        mockGoogleAnswer({ error: 'access_denied', state: SIGNED_STATE })

        renderCallback()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(LOGIN_ROUTE)
        expect(mockGoogleLoginUser).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN this tab kept an invite flow', () => {
    beforeEach(() => {
      mockSelfServeEnabled(true)
      keepFlow({ mode: 'invite', invitationToken: INVITATION_TOKEN })
    })

    describe('WHEN Google returned a code', () => {
      it('THEN should open the invitation form with the code and hand over the signed state and the kept secret', () => {
        mockGoogleAnswer({ code: GOOGLE_CODE, state: SIGNED_STATE })

        renderCallback()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(
          { pathname: `/invitation/${INVITATION_TOKEN}/form`, search: `?code=${GOOGLE_CODE}` },
          { state: { googleState: SIGNED_STATE, googleStateSecret: STATE_SECRET } },
        )
        expect(mockGoogleLoginUser).not.toHaveBeenCalled()
      })
    })

    describe('WHEN Google returned no code', () => {
      it('THEN should send the user back to the login page', () => {
        mockGoogleAnswer({ error: 'access_denied', state: SIGNED_STATE })

        renderCallback()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(LOGIN_ROUTE)
      })
    })
  })
})
