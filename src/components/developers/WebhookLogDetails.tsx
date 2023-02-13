import { gql } from '@apollo/client'
import styled from 'styled-components'

import { WebhookLogDetailsFragment, WebhookStatusEnum } from '~/generated/graphql'
import { Typography, Chip /*, Button */ } from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { CodeSnippet } from '~/components/CodeSnippet'

gql`
  fragment WebhookLogDetails on Webhook {
    id
    webhookType
    status
    payload
    response
    httpStatus
    endpoint
    retries
    createdAt
  }
`

interface WebhookLogDetailsProps {
  log: WebhookLogDetailsFragment
}

export const WebhookLogDetails = ({ log }: WebhookLogDetailsProps) => {
  const { id, webhookType, createdAt, endpoint, retries, response, status, httpStatus, payload } =
    log
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const hasError = status === WebhookStatusEnum.Failed

  return (
    <>
      <LogHeader variant="bodyHl" color="textSecondary">
        {webhookType}

        {/* TODO - API is not ready, will be done as another feature
         {hasError && (
          <Button
            variant="quaternary"
            onClick={() => {
              // TODO
            }}
          >
            {translate('text_63e27c56dfe64b846474efa3')}
          </Button>
        )} */}
      </LogHeader>
      <PropertiesContainer>
        <WideLine>
          <Typography variant="bodyHl" color="grey700">
            {translate('text_63e27c56dfe64b846474ef6a')}
          </Typography>
        </WideLine>

        {hasError && (
          <WideLine>
            <Chip
              icon="close-circle-unfilled"
              type="error"
              label={translate('text_63e27c56dfe64b846474efa6')}
            />
          </WideLine>
        )}

        <PropertyLabel variant="caption">
          {translate('text_63e27c56dfe64b846474ef6c')}
        </PropertyLabel>
        <PropertyValue color="grey700">
          {formatTimeOrgaTZ(createdAt, 'LLL. dd, yyyy HH:mm:ss')}
        </PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_63e27c56dfe64b846474ef6e')}
        </PropertyLabel>
        <PropertyValue color="grey700">{endpoint}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_63e27c56dfe64b846474ef70')}
        </PropertyLabel>
        <PropertyValue color="grey700">{id}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_63e27c56dfe64b846474ef72')}
        </PropertyLabel>
        <PropertyValue color="grey700">{webhookType}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_63e27c56dfe64b846474ef74')}
        </PropertyLabel>
        <PropertyValue color="grey700">
          {!hasError ? translate('text_63e27c56dfe64b846474ef73') : httpStatus}
        </PropertyValue>

        {retries > 0 && (
          <>
            <PropertyLabel variant="caption">
              {translate('text_63e27c56dfe64b846474efb2')}
            </PropertyLabel>
            <PropertyValue color="grey700">{retries}</PropertyValue>
          </>
        )}
      </PropertiesContainer>
      {response && (
        <CodeBlock>
          <Typography color="grey700" variant="captionHl">
            {translate('text_63e27c56dfe64b846474efb3')}
          </Typography>
          <StyledCodeSnippet language="json" code={response} canCopy={false} displayHead={false} />
        </CodeBlock>
      )}
      <CodeBlock>
        <Typography color="grey700" variant="captionHl">
          {translate('text_63e27c56dfe64b846474efb6')}
        </Typography>
        <StyledCodeSnippet
          language="json"
          code={JSON.stringify(JSON.parse(payload || ''), null, 2)}
          canCopy={false}
          displayHead={false}
        />
      </CodeBlock>
    </>
  )
}

const LogHeader = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  min-height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(8)};
  box-sizing: border-box;

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const WideLine = styled.div`
  grid-column: span 2;
`

const PropertyLabel = styled(Typography)`
  padding-top: 4px;
`

const PropertyValue = styled(Typography)`
  max-width: 100%;
  min-width: 0;
  display: flex;
  overflow-wrap: anywhere;
`

const PropertiesContainer = styled.div`
  padding: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: ${theme.spacing(3)};
`

const StyledCodeSnippet = styled(CodeSnippet)`
  > * {
    padding-bottom: 0px;
  }
`

const CodeBlock = styled.div`
  background-color: ${theme.palette.grey[100]};
  box-shadow: ${theme.shadows[7]};
  margin-left: 1px;
  flex: 1;
  padding-bottom: ${theme.spacing(4)};

  > *:first-child {
    padding: ${theme.spacing(8)} 0 0 ${theme.spacing(8)};
  }

  > *:last-child {
    height: calc(100% - 52px);
  }
`
