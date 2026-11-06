import { gql } from '@apollo/client'
import { useCallback, useEffect, useState } from 'react'

import { getGraphQLErrorCode } from '~/core/apolloClient'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import { LagoApiError, useResendSignupEmailMutation } from '~/generated/graphql'
import { getRetryAfterSeconds } from '~/pages/auth/common/getRetryAfterSeconds'

import { RESEND_BANNER_ERRORS, RESEND_GENERIC_ERROR } from './constants'
import { ApplyResendState } from './types'

gql`
  mutation resendSignupEmail($input: ResendSignupEmailInput!) {
    resendSignupEmail(input: $input) {
      resendAvailableInSeconds
      resendLimitReached
    }
  }
`

type UseResendSignupEmailProps = {
  signupSecret: string
  onStartAgain: () => void
  onAlreadyVerified: () => void
}

export type UseResendSignupEmailReturn = {
  resendAvailableAt: number | null | undefined
  secondsUntilResend: number
  isCountingDown: boolean
  resendLimitReached: boolean
  hasResent: boolean
  bannerError: string | undefined
  isResending: boolean
  applyResendState: ApplyResendState
  onResend: () => Promise<void>
}

export const useResendSignupEmail = ({
  signupSecret,
  onStartAgain,
  onAlreadyVerified,
}: UseResendSignupEmailProps): UseResendSignupEmailReturn => {
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>()
  const [resendLimitReached, setResendLimitReached] = useState(false)
  const [hasResent, setHasResent] = useState(false)
  const [bannerError, setBannerError] = useState<string>()
  const [now, setNow] = useState(() => Date.now())

  const [resendSignupEmail, { loading: isResending }] = useResendSignupEmailMutation({
    context: { silentError: true },
  })

  // Stable, so the status polling that seeds it does not restart on every render
  const applyResendState = useCallback<ApplyResendState>((seconds, limitReached) => {
    const currentTime = Date.now()

    setNow(currentTime)
    setResendAvailableAt(typeof seconds === 'number' ? currentTime + seconds * 1000 : null)
    setResendLimitReached(limitReached)
  }, [])

  const secondsUntilResend =
    typeof resendAvailableAt === 'number'
      ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
      : 0
  const isCountingDown = secondsUntilResend > 0

  useEffect(() => {
    if (!isCountingDown) return

    const interval = setInterval(() => setNow(Date.now()), 1000)

    return (): void => clearInterval(interval)
  }, [isCountingDown])

  const onResend = async (): Promise<void> => {
    setBannerError(undefined)
    setHasResent(false)

    try {
      // No retry on lock_acquisition_failed: the API spends the single-use token before the lock
      const result = await resendSignupEmail({
        variables: {
          input: { signupSecret, captchaToken: await getRecaptchaToken('signup_resend') },
        },
      })

      const answer = result.data?.resendSignupEmail

      if (answer) {
        applyResendState(answer.resendAvailableInSeconds, answer.resendLimitReached)
        setHasResent(true)

        return
      }

      const code = getGraphQLErrorCode(result.errors?.[0]?.extensions)

      switch (code) {
        case LagoApiError.ResendTooSoon:
          return applyResendState(getRetryAfterSeconds(result.errors), resendLimitReached)
        case LagoApiError.ResendLimitReached:
          return applyResendState(getRetryAfterSeconds(result.errors), true)
        case LagoApiError.SignupResendExhausted:
        case LagoApiError.SignupExpired:
          return applyResendState(null, resendLimitReached)
        case LagoApiError.EmailAlreadyVerified:
          return onAlreadyVerified()
        case LagoApiError.NotFound:
        case LagoApiError.UnprocessableEntity:
          return onStartAgain()
        default:
          return setBannerError(RESEND_BANNER_ERRORS[code] || RESEND_GENERIC_ERROR)
      }
    } catch {
      setBannerError(RESEND_GENERIC_ERROR)
    }
  }

  return {
    resendAvailableAt,
    secondsUntilResend,
    isCountingDown,
    resendLimitReached,
    hasResent,
    bannerError,
    isResending,
    applyResendState,
    onResend,
  }
}
