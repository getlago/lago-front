import { useCallback, useState } from 'react'

import { useSendSignupLink } from '~/pages/auth/common/useSendSignupLink'

import { MINUTE_RULE_MAX_WAIT_SECONDS } from './constants'
import { ApplyResendState } from './types'

type UseResendSignupEmailProps = {
  signupSecret: string
  onStartAgain: () => void
  onAlreadyVerified: () => void
}

export type UseResendSignupEmailReturn = {
  resendAvailableAt: number | null | undefined
  countdownEndsAt: number | undefined
  endCountdown: () => void
  resendLimitReached: boolean
  isMailboxLimited: boolean
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
  const [hasLongWait, setHasLongWait] = useState(false)
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
    setHasLongWait(typeof seconds === 'number' && seconds > MINUTE_RULE_MAX_WAIT_SECONDS)
  }, [])

  // now moves only when a countdown starts or ends: the countdown label ticks on its own
  const countdownEndsAt =
    typeof resendAvailableAt === 'number' && resendAvailableAt > now ? resendAvailableAt : undefined
  // This sign-up can send no more links: the API answers it without a countdown (null)
  const resendLimitReached = isLimitReached && resendAvailableAt === null
  const isMailboxLimited = hasLongWait && countdownEndsAt !== undefined

  // Stable, so the countdown label does not restart its clock on every render
  const endCountdown = useCallback((): void => setNow(Date.now()), [])

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
        // The address's hourly limit, not this sign-up's: its banner comes from the length of the wait
        return applyResendState(outcome.retryAfterSeconds, false)
      case 'resendExhausted':
        return applyResendState(null, true)
      case 'signupExpired':
        return applyResendState(null, false)
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
    countdownEndsAt,
    endCountdown,
    resendLimitReached,
    isMailboxLimited,
    hasResent,
    bannerError,
    isResending: isSending,
    applyResendState,
    onResend,
  }
}
