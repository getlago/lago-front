import { act, screen, within } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'

import { envGlobalVar, initializeTranslations } from '~/core/apolloClient'
import { LOGIN_ROUTE } from '~/core/router'
import { removeItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import {
  ExchangeSignupSecretDocument,
  ExchangeSignupSecretMutation,
  LagoApiError,
  ResendSignupEmailMutation,
  SignupStatusDocument,
  SignupStatusEnum,
  SignupStatusQuery,
  SignupStatusQueryVariables,
} from '~/generated/graphql'
import * as RecaptchaNoticeModule from '~/pages/auth/common/RecaptchaNotice'
import {
  SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID,
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_MAILBOX_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID,
} from '~/pages/auth/signUpTestIds'
import { render } from '~/test-utils'

import { SelfServeCheckEmail } from '../SelfServeCheckEmail'

type SignupStatus = SignupStatusQuery['signupStatus']
type ResendState = Pick<SignupStatus, 'resendAvailableInSeconds' | 'resendLimitReached'>
type StatusCheckOptions = { variables: SignupStatusQueryVariables }
type ResendAnswer = NonNullable<ResendSignupEmailMutation['resendSignupEmail']>
type ErrorAnswer = { data: null; errors: GraphQLFormattedError[] }
type EnvGlobal = ReturnType<typeof envGlobalVar>

const mockQuery = jest.fn()
const mockMutate = jest.fn()
const mockClient = { query: mockQuery, mutate: mockMutate }
const mockResendSignupEmail = jest.fn()
const mockUseResendSignupEmailMutation = jest.fn()
const mockOnLogIn = jest.fn()
const mockNavigate = jest.fn()
const mockAuthTokenVar = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockClient,
}))

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  return {
    ...actual,
    envGlobalVar: jest.fn(actual.envGlobalVar),
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

jest.mock('~/core/utils/recaptcha', () => ({
  getRecaptchaToken: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useResendSignupEmailMutation: (...args: unknown[]) => mockUseResendSignupEmailMutation(...args),
}))

const mockedGetRecaptchaToken = jest.mocked(getRecaptchaToken)
const mockedEnvGlobalVar = jest.mocked(envGlobalVar)

const EMAIL = 'raffi@hooli.com'
const SIGNUP_SECRET = 'signup-secret-1'
const OTHER_SIGNUP_SECRET = 'signup-secret-2'
const SESSION_TOKEN = 'session-token-1'
const RECAPTCHA_TOKEN = 'recaptcha-token-1'
const EMAIL_NOT_VERIFIED = 'email_not_verified'
const RECAPTCHA_SITE_KEY = 'recaptcha-site-key'
const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy'
const GOOGLE_TERMS_URL = 'https://policies.google.com/terms'

const POLL_INTERVAL_MS = 5_000
const RATE_LIMITED_POLL_INTERVAL_MS = 60_000

const TITLE_COPY = 'Check your email'
const SENT_TO_COPY = `We sent a verification link to ${EMAIL}. Click the link in the email to finish creating your account.`
const HELPER_COPY =
  "Can't find it? Check your spam or promotions folder. The link expires in 24 hours."
const RESEND_LINK_COPY = 'Resend link'
const NEW_LINK_SENT_COPY = `New link sent to ${EMAIL}. Only the latest link will work.`
const RESEND_LIMIT_COPY =
  "We've sent several links already. Check your spam folder or try again in an hour."
const MAILBOX_LIMIT_COPY =
  "We've already sent several emails to this address in the last hour. You can ask for a new link when the countdown ends."
const EXPIRED_COPY = 'This sign-up has expired'
const LOGIN_REQUIRED_COPY = 'Your email is confirmed. Please log in.'
const TOO_MANY_ATTEMPTS_COPY = 'Too many attempts. Please wait a few minutes and try again.'
const SIGN_UP_UNAVAILABLE_COPY = 'Sign-up is unavailable right now. Please reload the page.'
const CAPTCHA_FAILED_COPY = "We couldn't confirm you're human. Please try again."
const GENERIC_ERROR_COPY = 'Something went wrong on our side. Please try again.'
const RECAPTCHA_NOTICE_COPY =
  'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.'
const RECAPTCHA_NOTICE_START = /^This site is protected by reCAPTCHA/

const buildStatus = (signupStatus: Partial<SignupStatus> = {}): { data: SignupStatusQuery } => ({
  data: { signupStatus: { status: SignupStatusEnum.Pending, ...signupStatus } },
})

const buildError = (code: string, details?: Record<string, unknown>): ErrorAnswer => ({
  data: null,
  errors: [{ message: 'error', extensions: { code, ...(details && { details }) } }],
})

const buildResendAnswer = (
  answer: Partial<ResendAnswer> = {},
): { data: ResendSignupEmailMutation } => ({
  data: {
    resendSignupEmail: { resendAvailableInSeconds: 60, resendLimitReached: false, ...answer },
  },
})

const EXCHANGE_SUCCESS: { data: ExchangeSignupSecretMutation } = {
  data: { exchangeSignupSecret: { token: SESSION_TOKEN } },
}

const answerPendingStatus = ({
  resendAvailableInSeconds = 0,
  resendLimitReached = false,
}: Partial<ResendState> = {}): void => {
  const resendAvailableAt =
    typeof resendAvailableInSeconds === 'number'
      ? Date.now() + resendAvailableInSeconds * 1000
      : null

  const getResendState = (): ResendState => ({
    resendAvailableInSeconds:
      resendAvailableAt === null
        ? null
        : Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)),
    resendLimitReached,
  })

  mockQuery.mockImplementation(async ({ variables }: StatusCheckOptions) =>
    buildStatus(variables.withResendState ? getResendState() : {}),
  )
}

const logInWithSession = (): void => {
  mockOnLogIn.mockImplementation(async (_client: unknown, token: string) => {
    mockAuthTokenVar.mockReturnValue(token)
  })
}

