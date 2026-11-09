import { ApolloError } from '@apollo/client'
import { act, screen, within } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'
import { StrictMode } from 'react'

import { envGlobalVar, initializeTranslations } from '~/core/apolloClient'
import { HOME_ROUTE, LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { removeItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken, unloadRecaptcha } from '~/core/utils/recaptcha'
import {
  ConfirmSignupEmailMutation,
  LagoApiError,
  ResendSignupEmailMutation,
  SignupVerificationQuery,
  SignupVerificationStatusEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
} from '../signUpTestIds'
import VerifyEmail from '../VerifyEmail'

type Verification = SignupVerificationQuery['signupVerification']
type QueryAnswer = { data?: SignupVerificationQuery; loading: boolean; error?: ApolloError }
type ErrorAnswer = { data: null; errors: GraphQLFormattedError[] }
type EnvGlobal = ReturnType<typeof envGlobalVar>

const mockClient = { query: jest.fn(), mutate: jest.fn() }
const mockUseSignupVerificationQuery = jest.fn()
const mockRefetch = jest.fn()
const mockUseConfirmSignupEmailMutation = jest.fn()
const mockUseResendSignupEmailMutation = jest.fn()
const mockConfirmSignupEmail = jest.fn()
const mockResendSignupEmail = jest.fn()
const mockOnLogIn = jest.fn()
const mockAuthTokenVar = jest.fn()
const mockNavigate = jest.fn()
const mockLogOut = jest.fn()
const mockIsAuthenticated = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockClient,
}))

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  return {
    ...actual,
    envGlobalVar: jest.fn(actual.envGlobalVar),
    logOut: (...args: unknown[]) => mockLogOut(...args),
    onLogIn: (...args: unknown[]) => mockOnLogIn(...args),
  }
})

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  ...jest.requireActual('~/core/apolloClient/reactiveVars'),
  authTokenVar: () => mockAuthTokenVar(),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => ({
    isAuthenticated: mockIsAuthenticated(),
    isPortalAuthenticated: false,
  }),
}))

jest.mock('~/core/utils/recaptcha', () => ({
  getRecaptchaToken: jest.fn(),
  unloadRecaptcha: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useSignupVerificationQuery: (...args: unknown[]) => mockUseSignupVerificationQuery(...args),
  useConfirmSignupEmailMutation: (...args: unknown[]) => mockUseConfirmSignupEmailMutation(...args),
  useResendSignupEmailMutation: (...args: unknown[]) => mockUseResendSignupEmailMutation(...args),
}))

const mockedGetRecaptchaToken = jest.mocked(getRecaptchaToken)
const mockedUnloadRecaptcha = jest.mocked(unloadRecaptcha)
const mockedEnvGlobalVar = jest.mocked(envGlobalVar)

const VERIFY_EMAIL_PATH = '/verify-email'
const TOKEN = 'signup-token-1'
const EMAIL = 'raffi@hooli.com'
const PASSWORD = 'Abcdefg1!'
const SIGNUP_SECRET = 'signup-secret-1'
const OTHER_SIGNUP_SECRET = 'signup-secret-2'
const SESSION_TOKEN = 'session-token-1'
const RECAPTCHA_TOKEN = 'recaptcha-token-1'
const RECAPTCHA_SITE_KEY = 'recaptcha-site-key'
const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy'
const GOOGLE_TERMS_URL = 'https://policies.google.com/terms'

const CONFIRM_TITLE_COPY = 'Confirm your email'
const CONFIRM_TEXT_COPY = `You're one click away from creating your Lago account for ${EMAIL}.`
const CONFIRM_BUTTON_COPY = 'Confirm and continue'
const VERIFYING_TITLE_COPY = 'Verifying your email…'
const VERIFYING_TEXT_COPY = 'This only takes a second.'
const EXPIRED_TITLE_COPY = 'This link has expired'
const EXPIRED_TEXT_COPY =
  'Verification links are valid for 24 hours. Send yourself a new one to continue.'
const REPLACED_TITLE_COPY = 'This link is no longer valid'
const REPLACED_TEXT_COPY = 'We sent you a newer link. Use the most recent email from Lago.'
const LOCKED_TITLE_COPY = 'Too many incorrect passwords for this link.'
const ALREADY_VERIFIED_TITLE_COPY = 'Your email is already verified'
const ALREADY_VERIFIED_TEXT_COPY = 'You can pick up where you left off.'
const INVALID_TITLE_COPY = "We couldn't verify this link"
const INVALID_TEXT_COPY =
  "It may be incomplete or already replaced. Request a new one and we'll send it to your inbox."
const SIGN_UP_EXPIRED_COPY = 'This sign-up has expired'
const SEND_NEW_LINK_COPY = 'Send a new link'
const CONTINUE_COPY = 'Continue to Lago'
const BACK_TO_SIGN_UP_COPY = 'Back to sign up'
const PASSWORD_LABEL_COPY = 'Password'
const PASSWORD_HELPER_COPY = 'The password you chose when signing up'
const PASSWORD_REQUIRED_COPY = 'Password is required'
const INCORRECT_PASSWORD_COPY = "This isn't the password you chose when signing up."
const NEW_LINK_SENT_COPY = 'We sent a new link. Check your inbox.'
const RESEND_LIMIT_COPY =
  "We've sent several links already. Check your spam folder or try again in an hour."
const TOO_MANY_ATTEMPTS_COPY = 'Too many attempts. Please wait a few minutes and try again.'
const SIGN_UP_UNAVAILABLE_COPY = 'Sign-up is unavailable right now. Please reload the page.'
const CAPTCHA_FAILED_COPY = "We couldn't confirm you're human. Please try again."
const GENERIC_ERROR_COPY = 'Something went wrong on our side. Please try again.'
const RETRY_COPY = 'Retry'
const LOGGED_IN_TITLE_COPY = "You're already logged in"
const LOGGED_IN_TEXT_COPY = 'Log out of your current account to confirm this email address.'
const RECAPTCHA_NOTICE_COPY =
  'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.'
const RECAPTCHA_NOTICE_START = /^This site is protected by reCAPTCHA/

const ACTION_TEST_IDS = [
  SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID,
]

const CONFIRM_SUCCESS: { data: ConfirmSignupEmailMutation } = {
  data: { confirmSignupEmail: { token: SESSION_TOKEN } },
}

const RESEND_SUCCESS: { data: ResendSignupEmailMutation } = {
  data: { resendSignupEmail: { resendAvailableInSeconds: 60, resendLimitReached: false } },
}

