import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGetOrganizationApiKeyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

gql`
  query getOrganizationApiKey {
    organization {
      id
      apiKey
    }
  }
`

const ApiKeys = () => {
  const { data, loading } = useGetOrganizationApiKeyQuery()
  const { translate } = useInternationalization()
  const { id, apiKey } = data?.organization || {}

  return (
    <Page>
      <Title variant="headline">{translate('text_637f813d31381b1ed90ab2f6')}</Title>
      <Subtitle variant="body" color="grey600">
        {translate('text_637f813d31381b1ed90ab300')}
      </Subtitle>

      <InlineSectionTitle>
        <Typography variant="subhead1" color="grey700">
          {translate('text_637f813d31381b1ed90ab313')}
        </Typography>
        {!loading && (
          <Button
            variant="quaternary"
            size="large"
            startIcon="duplicate"
            onClick={() => {
              copyToClipboard(apiKey || '')
              addToast({
                severity: 'info',
                translateKey: 'text_6227a2e847fcd700e9038952',
              })
            }}
          >
            {translate('text_637f813d31381b1ed90ab30a')}
          </Button>
        )}
      </InlineSectionTitle>

      {loading ? (
        <>
          <Skeleton variant="text" height={12} width={240} marginBottom={theme.spacing(3)} />
          <Skeleton variant="text" height={12} width={160} />
        </>
      ) : (
        <InfoBlock>
          <Typography variant="body" color="grey700">
            {apiKey}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_637f813d31381b1ed90ab320')}
          </Typography>
        </InfoBlock>
      )}

      <InlineSectionTitle>
        <Typography variant="subhead1" color="grey700">
          {translate('text_636df520279a9e1b3c68cc75')}
        </Typography>
        {!loading && (
          <Button
            variant="quaternary"
            size="large"
            startIcon="duplicate"
            onClick={() => {
              copyToClipboard(id || '')
              addToast({
                severity: 'info',
                translateKey: 'text_636df520279a9e1b3c68cc7d',
              })
            }}
          >
            {translate('text_637f813d31381b1ed90ab326')}
          </Button>
        )}
      </InlineSectionTitle>

      {loading ? (
        <>
          <Skeleton variant="text" height={12} width={240} marginBottom={theme.spacing(3)} />
          <Skeleton variant="text" height={12} width={160} />
        </>
      ) : (
        <InfoBlock>
          <Typography variant="body" color="grey700">
            {id}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_637f813d31381b1ed90ab332')}
          </Typography>
        </InfoBlock>
      )}
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
  max-width: ${theme.spacing(168)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const InlineSectionTitle = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoBlock = styled.div`
  padding-bottom: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

export default ApiKeys
