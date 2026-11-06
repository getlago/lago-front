import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID,
} from '~/pages/auth/signUpTestIds'

type VerifyEmailCheckFailedProps = {
  error: string
  onRetry: () => void
}

export const VerifyEmailCheckFailed = ({
  error,
  onRetry,
}: VerifyEmailCheckFailedProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-8">
      <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
        {translate(error)}
      </Alert>
      <Button
        size="large"
        fullWidth
        data-test={SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID}
        onClick={onRetry}
      >
        {translate('text_63e27c56dfe64b846474efa3')}
      </Button>
    </div>
  )
}