const getStatusCheckVariables = (): SignupStatusQueryVariables[] =>
  mockQuery.mock.calls.map(([options]: [StatusCheckOptions]) => options.variables)

const getWithResendStates = (): boolean[] =>
  getStatusCheckVariables().map(({ withResendState }) => withResendState)

const answerResendAndUpdateStatus = (answer: Partial<ResendAnswer> = {}): void => {
  mockResendSignupEmail.mockImplementation(async () => {
    const result = buildResendAnswer(answer)

    answerPendingStatus(result.data.resendSignupEmail ?? {})

    return result
  })
}

const deferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms)
  })
}

const flush = async (): Promise<void> => advance(0)

const mockOnGoBack = jest.fn()
const mockOnStartAgain = jest.fn()

const renderCheckEmail = async (): Promise<ReturnType<typeof render>> => {
  const result = render(
    <SelfServeCheckEmail
      email={EMAIL}
      signupSecret={SIGNUP_SECRET}
      onGoBack={mockOnGoBack}
      onStartAgain={mockOnStartAgain}
    />,
  )

  await flush()

  return result
}

const setupUser = (): UserEvent => userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

const getCheckEmail = (): HTMLElement => screen.getByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)

const getResendButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID)

const getResendSuccessAlert = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID)

const getResendLimitAlert = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID)

const getErrorAlert = (): HTMLElement => screen.getByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)

const queryResendButton = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID)

const queryLoginButton = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID)

const queryResendSuccessAlert = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID)

const queryResendLimitAlert = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID)

const getMailboxLimitAlert = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_SIGNUP_MAILBOX_LIMIT_ALERT_TEST_ID)

const queryMailboxLimitAlert = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_MAILBOX_LIMIT_ALERT_TEST_ID)

const queryErrorAlert = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)

const isResendLoading = (): boolean =>
  !!getResendButton().querySelector('[data-test^="processing/"]')

const clickResend = async (user: UserEvent): Promise<void> => {
  await user.click(getResendButton())
  await flush()
}

const getRealEnv = (): EnvGlobal =>
  jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient').envGlobalVar()

const mockRecaptchaSiteKey = (recaptchaSiteKey: EnvGlobal['recaptchaSiteKey']): void => {
  mockedEnvGlobalVar.mockReturnValue({ ...getRealEnv(), recaptchaSiteKey })
}

const getLinksTo = (href: string): HTMLElement[] =>
  screen.queryAllByRole('link').filter((link) => link.getAttribute('href') === href)

const getStoredSecret = (): string | null => localStorage.getItem(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

const setTabVisibility = (visibility: DocumentVisibilityState): void => {
  jest.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility)
}