const buildVerification = (verification: Partial<Verification> = {}): QueryAnswer => ({
  loading: false,
  data: {
    signupVerification: {
      status: SignupVerificationStatusEnum.Valid,
      email: EMAIL,
      passwordRequired: false,
      ...verification,
    },
  },
})

const answerVerification = (answer: QueryAnswer): void => {
  mockUseSignupVerificationQuery.mockImplementation(({ skip }: { skip: boolean }) => ({
    ...(skip ? { loading: false, data: undefined } : answer),
    refetch: mockRefetch,
  }))
}

const answerStatus = (status: SignupVerificationStatusEnum): void =>
  answerVerification(buildVerification({ status, email: null }))

const buildError = (code: string, details?: Record<string, unknown>): ErrorAnswer => ({
  data: null,
  errors: [{ message: 'error', extensions: { code, ...(details && { details }) } }],
})

const buildCheckError = (code: string): ApolloError =>
  new ApolloError({ graphQLErrors: [{ message: 'error', extensions: { code } }] })

const NETWORK_CHECK_ERROR = new ApolloError({ networkError: new Error('Failed to fetch') })

const buildPasswordError = (
  passwordCode: LagoApiError.PasswordRequired | LagoApiError.IncorrectPassword,
): ErrorAnswer => buildError(LagoApiError.UnprocessableEntity, { password: [passwordCode] })

const deferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

const openLink = (search: string): void => {
  window.history.replaceState(null, '', `${VERIFY_EMAIL_PATH}${search}`)
}

const getRealEnv = (): EnvGlobal =>
  jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient').envGlobalVar()

const mockRecaptchaSiteKey = (recaptchaSiteKey: EnvGlobal['recaptchaSiteKey']): void => {
  mockedEnvGlobalVar.mockReturnValue({ ...getRealEnv(), recaptchaSiteKey })
}

const VerifyEmailPage = (): JSX.Element => (
  <StrictMode>
    <VerifyEmail />
  </StrictMode>
)

const renderVerifyEmail = (): ReturnType<typeof render> => render(<VerifyEmailPage />)

const getPage = (): HTMLElement => document.body

const getReferrerMetas = (): HTMLMetaElement[] =>
  Array.from(document.head.querySelectorAll<HTMLMetaElement>('meta[name="referrer"]'))

const getPasswordField = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID)

const getPasswordInput = (): HTMLInputElement =>
  getPasswordField().querySelector('input') as HTMLInputElement

const getPasswordFieldBlock = (): HTMLElement => getPasswordField().parentElement as HTMLElement

const queryPasswordField = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID)

const getConfirmButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID)

const queryConfirmButton = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID)

const getSendNewLinkButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID)

const querySendNewLinkButton = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID)

const getResendAlert = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID)

const queryResendAlert = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID)

const getErrorAlert = (): HTMLElement => screen.getByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)

const queryErrorAlert = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)

const getLinksTo = (href: string): HTMLElement[] =>
  screen.queryAllByRole('link').filter((link) => link.getAttribute('href') === href)

const getStoredSecret = (): string | null => localStorage.getItem(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

const clickConfirm = async (user: UserEvent): Promise<void> => {
  await user.click(getConfirmButton())
  await flush()
}

const typePasswordAndConfirm = async (user: UserEvent, password = PASSWORD): Promise<void> => {
  await user.click(getPasswordInput())
  await user.paste(password)
  await clickConfirm(user)
}

const logInWithSession = (): void => {
  mockAuthTokenVar.mockReturnValue('')
  mockOnLogIn.mockImplementation(async (_client: unknown, sessionToken: string) => {
    mockAuthTokenVar.mockReturnValue(sessionToken)
  })
}

const logInWithoutSession = (): void => {
  mockAuthTokenVar.mockReturnValue('')
  mockOnLogIn.mockResolvedValue(undefined)
}

const CONFIRM_PATHS = [
  {
    path: 'secret',
    passwordRequired: false,
    confirm: clickConfirm,
    input: { token: TOKEN, signupSecret: SIGNUP_SECRET },
  },
  {
    path: 'password',
    passwordRequired: true,
    confirm: typePasswordAndConfirm,
    input: { token: TOKEN, password: PASSWORD, captchaToken: RECAPTCHA_TOKEN },
  },
]

const getRetryButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID)

const clickRetry = async (user: UserEvent): Promise<void> => {
  await user.click(getRetryButton())
  await flush()
}

const getRouteNavigations = (): unknown[][] =>
  mockNavigate.mock.calls.filter(([to]) => typeof to === 'string')

const clickSendNewLink = async (user: UserEvent): Promise<void> => {
  await user.click(getSendNewLinkButton())
  await flush()
}

