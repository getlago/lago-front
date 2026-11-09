import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { LOGIN_ROUTE, useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RecaptchaNotice } from '~/pages/auth/common/RecaptchaNotice'
import { ResendCountdown } from '~/pages/auth/common/ResendCountdown'
import {
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
} from '~/pages/auth/signUpTestIds'
import { Title } from '~/styles/auth'

import { STATE_COPY } from './constants'
import { ClosedLinkState, ResendNotice } from './types'

type VerifyEmailLinkStateProps = {
  linkState: ClosedLinkState
  hasSignupSecret: boolean
  resendNotice: ResendNotice | undefined
  resendAvailableAt: number | undefined
  onResendCountdownEnd: () => void
  bannerError: string | undefined
  isResending: boolean
  onSendNewLink: () => void
  onBackToSignUp: () => Promise<void>
}

export const VerifyEmailLinkState = ({
  linkState,
  hasSignupSecret,
  resendNotice,
  resendAvailableAt,
  onResendCountdownEnd,
  bannerError,
  isResending,
  onSendNewLink,
  onBackToSignUp,
}: VerifyEmailLinkStateProps): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const copy = STATE_COPY[linkState]
  const canSendNewLink = resendNotice?.type !== 'sent' || resendNotice.canSendMore

  const isCountingDown = resendAvailableAt !== undefined

  const getWarningCopy = (notice: Exclude<ResendNotice, { type: 'sent' }>): string => {
    if (notice.type === 'limitReached') return translate('text_17939064976188g9cn8x2cj4')

    return translate('text_1793898059309ltbe60gt6pd')
  }

  const renderResendNotice = (): JSX.Element | null => {
    if (!resendNotice) return null

    if (resendNotice.type === 'sent') {
      return (
        <>
          <Alert type="success" data-test={SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID}>
            {translate('text_1793909885494hs0en0o3hna')}
          </Alert>
          {!resendNotice.canSendMore && (
            <Alert type="warning" data-test={SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID}>
              {translate('text_17939064976188g9cn8x2cj4')}
            </Alert>
          )}
        </>
      )
    }

    return (
      <Alert type="warning" data-test={SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID}>
        {getWarningCopy(resendNotice)}
      </Alert>
    )
  }

  const renderSendNewLink = (): JSX.Element | null => {
    if (!canSendNewLink) return null

    return (
      <>
        <Button
          variant={isCountingDown ? 'secondary' : 'primary'}
          size="large"
          fullWidth
          disabled={isCountingDown}
          loading={isResending}
          data-test={SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID}
          onClick={onSendNewLink}
        >
          {isCountingDown ? (
            <ResendCountdown
              key={resendAvailableAt}
              endsAt={resendAvailableAt}
              onEnd={onResendCountdownEnd}
            />
          ) : (
            translate('text_17939098854936d3uhapsh4f')
          )}
        </Button>
        <RecaptchaNotice />
      </>
    )
  }

  const renderBackToSignUp = (): JSX.Element => (
    <Button
      variant="secondary"
      size="large"
      fullWidth
      data-test={SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID}
      onClick={onBackToSignUp}
    >
      {translate('text_179390988549342e7k8whdcq')}
    </Button>
  )

  const renderActions = (): JSX.Element | null => {
    switch (linkState) {
      case 'alreadyVerified':
        return (
          <Button
            size="large"
            fullWidth
            data-test={SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID}
            onClick={() => navigate(LOGIN_ROUTE)}
          >
            {translate('text_1793909885493vtps6yqk0dr')}
          </Button>
        )
      case 'invalid':
        return (
          <>
            {hasSignupSecret && renderSendNewLink()}
            {renderBackToSignUp()}
          </>
        )
      case 'signupExpired':
        return renderBackToSignUp()
      default:
        return renderSendNewLink()
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Title>{translate(copy.title)}</Title>
        {!!copy.text && <Typography>{translate(copy.text)}</Typography>}
      </div>

      {renderResendNotice()}

      {!!bannerError && (
        <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
          {translate(bannerError)}
        </Alert>
      )}

      <div className="flex flex-col gap-4">{renderActions()}</div>
    </div>
  )
}
