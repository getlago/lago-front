import { useCallback, useEffect, useState } from 'react'

import { useSendSignupLink } from '~/pages/auth/common/useSendSignupLink'

import { ApplyResendState } from './types'

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
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [hasResent, setHasResent] = useState(false)
  const [bannerError, setBannerError] = useState<string>()
  const [now, setNow] = useState(() => Date.now())
  const { isSending, sendSignupLink } = useSendSignupLink()

  // Stable, so the status polling that seeds it does not restart on every render
  const applyResendState = useCallback<ApplyResendState>((seconds, limitReached) => {
    const currentTime = Date.now()

    setNow(currentTime)
    setResendAvailableAt(typeof seconds === 'number' ? currentTime + seconds * 1000 : null)
    setIsLimitReached(limitReached)
  }, [])

  const secondsUntilResend =
    typeof resendAvailableAt === 'number'
      ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
      : 0
  const isCountingDown = secondsUntilResend > 0
  // resend_limit_reached is an hourly window that ends with its countdown. Without a countdown
  // (null), the sign-up cannot send more links at all.
  const resendLimitReached = isLimitReached && (resendAvailableAt === null || isCountingDown)

  useEffect(() => {
    if (!isCountingDown) return

    const interval = setInterval(() => setNow(Date.now()), 1000)

    return (): void => clearInterval(interval)
  }, [isCountingDown])

  const onResend = async (): Promise<void> => {
    const outcome = await sendSignupLink({ signupSecret })

    if (!outcome) return

    setBannerError(undefined)
    setHasResent(outcome.type === 'sent')

    switch (outcome.type) {
      case 'sent':
        return applyResendState(outcome.resendAvailableInSeconds, outcome.resendLimitReached)
      case 'tooSoon':
        return applyResendState(outcome.retryAfterSeconds, false)
      case 'limitReached':
        return applyResendState(outcome.retryAfterSeconds, true)
      case 'resendExhausted':
      case 'signupExpired':
        return applyResendState(null, resendLimitReached)
      case 'alreadyVerified':
        return onAlreadyVerified()
      case 'notFound':
        return onStartAgain()
      case 'failed':
        return setBannerError(outcome.bannerError)
    }
  }

  return {
    resendAvailableAt,
    secondsUntilResend,
    isCountingDown,
    resendLimitReached,
    hasResent,
    bannerError,
    isResending: isSending,
    applyResendState,
    onResend,
  }
}
