import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID } from '~/pages/auth/signUpTestIds'
import { Title } from '~/styles/auth'

type VerifyEmailLoggedInProps = {
  onLogOut: () => Promise<void>
}

export const VerifyEmailLoggedIn = ({ onLogOut }: VerifyEmailLoggedInProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Title>{translate('text_1794213222858du46rznyunc')}</Title>
        <Typography>{translate('text_17942132228590egrwo8eqf4')}</Typography>
      </div>

      <Button
        size="large"
        fullWidth
        data-test={SELF_SERVE_VERIFY_EMAIL_LOG_OUT_BUTTON_TEST_ID}
        onClick={onLogOut}
      >
        {translate('text_17865575089106781wwdm3l3')}
      </Button>
    </div>
  )
}