describe('SelfServeCheckEmail', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, SIGNUP_SECRET)
    setTabVisibility('visible')
    mockUseResendSignupEmailMutation.mockReturnValue([mockResendSignupEmail, { loading: false }])
    mockedGetRecaptchaToken.mockResolvedValue(RECAPTCHA_TOKEN)
    mockOnLogIn.mockResolvedValue(undefined)
    mockAuthTokenVar.mockReturnValue('')
    mockRecaptchaSiteKey('')
    answerPendingStatus()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
    removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
  })

  describe('GIVEN the screen is shown', () => {
    describe('WHEN it renders', () => {
      it.each([
        ['title', TITLE_COPY],
        ['text with the address', SENT_TO_COPY],
        ['spam and expiry helper', HELPER_COPY],
      ])('THEN should display the %s', async (_, copy) => {
        await renderCheckEmail()

        expect(getCheckEmail()).toHaveTextContent(copy)
      })

      it('THEN should show the address in bold', async () => {
        await renderCheckEmail()

        expect(within(getCheckEmail()).getByText(EMAIL).tagName).toBe('B')
      })

      it('THEN should not display any banner', async () => {
        await renderCheckEmail()

        expect(queryResendSuccessAlert()).not.toBeInTheDocument()
        expect(queryResendLimitAlert()).not.toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
      })

      it('THEN should silence the error toasts of the resend mutation', async () => {
        await renderCheckEmail()

        expect(mockUseResendSignupEmailMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
      })
    })

    describe('WHEN clicking go back', () => {
      it('THEN should go back without starting again', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await user.click(screen.getByTestId(SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID))

        expect(mockOnGoBack).toHaveBeenCalledTimes(1)
        expect(mockOnStartAgain).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the sign-up status is polled', () => {
    describe('WHEN the screen is shown', () => {
      it('THEN should check the status and the resend state at once, without cache nor toast', async () => {
        await renderCheckEmail()

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenCalledWith({
          query: SignupStatusDocument,
          variables: { signupSecret: SIGNUP_SECRET, withResendState: true },
          fetchPolicy: 'no-cache',
          context: { silentError: true },
          errorPolicy: 'all',
        })
      })
    })

    describe('WHEN the status is checked again', () => {
      it('THEN should ask for the status only', async () => {
        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)
        await advance(POLL_INTERVAL_MS)

        expect(getStatusCheckVariables()).toEqual([
          { signupSecret: SIGNUP_SECRET, withResendState: true },
          { signupSecret: SIGNUP_SECRET, withResendState: false },
          { signupSecret: SIGNUP_SECRET, withResendState: false },
        ])
      })
    })

    describe('WHEN the first status check gets no pending answer', () => {
      const failures: [string, () => void, number][] = [
        [
          'fails on the network',
          (): void => {
            mockQuery.mockRejectedValueOnce(new Error('Failed to fetch'))
          },
          POLL_INTERVAL_MS,
        ],
        [
          'answers an error',
          (): void => {
            mockQuery.mockResolvedValueOnce(buildError(LagoApiError.InternalError))
          },
          POLL_INTERVAL_MS,
        ],
        [
          'answers too_many_requests',
          (): void => {
            mockQuery.mockResolvedValueOnce(buildError(LagoApiError.TooManyRequests))
          },
          RATE_LIMITED_POLL_INTERVAL_MS,
        ],
      ]

      it.each(failures)(
        'THEN should ask for the resend state again on the next check when it %s',
        async (_, failFirstCheck, retryDelay) => {
          failFirstCheck()

          await renderCheckEmail()
          await advance(retryDelay)
          await advance(POLL_INTERVAL_MS)

          expect(getWithResendStates()).toEqual([true, true, false])
        },
      )

      it.each(failures)(
        'THEN should show the resend button as loading until the next answer when it %s',
        async (_, failFirstCheck, retryDelay) => {
          failFirstCheck()

          await renderCheckEmail()

          expect(isResendLoading()).toBe(true)

          await advance(retryDelay)

          expect(isResendLoading()).toBe(false)
          expect(getResendButton()).toBeEnabled()
          expect(getResendButton()).toHaveTextContent(RESEND_LINK_COPY)
        },
      )
    })

    describe('WHEN the tab stays visible', () => {
      it('THEN should check the status again every 5 seconds', async () => {
        await renderCheckEmail()

        await advance(POLL_INTERVAL_MS - 1)
        expect(mockQuery).toHaveBeenCalledTimes(1)

        await advance(1)
        expect(mockQuery).toHaveBeenCalledTimes(2)

        await advance(POLL_INTERVAL_MS)
        expect(mockQuery).toHaveBeenCalledTimes(3)
      })
    })

    describe('WHEN the tab is hidden', () => {
      it('THEN should not check the status until the tab is visible again', async () => {
        setTabVisibility('hidden')

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS * 3)

        expect(mockQuery).not.toHaveBeenCalled()

        setTabVisibility('visible')
        await advance(POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the status check answers too_many_requests', () => {
      it('THEN should wait 60 seconds before the next check', async () => {
        mockQuery.mockResolvedValueOnce(buildError(LagoApiError.TooManyRequests))

        await renderCheckEmail()

        await advance(RATE_LIMITED_POLL_INTERVAL_MS - 1)
        expect(mockQuery).toHaveBeenCalledTimes(1)

        await advance(1)
        expect(mockQuery).toHaveBeenCalledTimes(2)
      })
    })

    describe('WHEN the status check answers another error', () => {
      it('THEN should check again 5 seconds later', async () => {
        mockQuery.mockResolvedValueOnce(buildError(LagoApiError.InternalError))

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(2)
      })
    })

    describe('WHEN the first status check fails on the network', () => {
      it('THEN should check again 5 seconds later', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Failed to fetch'))

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(2)
      })
    })

    describe('WHEN a later status check fails on the network', () => {
      it('THEN should keep checking every 5 seconds', async () => {
        await renderCheckEmail()

        mockQuery.mockRejectedValueOnce(new Error('Failed to fetch'))
        await advance(POLL_INTERVAL_MS)
        await advance(POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(3)
      })
    })

    describe('WHEN the screen unmounts', () => {
      it('THEN should stop checking the status', async () => {
        const { unmount } = await renderCheckEmail()

        unmount()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
      })

      it('THEN should leave no polling nor countdown timer running', async () => {
        answerPendingStatus({ resendAvailableInSeconds: 45 })

        const { unmount } = await renderCheckEmail()

        expect(jest.getTimerCount()).toBeGreaterThan(0)

        unmount()

        expect(jest.getTimerCount()).toBe(0)
      })
    })

    describe('WHEN the screen unmounts while a status check is in flight', () => {
      it('THEN should ignore the answer', async () => {
        const statusCheck = deferred<ReturnType<typeof buildStatus>>()

        mockQuery.mockReturnValueOnce(statusCheck.promise)

        const { unmount } = await renderCheckEmail()

        unmount()

        await act(async () => {
          statusCheck.resolve(buildStatus({ status: SignupStatusEnum.Verified }))
        })
        await advance(POLL_INTERVAL_MS)

        expect(mockMutate).not.toHaveBeenCalled()
        expect(mockQuery).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the email is verified', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Verified }))
    })

    describe('WHEN the exchange returns a session token and the log in sets the session', () => {
      beforeEach(() => {
        mockMutate.mockResolvedValue(EXCHANGE_SUCCESS)
        logInWithSession()
      })

      it('THEN should exchange the secret once, without toast', async () => {
        await renderCheckEmail()

        expect(mockMutate).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledWith({
          mutation: ExchangeSignupSecretDocument,
          variables: { input: { signupSecret: SIGNUP_SECRET } },
          context: { silentError: true },
          errorPolicy: 'all',
        })
      })

      it('THEN should remove the stored secret and log in with the token', async () => {
        await renderCheckEmail()

        expect(getStoredSecret()).toBeNull()
        expect(mockOnLogIn).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
        expect(mockOnStartAgain).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('THEN should not ask to log in', async () => {
        await renderCheckEmail()

        expect(mockOnLogIn).toHaveBeenCalledTimes(1)
        expect(queryLoginButton()).not.toBeInTheDocument()
        expect(getCheckEmail()).not.toHaveTextContent(LOGIN_REQUIRED_COPY)
      })

      it('THEN should stop checking the status', async () => {
        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the exchange returns a session token but the log in sets no session', () => {
      beforeEach(() => {
        mockMutate.mockResolvedValue(EXCHANGE_SUCCESS)
        mockAuthTokenVar.mockReturnValue('')
      })

      it('THEN should ask to log in with a log in button instead of resend', async () => {
        await renderCheckEmail()

        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
        expect(getCheckEmail()).toHaveTextContent(LOGIN_REQUIRED_COPY)
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID)).toBeEnabled()
        expect(queryResendButton()).not.toBeInTheDocument()
      })

      it('THEN should stop checking the status', async () => {
        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the exchange answers an error the screen cannot recover from', () => {
      const answers: [string, ErrorAnswer][] = [
        [EMAIL_NOT_VERIFIED, buildError(EMAIL_NOT_VERIFIED)],
        [LagoApiError.SelfServeDisabled, buildError(LagoApiError.SelfServeDisabled)],
        ['an error without code', { data: null, errors: [{ message: 'error' }] }],
      ]

      it.each(answers)(
        'THEN should ask to log in with a log in button instead of resend on %s',
        async (_, answer) => {
          mockMutate.mockResolvedValue(answer)

          await renderCheckEmail()

          expect(getCheckEmail()).toHaveTextContent(LOGIN_REQUIRED_COPY)
          expect(screen.getByTestId(SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID)).toBeEnabled()
          expect(queryResendButton()).not.toBeInTheDocument()
        },
      )

      it.each(answers)('THEN should stop checking the status on %s', async (_, answer) => {
        mockMutate.mockResolvedValue(answer)

        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockMutate).toHaveBeenCalledTimes(1)
      })

      it.each(answers)(
        'THEN should keep the secret without logging in nor starting again on %s',
        async (_, answer) => {
          mockMutate.mockResolvedValue(answer)

          await renderCheckEmail()

          expect(getStoredSecret()).toBe(SIGNUP_SECRET)
          expect(mockOnLogIn).not.toHaveBeenCalled()
          expect(mockOnStartAgain).not.toHaveBeenCalled()
        },
      )
    })

    describe('WHEN the exchange answers lock_acquisition_failed', () => {
      beforeEach(() => {
        mockMutate.mockResolvedValue(buildError(LagoApiError.LockAcquisitionFailed))
      })

      it('THEN should keep waiting without logging in nor asking to log in', async () => {
        await renderCheckEmail()

        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(queryLoginButton()).not.toBeInTheDocument()
        expect(getResendButton()).toBeInTheDocument()
      })

      it('THEN should check the status again 5 seconds later', async () => {
        await renderCheckEmail()

        await advance(POLL_INTERVAL_MS - 1)
        expect(mockQuery).toHaveBeenCalledTimes(1)

        await advance(1)
        expect(mockQuery).toHaveBeenCalledTimes(2)
      })

      it('THEN should exchange the secret again when a later check finds it verified', async () => {
        mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Verified }))
        mockMutate
          .mockResolvedValueOnce(buildError(LagoApiError.LockAcquisitionFailed))
          .mockResolvedValueOnce(EXCHANGE_SUCCESS)

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)

        expect(mockMutate).toHaveBeenCalledTimes(2)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })

    describe('WHEN the exchange fails on the network', () => {
      beforeEach(() => {
        mockMutate.mockRejectedValue(new Error('Failed to fetch'))
      })

      it('THEN should keep waiting without asking to log in', async () => {
        await renderCheckEmail()

        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(queryLoginButton()).not.toBeInTheDocument()
        expect(getResendButton()).toBeInTheDocument()
      })

      it('THEN should check the status again 5 seconds later', async () => {
        await renderCheckEmail()

        await advance(POLL_INTERVAL_MS - 1)
        expect(mockQuery).toHaveBeenCalledTimes(1)

        await advance(1)
        expect(mockQuery).toHaveBeenCalledTimes(2)
      })

      it('THEN should exchange the secret again when a later check finds it verified', async () => {
        mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Verified }))
        mockMutate
          .mockRejectedValueOnce(new Error('Failed to fetch'))
          .mockResolvedValueOnce(EXCHANGE_SUCCESS)

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)

        expect(mockMutate).toHaveBeenCalledTimes(2)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })

    describe('WHEN the exchange answers too_many_requests', () => {
      beforeEach(() => {
        mockMutate.mockResolvedValue(buildError(LagoApiError.TooManyRequests))
      })

      it('THEN should keep the secret without logging in nor starting again', async () => {
        await renderCheckEmail()

        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(mockOnStartAgain).not.toHaveBeenCalled()
      })

      it('THEN should wait 60 seconds before the next status check', async () => {
        await renderCheckEmail()

        await advance(RATE_LIMITED_POLL_INTERVAL_MS - 1)
        expect(mockQuery).toHaveBeenCalledTimes(1)

        await advance(1)
        expect(mockQuery).toHaveBeenCalledTimes(2)
      })
    })

    describe('WHEN the exchange answers signup_secret_expired', () => {
      beforeEach(() => {
        mockMutate.mockResolvedValue(buildError(LagoApiError.SignupSecretExpired))
      })

      it('THEN should remove the stored secret without logging in', async () => {
        await renderCheckEmail()

        expect(getStoredSecret()).toBeNull()
        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(mockOnStartAgain).not.toHaveBeenCalled()
      })

      it('THEN should ask to log in with a log in button instead of resend', async () => {
        await renderCheckEmail()

        expect(getCheckEmail()).toHaveTextContent(LOGIN_REQUIRED_COPY)
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID)).toBeEnabled()
        expect(
          screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('THEN should open the login page when clicking log in', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await user.click(screen.getByTestId(SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID))

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(LOGIN_ROUTE)
      })

      it('THEN should stop checking the status', async () => {
        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the exchange answers not_found', () => {
      beforeEach(() => {
        mockMutate.mockResolvedValue(buildError(LagoApiError.NotFound))
      })

      it('THEN should start again and stop checking the status', async () => {
        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockOnStartAgain).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the screen unmounts while the exchange is in flight', () => {
      it('THEN should still log in with the token, as the secret is spent', async () => {
        const exchange = deferred<typeof EXCHANGE_SUCCESS>()

        mockMutate.mockReturnValueOnce(exchange.promise)

        const { unmount } = await renderCheckEmail()

        unmount()

        await act(async () => {
          exchange.resolve(EXCHANGE_SUCCESS)
        })

        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
        expect(getStoredSecret()).toBeNull()
      })
    })

    describe('WHEN the screen unmounts while a failing exchange is in flight', () => {
      it('THEN should keep the stored secret', async () => {
        const exchange = deferred<ErrorAnswer>()

        mockMutate.mockReturnValueOnce(exchange.promise)

        const { unmount } = await renderCheckEmail()

        unmount()

        await act(async () => {
          exchange.resolve(buildError(LagoApiError.SignupSecretExpired))
        })

        expect(mockOnLogIn).not.toHaveBeenCalled()
        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
      })
    })
  })

  describe('GIVEN the email gets verified while a resend restarts the check', () => {
    const restartDuringExchange = async (): Promise<{
      resolve: (value: typeof EXCHANGE_SUCCESS) => void
    }> => {
      const user = setupUser()
      const firstExchange = deferred<typeof EXCHANGE_SUCCESS>()

      await renderCheckEmail()

      mockQuery.mockResolvedValue(buildStatus({ status: SignupStatusEnum.Verified }))
      mockMutate
        .mockReturnValueOnce(firstExchange.promise)
        .mockResolvedValue(buildError(LagoApiError.SignupSecretExpired))
      await advance(POLL_INTERVAL_MS)

      mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.EmailAlreadyVerified))
      await clickResend(user)

      return firstExchange
    }

    describe('WHEN the restarted check finds the email verified', () => {
      it('THEN should join the exchange in flight instead of spending the secret again', async () => {
        await restartDuringExchange()

        expect(mockQuery).toHaveBeenCalledTimes(3)
        expect(mockMutate).toHaveBeenCalledTimes(1)
        expect(getCheckEmail()).not.toHaveTextContent(LOGIN_REQUIRED_COPY)
      })
    })

    describe('WHEN the first exchange returns its token after the restart', () => {
      it('THEN should log in once with that token, without asking to log in', async () => {
        logInWithSession()

        const firstExchange = await restartDuringExchange()

        await act(async () => {
          firstExchange.resolve(EXCHANGE_SUCCESS)
        })

        expect(mockOnLogIn).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
        expect(getStoredSecret()).toBeNull()
        expect(queryLoginButton()).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the sign-up has expired', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Expired }))
    })

    describe('WHEN the status is received', () => {
      it('THEN should remove the stored secret', async () => {
        await renderCheckEmail()

        expect(getStoredSecret()).toBeNull()
      })

      it('THEN should show the expired message with start again instead of resend', async () => {
        await renderCheckEmail()

        expect(getCheckEmail()).toHaveTextContent(EXPIRED_COPY)
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should stop checking the status', async () => {
        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN clicking start again', () => {
      it('THEN should start again', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await user.click(screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID))

        expect(mockOnStartAgain).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the sign-up is invalid', () => {
    describe('WHEN the status is received', () => {
      it('THEN should start again and stop checking the status', async () => {
        mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Invalid }))

        await renderCheckEmail()
        await advance(RATE_LIMITED_POLL_INTERVAL_MS)

        expect(mockOnStartAgain).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the resend state comes from the status', () => {
    describe('WHEN no status has been received yet', () => {
      it('THEN should show the resend button as loading and ignore clicks', async () => {
        const user = setupUser()

        mockQuery.mockReturnValue(new Promise(() => undefined))

        await renderCheckEmail()

        expect(isResendLoading()).toBe(true)

        await clickResend(user)

        expect(mockResendSignupEmail).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a resend is available now', () => {
      it('THEN should enable the resend link button', async () => {
        answerPendingStatus({ resendAvailableInSeconds: 0 })

        await renderCheckEmail()

        expect(getResendButton()).toBeEnabled()
        expect(getResendButton()).toHaveTextContent(RESEND_LINK_COPY)
      })
    })

    describe('WHEN a resend is available later', () => {
      it.each([
        [65, 'Resend in 1:05'],
        [45, 'Resend in 0:45'],
        [9, 'Resend in 0:09'],
      ])(
        'THEN should disable the button for %i seconds showing "%s"',
        async (seconds, expectedLabel) => {
          answerPendingStatus({ resendAvailableInSeconds: seconds })

          await renderCheckEmail()

          expect(getResendButton()).toBeDisabled()
          expect(getResendButton()).toHaveTextContent(expectedLabel)
        },
      )

      it('THEN should count down every second', async () => {
        answerPendingStatus({ resendAvailableInSeconds: 45 })

        await renderCheckEmail()

        await advance(1_000)
        expect(getResendButton()).toHaveTextContent('Resend in 0:44')

        await advance(1_000)
        expect(getResendButton()).toHaveTextContent('Resend in 0:43')
      })

      it('THEN should re-render only the countdown label every second', async () => {
        const renderRecaptchaNotice = jest.spyOn(RecaptchaNoticeModule, 'RecaptchaNotice')

        answerPendingStatus({ resendAvailableInSeconds: 45 })

        await renderCheckEmail()

        const rendersBeforeTicks = renderRecaptchaNotice.mock.calls.length

        await advance(10_000)

        expect(getResendButton()).toHaveTextContent('Resend in 0:35')
        expect(renderRecaptchaNotice).toHaveBeenCalledTimes(rendersBeforeTicks)
      })

      it('THEN should enable the resend link button once the countdown ends', async () => {
        answerPendingStatus({ resendAvailableInSeconds: 45 })

        await renderCheckEmail()

        await advance(44_000)
        expect(getResendButton()).toBeDisabled()

        await advance(1_000)
        expect(getResendButton()).toBeEnabled()
        expect(getResendButton()).toHaveTextContent(RESEND_LINK_COPY)
      })
    })

    describe('WHEN later checks answer the status only', () => {
      it('THEN should keep counting down from the first answer', async () => {
        answerPendingStatus({ resendAvailableInSeconds: 45 })

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS * 2)

        expect(mockQuery).toHaveBeenCalledTimes(3)
        expect(getResendButton()).toBeDisabled()
        expect(getResendButton()).toHaveTextContent('Resend in 0:35')
      })

      it('THEN should keep the limit banner from the first answer', async () => {
        answerPendingStatus({ resendAvailableInSeconds: null, resendLimitReached: true })

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)

        expect(mockQuery).toHaveBeenCalledTimes(2)
        expect(getResendLimitAlert()).toHaveTextContent(RESEND_LIMIT_COPY)
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the sign-up cannot send more links', () => {
      beforeEach(() => {
        answerPendingStatus({ resendAvailableInSeconds: null })
      })

      it('THEN should hide the resend button and offer to start again', async () => {
        await renderCheckEmail()

        expect(
          screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should start again when clicking start again', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await user.click(screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID))

        expect(mockOnStartAgain).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the wait is longer than the minute rule', () => {
      it.each([
        [60, false],
        [61, true],
      ])('THEN for %i seconds should show the address limit banner: %s', async (seconds, shown) => {
        answerPendingStatus({ resendAvailableInSeconds: seconds })

        await renderCheckEmail()

        expect(!!queryMailboxLimitAlert()).toBe(shown)
        expect(queryResendLimitAlert()).not.toBeInTheDocument()
        expect(getResendButton()).toBeDisabled()
      })

      it('THEN should drop the address limit banner when the countdown ends', async () => {
        answerPendingStatus({ resendAvailableInSeconds: 61 })

        await renderCheckEmail()

        expect(getMailboxLimitAlert()).toHaveTextContent(MAILBOX_LIMIT_COPY)

        await advance(61_000)

        expect(queryMailboxLimitAlert()).not.toBeInTheDocument()
        expect(getResendButton()).toBeEnabled()
      })
    })

    describe('WHEN the resend limit is reached', () => {
      it('THEN should show the limit banner and offer to start again instead of resend', async () => {
        answerPendingStatus({ resendAvailableInSeconds: null, resendLimitReached: true })

        await renderCheckEmail()

        expect(queryMailboxLimitAlert()).not.toBeInTheDocument()
        expect(getResendLimitAlert()).toHaveTextContent(RESEND_LIMIT_COPY)
        expect(queryResendButton()).not.toBeInTheDocument()
        expect(screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a reCAPTCHA site key is configured', () => {
    beforeEach(() => {
      mockRecaptchaSiteKey(RECAPTCHA_SITE_KEY)
    })

    describe('WHEN the resend button is shown', () => {
      it.each([
        ['a resend is available now', { resendAvailableInSeconds: 0, resendLimitReached: false }],
        ['the countdown runs', { resendAvailableInSeconds: 45, resendLimitReached: false }],
        ['the limit is reached', { resendAvailableInSeconds: 0, resendLimitReached: true }],
      ])('THEN should display the reCAPTCHA notice under it when %s', async (_, status) => {
        answerPendingStatus(status)

        await renderCheckEmail()

        const notice = screen.getByText(RECAPTCHA_NOTICE_START)

        expect(notice).toHaveTextContent(RECAPTCHA_NOTICE_COPY)
        expect(
          getResendButton().compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      })

      it.each([
        ['privacy policy', GOOGLE_PRIVACY_POLICY_URL],
        ['terms of service', GOOGLE_TERMS_URL],
      ])('THEN should link the notice to the Google %s in a new tab', async (_, url) => {
        await renderCheckEmail()

        const links = getLinksTo(url)

        expect(links).toHaveLength(1)
        expect(links[0]).toHaveAttribute('target', '_blank')
        expect(screen.getByText(RECAPTCHA_NOTICE_START)).toContainElement(links[0])
      })
    })

    describe('WHEN the resend button is not shown', () => {
      it.each([
        [
          'the sign-up cannot send more links',
          (): void => answerPendingStatus({ resendAvailableInSeconds: null }),
        ],
        [
          'the sign-up has expired',
          (): void => {
            mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Expired }))
          },
        ],
        [
          'a log in is required',
          (): void => {
            mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Verified }))
            mockMutate.mockResolvedValue(buildError(LagoApiError.SignupSecretExpired))
          },
        ],
      ])('THEN should not display the reCAPTCHA notice when %s', async (_, answerStatus) => {
        answerStatus()

        await renderCheckEmail()

        expect(
          screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByText(RECAPTCHA_NOTICE_START)).not.toBeInTheDocument()
        expect(getLinksTo(GOOGLE_PRIVACY_POLICY_URL)).toHaveLength(0)
        expect(getLinksTo(GOOGLE_TERMS_URL)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN no reCAPTCHA site key is configured', () => {
    describe('WHEN the resend button is shown', () => {
      it('THEN should not display the reCAPTCHA notice nor its links', async () => {
        mockRecaptchaSiteKey('')

        await renderCheckEmail()

        expect(getResendButton()).toBeInTheDocument()
        expect(screen.queryByText(RECAPTCHA_NOTICE_START)).not.toBeInTheDocument()
        expect(getLinksTo(GOOGLE_PRIVACY_POLICY_URL)).toHaveLength(0)
        expect(getLinksTo(GOOGLE_TERMS_URL)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN Step 1 passes the secret', () => {
    const storedSecrets: [string, () => void][] = [
      ['is empty', (): void => removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)],
      [
        'holds another secret',
        (): void => setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, OTHER_SIGNUP_SECRET),
      ],
    ]

    describe('WHEN the status is checked', () => {
      it.each(storedSecrets)(
        'THEN should send the secret from Step 1 when the local storage %s',
        async (_, setStoredSecret) => {
          setStoredSecret()

          await renderCheckEmail()
          await advance(POLL_INTERVAL_MS)

          expect(getStatusCheckVariables().map(({ signupSecret }) => signupSecret)).toEqual([
            SIGNUP_SECRET,
            SIGNUP_SECRET,
          ])
        },
      )
    })

    describe('WHEN the email is verified', () => {
      it.each(storedSecrets)(
        'THEN should exchange the secret from Step 1 when the local storage %s',
        async (_, setStoredSecret) => {
          setStoredSecret()
          mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Verified }))
          mockMutate.mockResolvedValue(EXCHANGE_SUCCESS)

          await renderCheckEmail()

          expect(mockMutate).toHaveBeenCalledTimes(1)
          expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { input: { signupSecret: SIGNUP_SECRET } } }),
          )
        },
      )
    })

    describe('WHEN resending the link', () => {
      it.each(storedSecrets)(
        'THEN should send the secret from Step 1 when the local storage %s',
        async (_, setStoredSecret) => {
          const user = setupUser()

          setStoredSecret()
          answerResendAndUpdateStatus()

          await renderCheckEmail()
          await clickResend(user)

          expect(mockResendSignupEmail).toHaveBeenCalledWith({
            variables: { input: { signupSecret: SIGNUP_SECRET, captchaToken: RECAPTCHA_TOKEN } },
          })
        },
      )
    })
  })

  describe('GIVEN the user clicks resend link', () => {
    describe('WHEN the resend succeeds', () => {
      beforeEach(() => {
        answerResendAndUpdateStatus({ resendAvailableInSeconds: 60, resendLimitReached: false })
      })

      it('THEN should send the secret with a fresh signup_resend captcha token', async () => {
        const user = setupUser()

        await renderCheckEmail()

        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()

        await clickResend(user)

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).toHaveBeenCalledWith('signup_resend')
        expect(mockResendSignupEmail).toHaveBeenCalledTimes(1)
        expect(mockResendSignupEmail).toHaveBeenCalledWith({
          variables: { input: { signupSecret: SIGNUP_SECRET, captchaToken: RECAPTCHA_TOKEN } },
        })
      })

      it('THEN should show the new link banner with the address', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await clickResend(user)

        expect(getResendSuccessAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
        expect(queryResendLimitAlert()).not.toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
      })

      it('THEN should count down from the answer', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await clickResend(user)

        expect(getResendButton()).toBeDisabled()
        expect(getResendButton()).toHaveTextContent('Resend in 1:00')

        await advance(1_000)
        expect(getResendButton()).toHaveTextContent('Resend in 0:59')

        await advance(POLL_INTERVAL_MS)
        expect(getResendButton()).toHaveTextContent('Resend in 0:54')
      })
    })

    describe('WHEN the resend succeeds and reaches the limit', () => {
      it('THEN should show both the new link banner and the limit banner', async () => {
        const user = setupUser()

        answerResendAndUpdateStatus({ resendAvailableInSeconds: null, resendLimitReached: true })

        await renderCheckEmail()
        await clickResend(user)

        expect(getResendSuccessAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
        expect(getResendLimitAlert()).toHaveTextContent(RESEND_LIMIT_COPY)
        expect(queryMailboxLimitAlert()).not.toBeInTheDocument()
        expect(queryResendButton()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the lock is busy', () => {
      beforeEach(() => {
        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.LockAcquisitionFailed))
      })

      it('THEN should show the generic banner without retrying', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await clickResend(user)

        expect(mockResendSignupEmail).toHaveBeenCalledTimes(1)
        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
      })

      it('THEN should ask Google for a single token', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await clickResend(user)

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the API answers resend_too_soon', () => {
      it('THEN should count down from the retry delay without any banner', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue(
          buildError(LagoApiError.ResendTooSoon, { retryAfterSeconds: 30 }),
        )

        await renderCheckEmail()
        await clickResend(user)

        expect(getResendButton()).toBeDisabled()
        expect(getResendButton()).toHaveTextContent('Resend in 0:30')
        expect(queryResendSuccessAlert()).not.toBeInTheDocument()
        expect(queryResendLimitAlert()).not.toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
      })

      it.each([
        ['no details', undefined],
        ['a retry delay that is not a number', { retryAfterSeconds: '30' }],
      ])(
        'THEN should keep the resend link button enabled when the answer carries %s',
        async (_, details) => {
          const user = setupUser()

          mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.ResendTooSoon, details))

          await renderCheckEmail()
          await clickResend(user)

          expect(getResendButton()).toBeEnabled()
          expect(getResendButton()).toHaveTextContent(RESEND_LINK_COPY)
        },
      )
    })

    describe('WHEN the API answers resend_limit_reached', () => {
      it('THEN should show the address limit banner and disable the button for the retry delay', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue(
          buildError(LagoApiError.ResendLimitReached, { retryAfterSeconds: 3600 }),
        )

        await renderCheckEmail()
        await clickResend(user)

        expect(getMailboxLimitAlert()).toHaveTextContent(MAILBOX_LIMIT_COPY)
        expect(queryResendLimitAlert()).not.toBeInTheDocument()
        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(getResendButton()).toBeDisabled()
        expect(getResendButton()).toHaveTextContent('Resend in 60:00')
      })

      it('THEN should hide the address limit banner and enable the button once the retry delay ends', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue(
          buildError(LagoApiError.ResendLimitReached, { retryAfterSeconds: 90 }),
        )

        await renderCheckEmail()
        await clickResend(user)
        await advance(90_000)

        expect(queryMailboxLimitAlert()).not.toBeInTheDocument()
        expect(getResendButton()).toBeEnabled()
        expect(getResendButton()).toHaveTextContent(RESEND_LINK_COPY)
      })
    })

    describe('WHEN the sign-up cannot send more links', () => {
      it.each([LagoApiError.SignupResendExhausted, LagoApiError.SignupExpired])(
        'THEN should replace the resend button with start again on %s',
        async (code) => {
          const user = setupUser()

          mockResendSignupEmail.mockResolvedValue(buildError(code))

          await renderCheckEmail()
          await clickResend(user)

          expect(
            screen.queryByTestId(SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID),
          ).not.toBeInTheDocument()
          expect(
            screen.getByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID),
          ).toBeInTheDocument()
          expect(mockOnStartAgain).not.toHaveBeenCalled()
        },
      )

      it.each([
        [LagoApiError.SignupResendExhausted, true],
        [LagoApiError.SignupExpired, false],
      ])(
        'THEN on %s should show the limit banner, as the status does for the same state: %s',
        async (code, shown) => {
          const user = setupUser()

          mockResendSignupEmail.mockResolvedValue(buildError(code))

          await renderCheckEmail()
          await clickResend(user)

          expect(!!queryResendLimitAlert()).toBe(shown)
        },
      )
    })

    describe('WHEN the API answers email_already_verified', () => {
      beforeEach(() => {
        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.EmailAlreadyVerified))
      })

      it('THEN should check the status again at once', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await clickResend(user)

        expect(mockQuery).toHaveBeenCalledTimes(2)
      })

      it('THEN should ask for the resend state again on the restarted check only', async () => {
        const user = setupUser()

        await renderCheckEmail()
        await advance(POLL_INTERVAL_MS)
        await clickResend(user)
        await advance(POLL_INTERVAL_MS)

        expect(getWithResendStates()).toEqual([true, false, true, false])
      })

      it('THEN should exchange the secret when the new check says verified', async () => {
        const user = setupUser()

        mockMutate.mockResolvedValue(EXCHANGE_SUCCESS)

        await renderCheckEmail()

        mockQuery.mockResolvedValueOnce(buildStatus({ status: SignupStatusEnum.Verified }))
        await clickResend(user)

        expect(mockMutate).toHaveBeenCalledTimes(1)
        expect(mockOnLogIn).toHaveBeenCalledWith(mockClient, SESSION_TOKEN)
      })
    })

    describe('WHEN the pending sign-up cannot be found', () => {
      it('THEN should start again', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.NotFound))

        await renderCheckEmail()
        await clickResend(user)

        expect(mockOnStartAgain).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the API answers unprocessable_entity', () => {
      it('THEN should show the generic banner and keep the sign-up', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue(buildError(LagoApiError.UnprocessableEntity))

        await renderCheckEmail()
        await clickResend(user)

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(mockOnStartAgain).not.toHaveBeenCalled()
        expect(getStoredSecret()).toBe(SIGNUP_SECRET)
      })
    })

    describe('WHEN clicking resend again while the captcha loads', () => {
      it('THEN should show the button as loading and send a single link', async () => {
        const user = setupUser()
        const captcha = deferred<string | null>()

        mockedGetRecaptchaToken.mockReturnValueOnce(captcha.promise)
        answerResendAndUpdateStatus()

        await renderCheckEmail()
        await user.click(getResendButton())

        expect(isResendLoading()).toBe(true)

        await user.click(getResendButton())
        await act(async () => {
          captcha.resolve(RECAPTCHA_TOKEN)
        })
        await flush()

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockResendSignupEmail).toHaveBeenCalledTimes(1)
        expect(getResendSuccessAlert()).toBeInTheDocument()
      })
    })

    describe('WHEN the error is shown in the banner', () => {
      it.each([
        [LagoApiError.TooManyRequests, TOO_MANY_ATTEMPTS_COPY],
        [LagoApiError.CaptchaFailed, CAPTCHA_FAILED_COPY],
        [LagoApiError.SignupDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.SelfServeDisabled, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.InternalError, GENERIC_ERROR_COPY],
      ])('THEN should show the %s message', async (code, expectedCopy) => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue(buildError(code))

        await renderCheckEmail()
        await clickResend(user)

        expect(getErrorAlert()).toHaveTextContent(expectedCopy)
        expect(queryResendSuccessAlert()).not.toBeInTheDocument()
        expect(queryResendLimitAlert()).not.toBeInTheDocument()
        expect(mockOnStartAgain).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API answers an error without code', () => {
      it('THEN should show the generic banner', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockResolvedValue({ data: null, errors: [{ message: 'error' }] })

        await renderCheckEmail()
        await clickResend(user)

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show the generic banner', async () => {
        const user = setupUser()

        mockResendSignupEmail.mockRejectedValue(new Error('Failed to fetch'))

        await renderCheckEmail()
        await clickResend(user)

        expect(getErrorAlert()).toHaveTextContent(GENERIC_ERROR_COPY)
      })
    })

    describe('WHEN resending after an error', () => {
      it('THEN should replace the error banner with the new link banner', async () => {
        const user = setupUser()

        mockResendSignupEmail
          .mockResolvedValueOnce(buildError(LagoApiError.CaptchaFailed))
          .mockResolvedValueOnce(buildResendAnswer())

        await renderCheckEmail()
        await clickResend(user)
        await clickResend(user)

        expect(queryErrorAlert()).not.toBeInTheDocument()
        expect(getResendSuccessAlert()).toHaveTextContent(NEW_LINK_SENT_COPY)
      })
    })

    describe('WHEN resending fails after a success', () => {
      it('THEN should replace the new link banner with the error banner', async () => {
        const user = setupUser()

        mockResendSignupEmail
          .mockResolvedValueOnce(buildResendAnswer({ resendAvailableInSeconds: 0 }))
          .mockResolvedValueOnce(buildError(LagoApiError.CaptchaFailed))

        await renderCheckEmail()
        await clickResend(user)
        await clickResend(user)

        expect(queryResendSuccessAlert()).not.toBeInTheDocument()
        expect(getErrorAlert()).toHaveTextContent(CAPTCHA_FAILED_COPY)
      })
    })
  })
})
