import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { HOME_ROUTE } from '~/core/router'
import EmojiError from '~/public/images/exploding-head.png'
import { theme } from '~/styles'

const Error404 = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()

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
        buttonAction={() => goBack(HOME_ROUTE, { previousCount: -2 })}
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
