import { useState } from 'react'

import { CheckEmailExpired } from './CheckEmailExpired'
import { CheckEmailLoginRequired } from './CheckEmailLoginRequired'
import { CheckEmailWaiting } from './CheckEmailWaiting'
import { useResendSignupEmail } from './useResendSignupEmail'
import { useSignupStatusPolling } from './useSignupStatusPolling'

type SelfServeCheckEmailProps = {
  email: string
  signupSecret: string
  onGoBack: () => void
  onStartAgain: () => void
}

export const SelfServeCheckEmail = ({
  email,
  signupSecret,
  onGoBack,
  onStartAgain,
}: SelfServeCheckEmailProps): JSX.Element => {
  // Bumped when a resend finds the email already verified, so the status is checked again now
  const [pollRequest, setPollRequest] = useState(0)

  const resend = useResendSignupEmail({
    signupSecret,
    onStartAgain,
    onAlreadyVerified: () => setPollRequest((request) => request + 1),
  })
  const screen = useSignupStatusPolling({
    signupSecret,
    pollRequest,
    onStartAgain,
    onResendState: resend.applyResendState,
  })

  if (screen === 'expired') return <CheckEmailExpired onStartAgain={onStartAgain} />

  if (screen === 'loginRequired') return <CheckEmailLoginRequired />

  return (
    <CheckEmailWaiting
      email={email}
      resend={resend}
      onGoBack={onGoBack}
      onStartAgain={onStartAgain}
    />
  )
}
