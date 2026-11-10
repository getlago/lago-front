import { gql } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'
import { useRef, useState } from 'react'

import { getGraphQLErrorCode } from '~/core/apolloClient'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import { LagoApiError, useResendSignupEmailMutation } from '~/generated/graphql'

import { getRetryAfterSeconds } from './getRetryAfterSeconds'
import { getSignupBannerError, SIGNUP_GENERIC_ERROR } from './signupErrors'

gql`
  mutation resendSignupEmail($input: ResendSignupEmailInput!) {
    resendSignupEmail(input: $input) {
      resendAvailableInSeconds
      resendLimitReached
    }
  }
`

export type SendSignupLinkOutcome =
  | { type: 'sent'; resendAvailableInSeconds: number | null; resendLimitReached: boolean }
  | { type: 'tooSoon'; retryAfterSeconds: number }
  | { type: 'limitReached'; retryAfterSeconds: number }
  | { type: 'resendExhausted' }
  | { type: 'signupExpired' }
  | { type: 'alreadyVerified' }
  | { type: 'notFound' }
  | { type: 'failed'; bannerError: string }

type SendSignupLinkInput = { signupSecret: string } | { token: string }

type UseSendSignupLinkReturn = {
  isSending: boolean
  sendSignupLink: (input: SendSignupLinkInput) => Promise<SendSignupLinkOutcome | undefined>
}

// unprocessable_entity is a missing input, not a sign-up that is gone: that one answers not_found
const getFailureOutcome = (
  errors: readonly GraphQLFormattedError[] | undefined,
): SendSignupLinkOutcome => {
  const code = getGraphQLErrorCode(errors?.[0]?.extensions)

  switch (code) {
    case LagoApiError.ResendTooSoon:
      return { type: 'tooSoon', retryAfterSeconds: getRetryAfterSeconds(errors) }
    case LagoApiError.ResendLimitReached:
      return { type: 'limitReached', retryAfterSeconds: getRetryAfterSeconds(errors) }
    case LagoApiError.SignupResendExhausted:
      return { type: 'resendExhausted' }
    case LagoApiError.SignupExpired:
      return { type: 'signupExpired' }
    case LagoApiError.EmailAlreadyVerified:
      return { type: 'alreadyVerified' }
    case LagoApiError.NotFound:
      return { type: 'notFound' }
    default:
      return { type: 'failed', bannerError: getSignupBannerError(code) }
  }
}

export const useSendSignupLink = (): UseSendSignupLinkReturn => {
  const [resendSignupEmail] = useResendSignupEmailMutation({ context: { silentError: true } })
  const isSendingRef = useRef(false)
  const [isSending, setIsSending] = useState(false)

  // Set before the captcha, which can take seconds: a second click must not send a second email.
  // Resolves to undefined for a click made while a link is being sent.
  const sendSignupLink = async (
    input: SendSignupLinkInput,
  ): Promise<SendSignupLinkOutcome | undefined> => {
    if (isSendingRef.current) return undefined

    isSendingRef.current = true
    setIsSending(true)

    try {
      // No retry on lock_acquisition_failed: the API spends the single-use token before the lock
      const result = await resendSignupEmail({
        variables: { input: { ...input, captchaToken: await getRecaptchaToken('signup_resend') } },
      })
      const answer = result.data?.resendSignupEmail

      if (!answer) return getFailureOutcome(result.errors)

      return {
        type: 'sent',
        resendAvailableInSeconds: answer.resendAvailableInSeconds ?? null,
        resendLimitReached: answer.resendLimitReached,
      }
    } catch {
      return { type: 'failed', bannerError: SIGNUP_GENERIC_ERROR }
    } finally {
      isSendingRef.current = false
      setIsSending(false)
    }
  }

  return { isSending, sendSignupLink }
}
