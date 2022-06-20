import { useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { LOGIN_ROUTE } from '~/core/router'
import { Page, Title, Subtitle, StyledLogo, Card } from '~/styles/auth'

const ForgotPassword = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        <Title variant="headline">{translate('text_620bc4d4269a55014d493f16')}</Title>
        <Subtitle>{translate('text_620bc4d4269a55014d493f42')}</Subtitle>

        <Button variant="secondary" fullWidth size="large" onClick={() => navigate(LOGIN_ROUTE)}>
          {translate('text_620bc4d4269a55014d493f2a')}
        </Button>
      </Card>
    </Page>
  )
}

export default ForgotPassword
