import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID } from '~/pages/auth/signUpTestIds'

type StartAgainButtonProps = {
  onStartAgain: () => void
}

export const StartAgainButton = ({ onStartAgain }: StartAgainButtonProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <Button
      variant="secondary"
      size="large"
      fullWidth
      data-test={SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID}
      onClick={onStartAgain}
    >
      {translate('text_1793906497618wfro49qmvpa')}
    </Button>
  )
}
