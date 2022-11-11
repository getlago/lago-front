import { gql } from '@apollo/client'
import styled from 'styled-components'

import { useCurrentUserInfosVar, addToast } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button, Avatar, Icon } from '~/components/designSystem'
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
    <>
      <ApiKey>
        <Typography variant="headline">{translate('text_6227a2e847fcd700e903893f')}</Typography>
        <Subtitle>{translate('text_6227a2e847fcd700e9038947')}</Subtitle>
        <SubtitleSecretKey variant="bodyHl" color="disabled">
          {translate('text_6227a2e847fcd700e903893f')}
        </SubtitleSecretKey>
        <CopyBlock>
          <Avatar variant="connector" size="medium">
            <Icon color="dark" name="key" />
          </Avatar>
          <SecretKey color="textSecondary">{currentOrganization?.apiKey}</SecretKey>
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
      </ApiKey>
      <OrganizationId>
        <Typography variant="headline">{translate('text_636df520279a9e1b3c68cc75')}</Typography>
        <SubtitleSecretKey variant="bodyHl" color="disabled">
          {translate('text_636df520279a9e1b3c68cc75')}
        </SubtitleSecretKey>
        <CopyBlock>
          <Avatar variant="connector" size="medium">
            <Icon color="dark" name="key" />
          </Avatar>
          <SecretKey color="textSecondary">{currentOrganization?.id}</SecretKey>
          <Button
            variant="quaternary"
            size="large"
            startIcon="duplicate"
            onClick={() => {
              navigator.clipboard.writeText(currentOrganization?.id || '')
              addToast({
                severity: 'info',
                translateKey: 'text_636df520279a9e1b3c68cc7d',
              })
            }}
          >
            {translate('text_6227a2e847fcd700e903894f')}
          </Button>
        </CopyBlock>
      </OrganizationId>
    </>
  )
}

const ApiKey = styled.div`
  padding: ${theme.spacing(12)};
`

const OrganizationId = styled.div`
  padding-right: ${theme.spacing(12)};
  padding-left: ${theme.spacing(12)};
  padding-bottom: ${theme.spacing(12)};
`

const Subtitle = styled(Typography)`
  margin-top: ${theme.spacing(2)};
`

const CopyBlock = styled.div`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const SubtitleSecretKey = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
`

const SecretKey = styled(Typography)`
  margin-right: auto;
`

export default ApiKeys
