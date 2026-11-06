import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { LOGIN_ROUTE, useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID,
  SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID,
} from '~/pages/auth/signUpTestIds'

export const CheckEmailLoginRequired = (): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-8" data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
      <Alert type="info">{translate('text_1793906497619x73aav0eroa')}</Alert>
      <Button
        size="large"
        fullWidth
        data-test={SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID}
        onClick={() => navigate(LOGIN_ROUTE)}
      >
        {translate('text_1793906497619qiquyn7ou5j')}
      </Button>
    </div>
  )
}