describe('VerifyEmail', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    openLink(`?token=${TOKEN}`)
    setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, SIGNUP_SECRET)
    answerVerification(buildVerification())
    mockRefetch.mockResolvedValue(buildVerification())
    mockUseConfirmSignupEmailMutation.mockReturnValue([mockConfirmSignupEmail])
    mockUseResendSignupEmailMutation.mockReturnValue([mockResendSignupEmail, { loading: false }])
    mockConfirmSignupEmail.mockResolvedValue(CONFIRM_SUCCESS)
    mockResendSignupEmail.mockResolvedValue(RESEND_SUCCESS)
    mockedGetRecaptchaToken.mockResolvedValue(RECAPTCHA_TOKEN)
    mockOnLogIn.mockResolvedValue(undefined)
    mockAuthTokenVar.mockReturnValue('')
    mockIsAuthenticated.mockReturnValue(false)
    mockLogOut.mockResolvedValue(undefined)
    mockRecaptchaSiteKey('')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
    openLink('')
  })

  describe('GIVEN the user leaves the page', () => {
    describe('WHEN it unmounts', () => {
      it('THEN should unload reCAPTCHA', () => {
        const { unmount } = renderVerifyEmail()

        mockedUnloadRecaptcha.mockClear()
        unmount()

        expect(mockedUnloadRecaptcha).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the page is opened from the link', () => {
    describe('WHEN it mounts', () => {
      it('THEN should replace the URL through the router without the token, on the same page', () => {
        renderVerifyEmail()

        expect(mockNavigate).toHaveBeenCalledWith(
          { search: '', hash: '' },
          { replace: true, state: null },
        )
      })

      it('THEN should keep the other query params, the hash and the router state', () => {
        openLink(`?ifrm=true&token=${TOKEN}#details`)
        window.history.replaceState(
          { usr: { from: '/customers' }, key: 'default', idx: 0 },
          '',
          window.location.href,
        )

        renderVerifyEmail()

        expect(mockNavigate).toHaveBeenCalledWith(
          { search: '?ifrm=true', hash: '#details' },
          { replace: true, state: { from: '/customers' } },
        )
      })

      it('THEN should add a single no-referrer meta', () => {
        renderVerifyEmail()

        const metas = getReferrerMetas()

        expect(metas).toHaveLength(1)
        expect(metas[0]).toHaveAttribute('content', 'no-referrer')
      })

      it('THEN should check the link with the token and the stored secret, without cache nor toast', () => {
        renderVerifyEmail()

        expect(mockUseSignupVerificationQuery).toHaveBeenCalledWith({
          variables: { token: TOKEN, signupSecret: SIGNUP_SECRET },
          skip: false,
          fetchPolicy: 'no-cache',
          notifyOnNetworkStatusChange: true,
          context: { silentError: true },
        })
      })

      it('THEN should silence the error toasts of both mutations', () => {
        renderVerifyEmail()

        expect(mockUseConfirmSignupEmailMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
        expect(mockUseResendSignupEmailMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
      })
    })

    describe('WHEN no secret is stored', () => {
      it('THEN should check the link with a null secret', () => {
        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

        renderVerifyEmail()

        expect(mockUseSignupVerificationQuery).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { token: TOKEN, signupSecret: null } }),
        )
      })
    })

    describe('WHEN it unmounts', () => {
      it('THEN should apply the default policy again before removing its meta', () => {
        const { unmount } = renderVerifyEmail()
        const [meta] = getReferrerMetas()

        unmount()

        expect(meta).toHaveAttribute('content', 'strict-origin-when-cross-origin')
        expect(meta).not.toBeInTheDocument()
        expect(getReferrerMetas()).toHaveLength(0)
      })
    })

    describe('WHEN the document already sets a referrer policy', () => {
      it('THEN should override it while mounted and restore it after', () => {
        const existingMeta = document.createElement('meta')

        existingMeta.name = 'referrer'
        existingMeta.content = 'origin'
        document.head.appendChild(existingMeta)

        const { unmount } = renderVerifyEmail()

        expect(getReferrerMetas()).toEqual([existingMeta])
        expect(existingMeta).toHaveAttribute('content', 'no-referrer')

        unmount()

        expect(getReferrerMetas()).toEqual([existingMeta])
        expect(existingMeta).toHaveAttribute('content', 'origin')

        existingMeta.remove()
      })
    })

    describe('WHEN the link has no token', () => {
      beforeEach(() => {
        openLink('')
        answerVerification(buildVerification())
      })

      it('THEN should skip the link check', () => {
        renderVerifyEmail()

        expect(mockUseSignupVerificationQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { token: '', signupSecret: SIGNUP_SECRET },
            skip: true,
          }),
        )
      })

      it('THEN should show the invalid link state', () => {
        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(INVALID_TITLE_COPY)
        expect(getPage()).toHaveTextContent(INVALID_TEXT_COPY)
        expect(
          screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(queryConfirmButton()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the link is being checked', () => {
      it('THEN should show neither a state nor an action', () => {
        answerVerification({ loading: true, data: undefined })

        renderVerifyEmail()

        expect(getPage()).not.toHaveTextContent(CONFIRM_TITLE_COPY)
        expect(getPage()).not.toHaveTextContent(INVALID_TITLE_COPY)
        ACTION_TEST_IDS.forEach((testId) => {
          expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN the link check answers no verification', () => {
      it('THEN should show the invalid link state instead of loading forever', () => {
        answerVerification({ loading: false, data: undefined })

        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(INVALID_TITLE_COPY)
      })
    })

    describe('WHEN the link check answers a status this build does not know', () => {
      it('THEN should show the invalid link state instead of loading forever', () => {
        answerVerification(
          buildVerification({ status: 'archived' as SignupVerificationStatusEnum }),
        )

        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(INVALID_TITLE_COPY)
      })
    })

    describe('WHEN the link check fails on the network', () => {
      beforeEach(() => {
        setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, SIGNUP_SECRET)
        answerVerification({ loading: false, data: undefined, error: NETWORK_CHECK_ERROR })
      })

      it('THEN should show the generic banner with a retry button', () => {
        renderVerifyEmail()

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(getRetryButton()).toHaveTextContent(RETRY_COPY)
      })

      it('THEN should show neither the invalid state nor its actions, even with a stored secret', () => {
        renderVerifyEmail()

        expect(getPage()).not.toHaveTextContent(INVALID_TITLE_COPY)
        expect(getPage()).not.toHaveTextContent(INVALID_TEXT_COPY)
        ACTION_TEST_IDS.forEach((testId) => {
          expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN the link check answers an error with its own message', () => {
      it.each([
        [LagoApiError.TooManyRequests, TOO_MANY_ATTEMPTS_COPY],
        [LagoApiError.CaptchaFailed, CAPTCHA_FAILED_COPY],
        [LagoApiError.SignupDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.SelfServeDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.InternalError, GENERIC_ERROR_COPY],
      ])('THEN should show the %s message with a retry button', (code, copy) => {
        answerVerification({ loading: false, data: undefined, error: buildCheckError(code) })

        renderVerifyEmail()

        expect(getErrorAlert()).toHaveTextContent(copy)
        expect(getRetryButton()).toBeInTheDocument()
        expect(getPage()).not.toHaveTextContent(INVALID_TITLE_COPY)
      })
    })

    describe('WHEN clicking retry after a failed link check', () => {
      beforeEach(() => {
        answerVerification({ loading: false, data: undefined, error: NETWORK_CHECK_ERROR })
      })

      it('THEN should check the link again once', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await clickRetry(user)

        expect(mockRefetch).toHaveBeenCalledTimes(1)
      })

      it('THEN should show only the loading state while the check runs again', async () => {
        const user = userEvent.setup()
        const { rerender } = renderVerifyEmail()

        await clickRetry(user)
        answerVerification({ loading: true, data: undefined, error: NETWORK_CHECK_ERROR })
        rerender(<VerifyEmailPage />)

        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        ACTION_TEST_IDS.forEach((testId) => {
          expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
        })
      })

      it.each([
        [
          'valid',
          buildVerification(),
          CONFIRM_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
        ],
        [
          'expired',
          buildVerification({ status: SignupVerificationStatusEnum.Expired, email: null }),
          EXPIRED_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
        ],
      ])(
        'THEN should show the %s state once the check succeeds',
        async (_, answer, title, actionTestId) => {
          const user = userEvent.setup()
          const { rerender } = renderVerifyEmail()

          await clickRetry(user)
          answerVerification(answer)
          rerender(<VerifyEmailPage />)

          expect(getPage()).toHaveTextContent(title)
          expect(screen.getByTestId(actionTestId)).toBeInTheDocument()
          expect(queryErrorAlert()).not.toBeInTheDocument()
          expect(
            screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID),
          ).not.toBeInTheDocument()
        },
      )

      it('THEN should swallow a rejected check and keep the retry button', async () => {
        const user = userEvent.setup()
        const onUnhandledRejection = jest.fn()

        mockRefetch.mockRejectedValue(NETWORK_CHECK_ERROR)
        process.on('unhandledRejection', onUnhandledRejection)

        try {
          renderVerifyEmail()
          await clickRetry(user)
          await flush()
        } finally {
          process.off('unhandledRejection', onUnhandledRejection)
        }

        expect(mockRefetch).toHaveBeenCalledTimes(1)
        expect(onUnhandledRejection).not.toHaveBeenCalled()
        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(getRetryButton()).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the link is valid', () => {
    describe('WHEN it renders', () => {
      it.each([
        ['title', CONFIRM_TITLE_COPY],
        ['text with the address', CONFIRM_TEXT_COPY],
        ['confirm button', CONFIRM_BUTTON_COPY],
      ])('THEN should display the %s', (_, copy) => {
        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(copy)
      })

      it('THEN should show the address in bold', () => {
        renderVerifyEmail()

        expect(within(getPage()).getByText(EMAIL).tagName).toBe('B')
      })

      it('THEN should not confirm the email on its own', async () => {
        renderVerifyEmail()
        await flush()

        expect(getConfirmButton()).toBeInTheDocument()
        expect(mockConfirmSignupEmail).not.toHaveBeenCalled()
        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the link is valid and this browser holds the secret', () => {
    describe('WHEN it renders', () => {
      it('THEN should not ask for the password', () => {
        renderVerifyEmail()

        expect(queryPasswordField()).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking confirm and continue', () => {
      it('THEN should submit with an empty password since no field is shown', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()

        expect(queryPasswordField()).not.toBeInTheDocument()

        await clickConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledWith({
          variables: { input: { token: TOKEN, signupSecret: SIGNUP_SECRET } },
        })
        expect(getPage()).not.toHaveTextContent(PASSWORD_REQUIRED_COPY)
      })

      it('THEN should confirm with the token and the secret, without captcha', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await clickConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledTimes(1)
        expect(mockConfirmSignupEmail).toHaveBeenCalledWith({
          variables: { input: { token: TOKEN, signupSecret: SIGNUP_SECRET } },
        })
        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()
      })

      it('THEN should show the verifying state while the confirmation runs', async () => {
        const user = userEvent.setup()
        const confirmation = deferred<typeof CONFIRM_SUCCESS>()

        mockConfirmSignupEmail.mockReturnValueOnce(confirmation.promise)

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getPage()).toHaveTextContent(VERIFYING_TITLE_COPY)
        expect(getPage()).toHaveTextContent(VERIFYING_TEXT_COPY)
        expect(queryConfirmButton()).not.toBeInTheDocument()

        await act(async () => {
          confirmation.resolve(CONFIRM_SUCCESS)
        })
      })

      it('THEN should remove the stored secret and log in with the session token', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getStoredSecret()).toBeNull()
        expect(mockOnLogIn).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })

    describe('WHEN the stored secret changes after the page is shown', () => {
      it.each([
        [
          'replaced',
          (): void => setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, OTHER_SIGNUP_SECRET),
        ],
        ['removed', (): void => removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)],
      ])('THEN should confirm with the secret read at mount when it is %s', async (_, change) => {
        const user = userEvent.setup()

        renderVerifyEmail()
        change()
        await clickConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledWith({
          variables: { input: { token: TOKEN, signupSecret: SIGNUP_SECRET } },
        })
      })
    })

    describe('WHEN the confirmation answers password_required', () => {
      beforeEach(() => {
        mockConfirmSignupEmail.mockResolvedValueOnce(
          buildPasswordError(LagoApiError.PasswordRequired),
        )
      })

      it('THEN should ask for the password without any banner', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getPasswordField()).toBeInTheDocument()
        expect(getConfirmButton()).toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
      })

      it('THEN should confirm with the password and a signup_confirm captcha token next', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await clickConfirm(user)
        await typePasswordAndConfirm(user)

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).toHaveBeenCalledWith('signup_confirm')
        expect(mockConfirmSignupEmail).toHaveBeenLastCalledWith({
          variables: {
            input: { token: TOKEN, password: PASSWORD, captchaToken: RECAPTCHA_TOKEN },
          },
        })
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })
  })

  describe('GIVEN the link is valid and asks for the password', () => {
    beforeEach(() => {
      removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
      answerVerification(buildVerification({ passwordRequired: true }))
    })

    describe('WHEN it renders', () => {
      it('THEN should display the password field with its label and helper', () => {
        renderVerifyEmail()

        expect(getPasswordFieldBlock()).toHaveTextContent(PASSWORD_LABEL_COPY)
        expect(getPasswordFieldBlock()).toHaveTextContent(PASSWORD_HELPER_COPY)
        expect(getPasswordInput()).toHaveAttribute('type', 'password')
      })
    })

    describe('WHEN clicking confirm and continue without a password', () => {
      it('THEN should require the password without confirming', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getPasswordFieldBlock()).toHaveTextContent(PASSWORD_REQUIRED_COPY)
        expect(mockConfirmSignupEmail).not.toHaveBeenCalled()
        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()
      })

      it('THEN should disable confirm and continue until a password is typed', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()

        expect(getConfirmButton()).toBeEnabled()

        await clickConfirm(user)

        expect(getConfirmButton()).toBeDisabled()

        await user.type(getPasswordInput(), PASSWORD)

        expect(getConfirmButton()).toBeEnabled()
        expect(getPasswordFieldBlock()).not.toHaveTextContent(PASSWORD_REQUIRED_COPY)
      })
    })

    describe('WHEN typing the password and confirming', () => {
      it('THEN should confirm with the token, the password and a signup_confirm captcha token', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await typePasswordAndConfirm(user)

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).toHaveBeenCalledWith('signup_confirm')
        expect(mockConfirmSignupEmail).toHaveBeenCalledTimes(1)
        expect(mockConfirmSignupEmail).toHaveBeenCalledWith({
          variables: {
            input: { token: TOKEN, password: PASSWORD, captchaToken: RECAPTCHA_TOKEN },
          },
        })
      })

      it('THEN should log in with the session token', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await typePasswordAndConfirm(user)

        expect(mockOnLogIn).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })

    describe('WHEN this browser also holds a secret', () => {
      it('THEN should confirm with the password only and remove the secret on success', async () => {
        const user = userEvent.setup()

        setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, SIGNUP_SECRET)

        renderVerifyEmail()
        await typePasswordAndConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledWith({
          variables: {
            input: { token: TOKEN, password: PASSWORD, captchaToken: RECAPTCHA_TOKEN },
          },
        })
        expect(getStoredSecret()).toBeNull()
      })
    })

    describe('WHEN the confirmation answers incorrect_password after the verifying state', () => {
      const submitWrongPassword = async (user: UserEvent): Promise<void> => {
        const confirmation = deferred<ErrorAnswer>()

        mockConfirmSignupEmail.mockReturnValueOnce(confirmation.promise)

        await typePasswordAndConfirm(user)

        expect(getPage()).toHaveTextContent(VERIFYING_TITLE_COPY)
        expect(queryPasswordField()).not.toBeInTheDocument()

        await act(async () => {
          confirmation.resolve(buildPasswordError(LagoApiError.IncorrectPassword))
        })
        await flush()
      }

      it('THEN should show the wrong password message under the field without logging in', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await submitWrongPassword(user)

        expect(getPasswordFieldBlock()).toHaveTextContent(INCORRECT_PASSWORD_COPY)
        expect(getPasswordFieldBlock()).not.toHaveTextContent(PASSWORD_HELPER_COPY)
        expect(getPasswordInput()).toHaveValue(PASSWORD)
        expect(getConfirmButton()).toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })

      it('THEN should clear the wrong password message once the password is edited', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await submitWrongPassword(user)

        expect(getPasswordFieldBlock()).toHaveTextContent(INCORRECT_PASSWORD_COPY)

        await user.type(getPasswordInput(), '2')

        expect(getPasswordFieldBlock()).not.toHaveTextContent(INCORRECT_PASSWORD_COPY)
        expect(getPasswordFieldBlock()).toHaveTextContent(PASSWORD_HELPER_COPY)
      })

      it('THEN should confirm again with the edited password', async () => {
        const user = userEvent.setup()

        renderVerifyEmail()
        await submitWrongPassword(user)
        await user.type(getPasswordInput(), '2')
        await clickConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledTimes(2)
        expect(mockConfirmSignupEmail).toHaveBeenLastCalledWith({
          variables: {
            input: { token: TOKEN, password: `${PASSWORD}2`, captchaToken: RECAPTCHA_TOKEN },
          },
        })
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })
  })

  describe('GIVEN the confirmation returns a session token', () => {
    beforeEach(() => {
      setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, SIGNUP_SECRET)
    })

    describe('WHEN the log in sets no session', () => {
      beforeEach(() => {
        logInWithoutSession()
      })

      it.each(CONFIRM_PATHS)(
        'THEN should show the already verified state instead of the form on the $path path',
        async ({ passwordRequired, confirm, input }) => {
          const user = userEvent.setup()

          answerVerification(buildVerification({ passwordRequired }))

          renderVerifyEmail()
          await confirm(user)

          expect(mockConfirmSignupEmail).toHaveBeenCalledWith({ variables: { input } })
          expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
          expect(getPage()).toHaveTextContent(ALREADY_VERIFIED_TITLE_COPY)
          expect(getPage()).toHaveTextContent(ALREADY_VERIFIED_TEXT_COPY)
          expect(
            screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID),
          ).toHaveTextContent(CONTINUE_COPY)
          expect(queryConfirmButton()).not.toBeInTheDocument()
          expect(queryPasswordField()).not.toBeInTheDocument()
          expect(queryErrorAlert()).not.toBeInTheDocument()
          expect(getStoredSecret()).toBeNull()
        },
      )

      it('THEN should go to the login page when clicking continue to Lago', async () => {
        const user = userEvent.setup()

        answerVerification(buildVerification({ passwordRequired: false }))

        renderVerifyEmail()
        await clickConfirm(user)
        await user.click(screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID))

        expect(getRouteNavigations()).toEqual([[LOGIN_ROUTE]])
      })
    })

    describe('WHEN the log in sets the session', () => {
      beforeEach(() => {
        logInWithSession()
      })

      it.each(CONFIRM_PATHS)(
        'THEN should go home instead of the already verified state on the $path path',
        async ({ passwordRequired, confirm, input }) => {
          const user = userEvent.setup()

          answerVerification(buildVerification({ passwordRequired }))

          renderVerifyEmail()
          await confirm(user)

          expect(mockConfirmSignupEmail).toHaveBeenCalledWith({ variables: { input } })
          expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
          expect(getPage()).not.toHaveTextContent(ALREADY_VERIFIED_TITLE_COPY)
          expect(
            screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID),
          ).not.toBeInTheDocument()
          expect(getRouteNavigations()).toEqual([[HOME_ROUTE, { replace: true }]])
        },
      )
    })
  })

  describe('GIVEN the lock is busy', () => {
    describe('WHEN it is busy once on the secret path', () => {
      it('THEN should retry once with the same input and log in', async () => {
        const user = userEvent.setup()

        mockConfirmSignupEmail
          .mockResolvedValueOnce(buildError(LagoApiError.LockAcquisitionFailed))
          .mockResolvedValueOnce(CONFIRM_SUCCESS)

        renderVerifyEmail()
        await clickConfirm(user)

        const input = { token: TOKEN, signupSecret: SIGNUP_SECRET }

        expect(mockConfirmSignupEmail.mock.calls).toEqual([
          [{ variables: { input } }],
          [{ variables: { input } }],
        ])
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
        expect(queryErrorAlert()).not.toBeInTheDocument()
      })
    })

    describe('WHEN it is busy on the password path', () => {
      it('THEN should show the generic banner without retrying nor asking for a second token', async () => {
        const user = userEvent.setup()

        answerVerification(buildVerification({ passwordRequired: true }))
        mockConfirmSignupEmail.mockResolvedValue(buildError(LagoApiError.LockAcquisitionFailed))

        renderVerifyEmail()
        await typePasswordAndConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN it is still busy on the retry', () => {
      it('THEN should stop after one retry and show the generic banner', async () => {
        const user = userEvent.setup()

        mockConfirmSignupEmail.mockResolvedValue(buildError(LagoApiError.LockAcquisitionFailed))

        renderVerifyEmail()
        await clickConfirm(user)

        expect(mockConfirmSignupEmail).toHaveBeenCalledTimes(2)
        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the confirmation answers a link error', () => {
    describe('WHEN the code matches a link state', () => {
      it.each([
        [
          LagoApiError.SignupTokenExpired,
          EXPIRED_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
        ],
        [
          LagoApiError.SignupTokenReplaced,
          REPLACED_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
        ],
        [
          LagoApiError.SignupTokenLocked,
          LOCKED_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
        ],
        [
          LagoApiError.EmailAlreadyVerified,
          ALREADY_VERIFIED_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID,
        ],
        [
          LagoApiError.NotFound,
          INVALID_TITLE_COPY,
          SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID,
        ],
      ])('THEN should show the matching state on %s', async (code, title, actionTestId) => {
        const user = userEvent.setup()

        mockConfirmSignupEmail.mockResolvedValue(buildError(code))

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getPage()).toHaveTextContent(title)
        expect(screen.getByTestId(actionTestId)).toBeInTheDocument()
        expect(queryConfirmButton()).not.toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the confirmation answers an error shown in the banner', () => {
    describe('WHEN the code has its own message', () => {
      it.each([
        [LagoApiError.TooManyRequests, TOO_MANY_ATTEMPTS_COPY],
        [LagoApiError.CaptchaFailed, CAPTCHA_FAILED_COPY],
        [LagoApiError.SignupDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.SelfServeDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.InternalError, GENERIC_ERROR_COPY],
      ])('THEN should show the %s message and keep the form', async (code, copy) => {
        const user = userEvent.setup()

        mockConfirmSignupEmail.mockResolvedValue(buildError(code))

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getErrorAlert()).toHaveTextContent(copy)
        expect(getConfirmButton()).toBeInTheDocument()
        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
      })
    })

    describe('WHEN the error has no code', () => {
      it('THEN should show the generic banner', async () => {
        const user = userEvent.setup()

        mockConfirmSignupEmail.mockResolvedValue({ data: null, errors: [{ message: 'error' }] })

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show the generic banner and the form again', async () => {
        const user = userEvent.setup()

        mockConfirmSignupEmail.mockRejectedValue(new Error('Failed to fetch'))

        renderVerifyEmail()
        await clickConfirm(user)

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(getConfirmButton()).toBeInTheDocument()
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the link cannot be confirmed', () => {
    describe('WHEN the check answers a status', () => {
      it.each([
        {
          name: 'expired',
          status: SignupVerificationStatusEnum.Expired,
          copies: [EXPIRED_TITLE_COPY, EXPIRED_TEXT_COPY, SEND_NEW_LINK_COPY],
          shown: [SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID],
        },
        {
          name: 'replaced',
          status: SignupVerificationStatusEnum.Replaced,
          copies: [REPLACED_TITLE_COPY, REPLACED_TEXT_COPY, SEND_NEW_LINK_COPY],
          shown: [SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID],
        },
        {
          name: 'locked',
          status: SignupVerificationStatusEnum.Locked,
          copies: [LOCKED_TITLE_COPY, SEND_NEW_LINK_COPY],
          shown: [SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID],
        },
        {
          name: 'already_verified',
          status: SignupVerificationStatusEnum.AlreadyVerified,
          copies: [ALREADY_VERIFIED_TITLE_COPY, ALREADY_VERIFIED_TEXT_COPY, CONTINUE_COPY],
          shown: [SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID],
        },
        {
          name: 'invalid',
          status: SignupVerificationStatusEnum.Invalid,
          copies: [INVALID_TITLE_COPY, INVALID_TEXT_COPY, SEND_NEW_LINK_COPY, BACK_TO_SIGN_UP_COPY],
          shown: [
            SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
            SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID,
          ],
        },
      ])('THEN should show the $name copy and only its actions', ({ status, copies, shown }) => {
        answerStatus(status)

        renderVerifyEmail()

        copies.forEach((copy) => {
          expect(getPage()).toHaveTextContent(copy)
        })
        ACTION_TEST_IDS.forEach((testId) => {
          if (shown.includes(testId)) {
            expect(screen.getByTestId(testId)).toBeInTheDocument()
          } else {
            expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
          }
        })
        expect(queryPasswordField()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the link is invalid and no secret is stored', () => {
      it('THEN should only offer to go back to sign up', () => {
        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
        answerStatus(SignupVerificationStatusEnum.Invalid)

        renderVerifyEmail()

        expect(
          screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(querySendNewLinkButton()).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking continue to Lago', () => {
      it('THEN should go to the login page', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.AlreadyVerified)

        renderVerifyEmail()
        await user.click(screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID))

        expect(getRouteNavigations()).toEqual([[LOGIN_ROUTE]])
        expect(mockNavigate).not.toHaveBeenCalledWith(SIGN_UP_ROUTE)
      })
    })

    describe('WHEN clicking back to sign up', () => {
      it('THEN should go to the sign-up page', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Invalid)

        renderVerifyEmail()
        await user.click(screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID))

        expect(getRouteNavigations()).toEqual([[SIGN_UP_ROUTE]])
      })
    })
  })

  describe('GIVEN a new link can be sent from the link', () => {
    describe('WHEN clicking send a new link', () => {
      it.each([
        ['expired', SignupVerificationStatusEnum.Expired],
        ['replaced', SignupVerificationStatusEnum.Replaced],
        ['locked', SignupVerificationStatusEnum.Locked],
      ])(
        'THEN should resend with the token and a signup_resend captcha token when %s',
        async (_, status) => {
          const user = userEvent.setup()

          answerStatus(status)

          renderVerifyEmail()

          expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()

          await clickSendNewLink(user)

          expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
          expect(mockedGetRecaptchaToken).toHaveBeenCalledWith('signup_resend')
          expect(mockResendSignupEmail).toHaveBeenCalledTimes(1)
          expect(mockResendSignupEmail).toHaveBeenCalledWith({
            variables: { input: { token: TOKEN, captchaToken: RECAPTCHA_TOKEN } },
          })
        },
      )
    })

    describe('WHEN the link is invalid and a secret is stored', () => {
      it.each([
        ['the check answers invalid', `?token=${TOKEN}`],
        ['the link has no token', ''],
      ])('THEN should resend with the secret instead of the token when %s', async (_, search) => {
        const user = userEvent.setup()

        openLink(search)
        answerStatus(SignupVerificationStatusEnum.Invalid)

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(mockResendSignupEmail).toHaveBeenCalledWith({
          variables: { input: { signupSecret: SIGNUP_SECRET, captchaToken: RECAPTCHA_TOKEN } },
        })
      })
    })

    describe('WHEN the resend succeeds', () => {
      it('THEN should show the new link sent message', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getResendAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(getPage()).toHaveTextContent(EXPIRED_TITLE_COPY)
      })
    })

    describe('WHEN the resend sends the last link this sign-up allows', () => {
      it('THEN should show the limit message and stop offering a new link', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail.mockResolvedValue({
          data: { resendSignupEmail: { resendAvailableInSeconds: null, resendLimitReached: true } },
        })

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getResendAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID)).toHaveTextContent(
          RESEND_LIMIT_COPY,
        )
        expect(querySendNewLinkButton()).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking send a new link again while the captcha loads', () => {
      it('THEN should show the button as loading and send a single link', async () => {
        const user = userEvent.setup()
        const captcha = deferred<string | null>()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockedGetRecaptchaToken.mockReturnValueOnce(captcha.promise)

        renderVerifyEmail()
        await user.click(getSendNewLinkButton())

        expect(
          getSendNewLinkButton().querySelector('[data-test^="processing/"]'),
        ).toBeInTheDocument()

        await user.click(getSendNewLinkButton())
        await act(async () => {
          captcha.resolve(RECAPTCHA_TOKEN)
        })
        await flush()

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockResendSignupEmail).toHaveBeenCalledTimes(1)
        expect(getResendAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
      })
    })

    describe('WHEN the API answers resend_too_soon without a retry delay', () => {
      it('THEN should ask to wait without a number of seconds', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.ResendTooSoon))

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getResendAlert()).toHaveTextContent(TOO_MANY_ATTEMPTS_COPY)
        expect(getResendAlert()).not.toHaveTextContent('0 seconds')
      })
    })

    describe('WHEN the API answers resend_too_soon', () => {
      it('THEN should ask to wait the retry delay', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail.mockResolvedValue(
          buildError(LagoApiError.ResendTooSoon, { retryAfterSeconds: 30 }),
        )

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getResendAlert()).toHaveTextContent('Wait 30 seconds to resend a new email.')
        expect(queryErrorAlert()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the API answers resend_limit_reached', () => {
      it('THEN should show the limit message', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Replaced)
        mockResendSignupEmail.mockResolvedValue(
          buildError(LagoApiError.ResendLimitReached, { retryAfterSeconds: 3600 }),
        )

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getResendAlert()).toHaveTextContent(RESEND_LIMIT_COPY)
        expect(queryErrorAlert()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the token resend answers that the sign-up cannot send more links', () => {
      it.each([LagoApiError.SignupExpired, LagoApiError.SignupResendExhausted])(
        'THEN should show the sign-up expired state and keep the stored secret on %s',
        async (code) => {
          const user = userEvent.setup()

          answerStatus(SignupVerificationStatusEnum.Expired)
          mockResendSignupEmail.mockResolvedValue(buildError(code))

          renderVerifyEmail()
          await clickSendNewLink(user)

          expect(mockResendSignupEmail).toHaveBeenCalledWith({
            variables: { input: { token: TOKEN, captchaToken: RECAPTCHA_TOKEN } },
          })
          expect(getPage()).toHaveTextContent(SIGN_UP_EXPIRED_COPY)
          expect(getPage()).not.toHaveTextContent(EXPIRED_TITLE_COPY)
          expect(
            screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID),
          ).toBeInTheDocument()
          expect(querySendNewLinkButton()).not.toBeInTheDocument()
          expect(getStoredSecret()).toBe(SIGNUP_SECRET)
        },
      )
    })

    describe('WHEN the secret resend answers that the sign-up is gone', () => {
      it.each([
        ['remove', LagoApiError.NotFound, null],
        ['remove', LagoApiError.SignupExpired, null],
        ['keep', LagoApiError.SignupResendExhausted, SIGNUP_SECRET],
      ])(
        'THEN should %s the stored secret and only offer to go back to sign up on %s',
        async (_, code, expectedStoredSecret) => {
          const user = userEvent.setup()

          answerStatus(SignupVerificationStatusEnum.Invalid)
          mockResendSignupEmail.mockResolvedValue(buildError(code))

          renderVerifyEmail()
          await clickSendNewLink(user)

          expect(mockResendSignupEmail).toHaveBeenCalledWith({
            variables: { input: { signupSecret: SIGNUP_SECRET, captchaToken: RECAPTCHA_TOKEN } },
          })
          expect(getStoredSecret()).toBe(expectedStoredSecret)
          expect(getPage()).toHaveTextContent(SIGN_UP_EXPIRED_COPY)
          expect(getPage()).not.toHaveTextContent(INVALID_TITLE_COPY)
          expect(
            screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID),
          ).toBeInTheDocument()
          expect(querySendNewLinkButton()).not.toBeInTheDocument()
        },
      )
    })

    describe('WHEN the API answers email_already_verified', () => {
      it('THEN should show the already verified state', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Replaced)
        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.EmailAlreadyVerified))

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getPage()).toHaveTextContent(ALREADY_VERIFIED_TITLE_COPY)
        expect(
          screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(querySendNewLinkButton()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the token resend answers not_found', () => {
      it('THEN should show the invalid link state and keep the stored secret', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Locked)
        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.NotFound))

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(mockResendSignupEmail).toHaveBeenCalledWith({
          variables: { input: { token: TOKEN, captchaToken: RECAPTCHA_TOKEN } },
        })
        expect(getPage()).toHaveTextContent(INVALID_TITLE_COPY)
        expect(getPage()).not.toHaveTextContent(SIGN_UP_EXPIRED_COPY)
        expect(
          screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
      })

      it('THEN should only offer to go back to sign up when no secret is stored', async () => {
        const user = userEvent.setup()

        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
        answerStatus(SignupVerificationStatusEnum.Locked)
        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.NotFound))

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getPage()).toHaveTextContent(INVALID_TITLE_COPY)
        expect(
          screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(querySendNewLinkButton()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the error is shown in the banner', () => {
      it.each([
        [LagoApiError.TooManyRequests, TOO_MANY_ATTEMPTS_COPY],
        [LagoApiError.CaptchaFailed, CAPTCHA_FAILED_COPY],
        [LagoApiError.SignupDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.SelfServeDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.InternalError, GENERIC_ERROR_COPY],
        [LagoApiError.UnprocessableEntity, GENERIC_ERROR_COPY],
      ])('THEN should show the %s message', async (code, copy) => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail.mockResolvedValue(buildError(code))

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getErrorAlert()).toHaveTextContent(copy)
        expect(queryResendAlert()).not.toBeInTheDocument()
        expect(getSendNewLinkButton()).toBeInTheDocument()
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show the generic banner', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail.mockRejectedValue(new Error('Failed to fetch'))

        renderVerifyEmail()
        await clickSendNewLink(user)

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(queryResendAlert()).not.toBeInTheDocument()
      })
    })

    describe('WHEN resending after an error', () => {
      it('THEN should replace the error banner with the new link sent message', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail
          .mockResolvedValueOnce(buildError(LagoApiError.CaptchaFailed))
          .mockResolvedValueOnce(RESEND_SUCCESS)

        renderVerifyEmail()
        await clickSendNewLink(user)
        await clickSendNewLink(user)

        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(getResendAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
      })
    })

    describe('WHEN resending fails after a success', () => {
      it('THEN should replace the new link sent message with the error banner', async () => {
        const user = userEvent.setup()

        answerStatus(SignupVerificationStatusEnum.Expired)
        mockResendSignupEmail
          .mockResolvedValueOnce(RESEND_SUCCESS)
          .mockResolvedValueOnce(buildError(LagoApiError.CaptchaFailed))

        renderVerifyEmail()
        await clickSendNewLink(user)
        await clickSendNewLink(user)

        expect(queryResendAlert()).not.toBeInTheDocument()
        expect(getErrorAlert()).toHaveTextContent(CAPTCHA_FAILED_COPY)
      })
    })
  })

  describe('GIVEN a reCAPTCHA site key is configured', () => {
    beforeEach(() => {
      mockRecaptchaSiteKey(RECAPTCHA_SITE_KEY)
    })

    describe('WHEN a captcha-protected button is shown', () => {
      it.each([
        [
          'the password is asked',
          (): void => answerVerification(buildVerification({ passwordRequired: true })),
          SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
        ],
        [
          'a new link can be sent',
          (): void => answerStatus(SignupVerificationStatusEnum.Expired),
          SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
        ],
      ])('THEN should display the reCAPTCHA notice under it when %s', (_, answer, testId) => {
        answer()

        renderVerifyEmail()

        const notice = screen.getByText(RECAPTCHA_NOTICE_START)

        expect(notice).toHaveTextContent(RECAPTCHA_NOTICE_COPY)
        expect(
          screen.getByTestId(testId).compareDocumentPosition(notice) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(getLinksTo(GOOGLE_PRIVACY_POLICY_URL)).toHaveLength(1)
        expect(getLinksTo(GOOGLE_TERMS_URL)).toHaveLength(1)
      })
    })

    describe('WHEN no captcha-protected button is shown', () => {
      it.each([
        ['the secret confirms the email', (): void => answerVerification(buildVerification())],
        [
          'the email is already verified',
          (): void => answerStatus(SignupVerificationStatusEnum.AlreadyVerified),
        ],
        [
          'the link is invalid without a stored secret',
          (): void => {
            removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
            answerStatus(SignupVerificationStatusEnum.Invalid)
          },
        ],
      ])('THEN should not display the reCAPTCHA notice when %s', (_, answer) => {
        answer()

        renderVerifyEmail()

        expect(screen.queryByText(RECAPTCHA_NOTICE_START)).not.toBeInTheDocument()
        expect(getLinksTo(GOOGLE_PRIVACY_POLICY_URL)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN no reCAPTCHA site key is configured', () => {
    describe('WHEN a captcha-protected button is shown', () => {
      it.each([
        [
          'the password is asked',
          (): void => answerVerification(buildVerification({ passwordRequired: true })),
          SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
        ],
        [
          'a new link can be sent',
          (): void => answerStatus(SignupVerificationStatusEnum.Expired),
          SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
        ],
      ])('THEN should not display the reCAPTCHA notice when %s', (_, answer, testId) => {
        answer()

        renderVerifyEmail()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
        expect(screen.queryByText(RECAPTCHA_NOTICE_START)).not.toBeInTheDocument()
        expect(getLinksTo(GOOGLE_PRIVACY_POLICY_URL)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN this browser is already logged in', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(true)
    })

    describe('WHEN the link can still be confirmed', () => {
      it('THEN should ask to log out instead of confirming', () => {
        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(LOGGED_IN_TITLE_COPY)
        expect(getPage()).toHaveTextContent(LOGGED_IN_TEXT_COPY)
        expect(
          screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(queryConfirmButton()).not.toBeInTheDocument()
        expect(querySendNewLinkButton()).not.toBeInTheDocument()
      })

      it('THEN should not send the browser to another page', () => {
        renderVerifyEmail()

        expect(getRouteNavigations()).toEqual([])
      })
    })

    describe('WHEN the link cannot be confirmed', () => {
      it.each([
        [SignupVerificationStatusEnum.AlreadyVerified, ALREADY_VERIFIED_TITLE_COPY],
        [SignupVerificationStatusEnum.Expired, EXPIRED_TITLE_COPY],
        [SignupVerificationStatusEnum.Replaced, REPLACED_TITLE_COPY],
        [SignupVerificationStatusEnum.Locked, LOCKED_TITLE_COPY],
        [SignupVerificationStatusEnum.Invalid, INVALID_TITLE_COPY],
      ])('THEN should show the %s state without asking to log out', (status, title) => {
        answerStatus(status)

        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(title)
        expect(getPage()).not.toHaveTextContent(LOGGED_IN_TITLE_COPY)
        expect(
          screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should show the invalid state without asking to log out when the link has no token', () => {
        openLink('')

        renderVerifyEmail()

        expect(getPage()).toHaveTextContent(INVALID_TITLE_COPY)
        expect(
          screen.queryByTestId(SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should still offer a new link, which does not log in', () => {
        answerStatus(SignupVerificationStatusEnum.Expired)

        renderVerifyEmail()

        expect(getSendNewLinkButton()).toBeInTheDocument()
      })
    })

    describe('WHEN clicking log out', () => {
      it('THEN should log out, check the link again and offer to confirm it', async () => {
        const user = userEvent.setup()

        mockLogOut.mockImplementation(async () => {
          mockIsAuthenticated.mockReturnValue(false)
        })

        renderVerifyEmail()
        await user.click(screen.getByTestId(SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID))
        await flush()

        expect(mockLogOut).toHaveBeenCalledWith(mockClient, true)
        expect(mockRefetch).toHaveBeenCalledTimes(1)
        expect(getConfirmButton()).toBeInTheDocument()
      })
    })
  })
})
