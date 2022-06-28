import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { HOME_ROUTE } from '~/core/router'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

const Error404 = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()

  return (
    <Container>
      <GenericPlaceholder
        image={<ErrorImage width="136" height="104" />}
        title={translate('text_62bac37900192b773560e82d')}
        subtitle={translate('text_62bac37900192b773560e82f')}
        buttonTitle={translate('text_62bac37900192b773560e831')}
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
