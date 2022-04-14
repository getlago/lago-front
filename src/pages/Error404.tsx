import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

import { useI18nContext } from '~/core/I18nContext'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmojiError from '~/public/images/exploding-head.png'
import { theme } from '~/styles'

const Error404 = () => {
  const { translate } = useI18nContext()
  const navigate = useNavigate()

  // TODO
  return (
    <Container>
      <GenericPlaceholder
        image={<img src={EmojiError} alt="error-emoji" />}
        title={translate('Page not found')}
        subtitle={translate(
          'It seems the page you was looking for do not exists, please go back to the app.'
        )}
        buttonTitle={translate('Go back to the app')}
        buttonAction={() => navigate('/')}
      />
    </Container>
  )
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;

  > * {
    margin: auto;
    padding: ${theme.spacing(4)};
  }
`

export default Error404
