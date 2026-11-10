import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RecaptchaNotice } from '~/pages/auth/common/RecaptchaNotice'
import {
  SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID,
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_MAILBOX_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID,
} from '~/pages/auth/signUpTestIds'
import { Title } from '~/styles/auth'

import { ResendCountdown } from './ResendCountdown'
import { StartAgainButton } from './StartAgainButton'
import { UseResendSignupEmailReturn } from './useResendSignupEmail'

type CheckEmailWaitingProps = {
  email: string
  resend: UseResendSignupEmailReturn
  onGoBack: () => void
  onStartAgain: () => void
}

export const CheckEmailWaiting = ({
  email,
  resend,
  onGoBack,
  onStartAgain,
}: CheckEmailWaitingProps): JSX.Element => {
  const { translate } = useInternationalization()
  const {
    resendAvailableAt,
    countdownEndsAt,
    endCountdown,
    resendLimitReached,
    isMailboxLimited,
    hasResent,
    bannerError,
    isResending,
    onResend,
  } = resend

  const isCountingDown = countdownEndsAt !== undefined

  const renderResend = (): JSX.Element => {
    if (resendAvailableAt === null) return <StartAgainButton onStartAgain={onStartAgain} />

    return (
      <Button
        variant={isCountingDown ? 'secondary' : 'primary'}
        size="large"
        fullWidth
        disabled={isCountingDown}
        loading={isResending || resendAvailableAt === undefined}
        data-test={SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID}
        onClick={onResend}
      >
        {isCountingDown ? (
          <ResendCountdown key={countdownEndsAt} endsAt={countdownEndsAt} onEnd={endCountdown} />
        ) : (
          translate('text_1793906497618vxgtkot7zga')
        )}
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-8" data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
      <div className="flex flex-col gap-3">
        <Title>{translate('text_1793898059309bceac2ri5mc')}</Title>
        <Typography html={translate('text_1793898059309lqujtjacaho', { email })} />
        <Typography variant="caption">{translate('text_1793898059309bhkfbbq9q2z')}</Typography>
      </div>

      {hasResent && (
        <Alert type="success" data-test={SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID}>
          <Typography
            color="inherit"
            html={translate('text_1793906497618bqrpqwr8a94', { email })}
          />
        </Alert>
      )}

      {resendLimitReached && (
        <Alert type="warning" data-test={SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID}>
          {translate('text_17939064976188g9cn8x2cj4')}
        </Alert>
      )}

      {isMailboxLimited && (
        <Alert type="warning" data-test={SELF_SERVE_SIGNUP_MAILBOX_LIMIT_ALERT_TEST_ID}>
          {translate('text_1794240318710mz7btyuru7b')}
        </Alert>
      )}

      {!!bannerError && (
        <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
          {translate(bannerError)}
        </Alert>
      )}

      {renderResend()}

      {resendAvailableAt !== null && <RecaptchaNotice />}

      <div className="flex items-center justify-center gap-1">
        <Typography variant="caption">{translate('text_17938980593099x6m52ys6t2')}</Typography>
        <Button
          variant="inline"
          size="small"
          data-test={SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID}
          onClick={onGoBack}
        >
          {translate('text_1793898059309vz0niu6emp8')}
        </Button>
      </div>
    </div>
  )
}
