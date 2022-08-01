import { ButtonLink } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { LOGIN_ROUTE } from '~/core/router'
import { Page, Title, Subtitle, StyledLogo, Card } from '~/styles/auth'

const ForgotPassword = () => {
  const { translate } = useInternationalization()

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        <Title variant="headline">{translate('text_620bc4d4269a55014d493f16')}</Title>
        <Subtitle>{translate('text_620bc4d4269a55014d493f42')}</Subtitle>

        <ButtonLink
          type="button"
          to={LOGIN_ROUTE}
          buttonProps={{ size: 'large', fullWidth: true, variant: 'secondary' }}
        >
          {translate('text_620bc4d4269a55014d493f2a')}
        </ButtonLink>
      </Card>
    </Page>
  )
}

export default ForgotPassword
