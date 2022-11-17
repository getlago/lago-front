import { gql } from '@apollo/client'
import styled from 'styled-components'

import { useCurrentUserInfosVar, addToast } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button, Icon, Avatar } from '~/components/designSystem'
import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'

gql`
  fragment ApiKeyOrganization on Organization {
    id
    apiKey
  }
`

const ApiKeys = () => {
  const { currentOrganization } = useCurrentUserInfosVar()
  const { translate } = useInternationalization()

  return (
    <Page>
      <Typography variant="headline" color="grey700">
        {translate('text_6227a2e847fcd700e903893f')}
      </Typography>
      <Subtitle variant="body" color="grey600">
        {translate('text_6227a2e847fcd700e9038947')}
      </Subtitle>
      <CopyBlockTitle variant="bodyHl" color="grey500">
        {translate('text_6227a2e847fcd700e903893f')}
      </CopyBlockTitle>
      <CopyBlock>
        <CopyBlockLeft>
          <CopyIcon variant="connector" size="medium">
            <Icon color="dark" name="key" />
          </CopyIcon>
          <Typography variant="body" color="grey700">
            {currentOrganization?.apiKey}
          </Typography>
        </CopyBlockLeft>
        <Button
          variant="quaternary"
          size="large"
          startIcon="duplicate"
          onClick={() => {
            navigator.clipboard.writeText(currentOrganization?.apiKey || '')
            addToast({
              severity: 'info',
              translateKey: 'text_6227a2e847fcd700e9038952',
            })
          }}
        >
          {translate('text_6227a2e847fcd700e903894f')}
        </Button>
      </CopyBlock>
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const CopyBlockTitle = styled(Typography)`
  display: flex;
  align-items: center;
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
`

const CopyBlock = styled.div`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing(12)};
`

const CopyBlockLeft = styled.div`
  display: flex;
  align-items: center;
`

const CopyIcon = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

export default ApiKeys
