import styled from 'styled-components'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { HOME_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

const Forbidden = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()

  return (
    <Container>
      <GenericPlaceholder
        image={<ErrorImage width="136" height="104" />}
        title={translate('text_66474faf77c70900619567c7')}
        subtitle={translate('text_66474fb55f1b6901c7ac7683')}
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

export default Forbidden
