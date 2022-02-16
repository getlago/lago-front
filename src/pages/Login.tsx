import styled from 'styled-components'

import { theme } from '~/styles'
import Logo from '~/public/images/logo/lago-logo.svg'
import { Typography } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'

const Login = () => {
  const { translate } = useI18nContext()

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        <Title variant="headline">{translate('text_620bc4d4269a55014d493f08')}</Title>
      </Card>
    </Page>
  )
}

export default Login

const Page = styled.div`
  background-color: ${theme.palette.grey[100]};
  min-height: 100vh;
  padding: ${theme.spacing(20)};
`

const Card = styled.div`
  margin: 0 auto;
  background-color: ${theme.palette.background.paper};
  border-radius: 12px;
  box-shadow: 0px 6px 8px 0px #19212e1f; // TODO
  padding: ${theme.spacing(10)};
  max-width: 576px;
`

const StyledLogo = styled(Logo)`
  margin-bottom: ${theme.spacing(12)};
`

const Title = styled(Typography)``
