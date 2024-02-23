import { gql } from '@apollo/client'
import styled from 'styled-components'

import { CodeSnippet } from '~/components/CodeSnippet'
import { Button, Chip, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  useRetryWebhookMutation,
  WebhookLogDetailsFragment,
  WebhookStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { NAV_HEIGHT, theme } from '~/styles'

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
    updatedAt
  }

  mutation retryWebhook($input: RetryWebhookInput!) {
    retryWebhook(input: $input) {
      id
    }
  }
`

interface WebhookLogDetailsProps {
  log: WebhookLogDetailsFragment
}

export const WebhookLogDetails = ({ log }: WebhookLogDetailsProps) => {
  const { id, webhookType, updatedAt, endpoint, retries, response, status, httpStatus, payload } =
    log
  const { translate } = useInternationalization()
  const [retry] = useRetryWebhookMutation({
    onCompleted({ retryWebhook }) {
      if (!!retryWebhook) {
        addToast({
          severity: 'success',
          translateKey: 'text_63f79ddae2e0b1892bb4955c',
        })
      }
    },
  })
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const hasError = status === WebhookStatusEnum.Failed

  return (
    <>
      <LogHeader variant="bodyHl" color="textSecondary">
        {webhookType}
        {hasError && (
          <Button
            variant="quaternary"
            onClick={async () => {
              await retry({
                variables: {
                  input: { id },
                },
              })
            }}
          >
            {translate('text_63e27c56dfe64b846474efa3')}
          </Button>
        )}
      </LogHeader>
      <PropertiesContainer>
        <WideLine>
          <Typography variant="captionHl" color="grey700">
            {translate('text_63e27c56dfe64b846474ef6a')}
          </Typography>
        </WideLine>

        {hasError && (
          <WideLine>
            <Chip
              error
              icon="close-circle-unfilled"
              label={translate('text_63e27c56dfe64b846474efa6')}
            />
          </WideLine>
        )}

        <PropertyLabel variant="caption">
          {translate('text_63e27c56dfe64b846474ef6c')}
        </PropertyLabel>
        <PropertyValue color="grey700">
          {formatTimeOrgaTZ(updatedAt, 'LLL. dd, yyyy HH:mm:ss')}
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
      {response && hasError && (
        <CodeBlock>
          <Typography color="grey700" variant="captionHl">
            {translate('text_63e27c56dfe64b846474efb3')}
          </Typography>
          <StyledCodeSnippet language="json" code={response} canCopy={false} displayHead={false} />
        </CodeBlock>
      )}
      <CodeBlock $maxHeight>
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

const CodeBlock = styled.div<{ $maxHeight?: boolean }>`
  background-color: ${theme.palette.grey[100]};
  box-shadow: ${theme.shadows[7]};
  margin-left: 1px;
  flex: ${({ $maxHeight }) => ($maxHeight ? 1 : 'initial')};
  padding-bottom: ${theme.spacing(4)};

  > *:first-child {
    padding: ${theme.spacing(8)} 0 0 ${theme.spacing(8)};
  }

  > *:last-child {
    height: calc(100% - 52px);
  }
`
