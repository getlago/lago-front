import { Typography } from '~/components/designSystem/Typography'
import { LOGIN_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

const SelfServeSignUp = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <div className="flex flex-col gap-8">
          <div>
            <Title>{translate('text_620bc4d4269a55014d493f12')}</Title>
            <Subtitle noMargins>{translate('text_620bc4d4269a55014d493fc9')}</Subtitle>
          </div>

          <Typography
            variant="caption"
            html={translate('text_620bc4d4269a55014d493fd4', { link: LOGIN_ROUTE })}
          />
        </div>
      </Card>
    </Page>
  )
}

export default SelfServeSignUp
