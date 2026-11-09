import { act, renderHook } from '@testing-library/react'

import { getRecaptchaToken } from '~/core/utils/recaptcha'
import { LagoApiError } from '~/generated/graphql'

import { SEND_SIGNUP_LINK_GENERIC_ERROR, useSendSignupLink } from '../useSendSignupLink'

const mockResendSignupEmail = jest.fn()
const mockUseResendSignupEmailMutation = jest.fn()

jest.mock('~/core/utils/recaptcha', () => ({
  getRecaptchaToken: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useResendSignupEmailMutation: (...args: unknown[]) => mockUseResendSignupEmailMutation(...args),
}))

const mockedGetRecaptchaToken = jest.mocked(getRecaptchaToken)

const SIGNUP_SECRET = 'signup-secret-1'
const LINK_TOKEN = 'link-token-1'
const RECAPTCHA_TOKEN = 'recaptcha-token-1'
const TOO_MANY_ATTEMPTS_ERROR = 'text_1793898059309ltbe60gt6pd'

const buildError = (
  code: string,
  details?: Record<string, unknown>,
): { data: null; errors: { message: string; extensions: Record<string, unknown> }[] } => ({
  data: null,
  errors: [{ message: 'error', extensions: { code, ...(details && { details }) } }],
})

const deferred = <T>(): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

const renderSendSignupLink = (): ReturnType<
  typeof renderHook<ReturnType<typeof useSendSignupLink>, unknown>
> => renderHook(() => useSendSignupLink())

describe('useSendSignupLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseResendSignupEmailMutation.mockReturnValue([mockResendSignupEmail, { loading: false }])
    mockedGetRecaptchaToken.mockResolvedValue(RECAPTCHA_TOKEN)
  })

  describe('GIVEN a link is sent', () => {
    describe('WHEN the hook mounts', () => {
      it('THEN should silence the error toasts of the mutation', () => {
        renderSendSignupLink()

        expect(mockUseResendSignupEmailMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
      })
    })

    describe.each([
      ['the signup secret', { signupSecret: SIGNUP_SECRET }],
      ['a link token', { token: LINK_TOKEN }],
    ])('WHEN sending with %s', (_, input) => {
      it('THEN should send it with a fresh signup_resend captcha token', async () => {
        mockResendSignupEmail.mockResolvedValue({
          data: { resendSignupEmail: { resendAvailableInSeconds: 60, resendLimitReached: false } },
        })

        const { result } = renderSendSignupLink()

        await act(async () => {
          await result.current.sendSignupLink(input)
        })

        expect(mockedGetRecaptchaToken).toHaveBeenCalledWith('signup_resend')
        expect(mockResendSignupEmail).toHaveBeenCalledWith({
          variables: { input: { ...input, captchaToken: RECAPTCHA_TOKEN } },
        })
      })
    })

    describe('WHEN the API sends the link', () => {
      it('THEN should return the resend state of the answer', async () => {
        mockResendSignupEmail.mockResolvedValue({
          data: { resendSignupEmail: { resendAvailableInSeconds: null, resendLimitReached: true } },
        })

        const { result } = renderSendSignupLink()
        let outcome

        await act(async () => {
          outcome = await result.current.sendSignupLink({ signupSecret: SIGNUP_SECRET })
        })

        expect(outcome).toEqual({
          type: 'sent',
          resendAvailableInSeconds: null,
          resendLimitReached: true,
        })
      })
    })

    describe('WHEN the API refuses it', () => {
      it.each([
        [
          LagoApiError.ResendTooSoon,
          { retryAfterSeconds: 42 },
          { type: 'tooSoon', retryAfterSeconds: 42 },
        ],
        [
          LagoApiError.ResendLimitReached,
          { retryAfterSeconds: 3600 },
          { type: 'limitReached', retryAfterSeconds: 3600 },
        ],
        [LagoApiError.SignupResendExhausted, undefined, { type: 'resendExhausted' }],
        [LagoApiError.SignupExpired, undefined, { type: 'signupExpired' }],
        [LagoApiError.EmailAlreadyVerified, undefined, { type: 'alreadyVerified' }],
        [LagoApiError.NotFound, undefined, { type: 'notFound' }],
        [
          LagoApiError.UnprocessableEntity,
          undefined,
          { type: 'failed', bannerError: SEND_SIGNUP_LINK_GENERIC_ERROR },
        ],
        [
          LagoApiError.LockAcquisitionFailed,
          undefined,
          { type: 'failed', bannerError: SEND_SIGNUP_LINK_GENERIC_ERROR },
        ],
        [
          LagoApiError.TooManyRequests,
          undefined,
          { type: 'failed', bannerError: TOO_MANY_ATTEMPTS_ERROR },
        ],
      ])('THEN should map %s to its outcome', async (code, details, expected) => {
        mockResendSignupEmail.mockResolvedValue(buildError(code, details))

        const { result } = renderSendSignupLink()
        let outcome

        await act(async () => {
          outcome = await result.current.sendSignupLink({ signupSecret: SIGNUP_SECRET })
        })

        expect(outcome).toEqual(expected)
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should return the generic error', async () => {
        mockResendSignupEmail.mockRejectedValue(new Error('Failed to fetch'))

        const { result } = renderSendSignupLink()
        let outcome

        await act(async () => {
          outcome = await result.current.sendSignupLink({ signupSecret: SIGNUP_SECRET })
        })

        expect(outcome).toEqual({ type: 'failed', bannerError: SEND_SIGNUP_LINK_GENERIC_ERROR })
      })
    })
  })

  describe('GIVEN a link is being sent', () => {
    describe('WHEN the captcha is still loading', () => {
      it('THEN should already report the send as running', async () => {
        const captcha = deferred<string | null>()

        mockedGetRecaptchaToken.mockReturnValue(captcha.promise)

        const { result } = renderSendSignupLink()

        act(() => {
          void result.current.sendSignupLink({ signupSecret: SIGNUP_SECRET })
        })

        expect(result.current.isSending).toBe(true)

        await act(async () => {
          captcha.resolve(RECAPTCHA_TOKEN)
        })

        expect(result.current.isSending).toBe(false)
      })
    })

    describe('WHEN a second send starts before the first ends', () => {
      it('THEN should ignore it without a second captcha nor email', async () => {
        const captcha = deferred<string | null>()

        mockedGetRecaptchaToken.mockReturnValue(captcha.promise)
        mockResendSignupEmail.mockResolvedValue({
          data: { resendSignupEmail: { resendAvailableInSeconds: 60, resendLimitReached: false } },
        })

        const { result } = renderSendSignupLink()
        const { sendSignupLink } = result.current
        let secondOutcome

        await act(async () => {
          const first = sendSignupLink({ signupSecret: SIGNUP_SECRET })

          secondOutcome = await sendSignupLink({ signupSecret: SIGNUP_SECRET })
          captcha.resolve(RECAPTCHA_TOKEN)
          await first
        })

        expect(secondOutcome).toBeUndefined()
        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockResendSignupEmail).toHaveBeenCalledTimes(1)
      })
    })
  })
})
