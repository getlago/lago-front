import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID } from '~/pages/auth/signUpTestIds'
import { Title } from '~/styles/auth'

import { StartAgainButton } from './StartAgainButton'

type CheckEmailExpiredProps = {
  onStartAgain: () => void
}

export const CheckEmailExpired = ({ onStartAgain }: CheckEmailExpiredProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-8" data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
      <Title>{translate('text_1793906497618doa3hbp1lmh')}</Title>
      <StartAgainButton onStartAgain={onStartAgain} />
    </div>
  )
}
