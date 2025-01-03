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
import { theme } from '~/styles'

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
      <Typography
        className="hidden h-18 min-h-18 items-center justify-between px-8 shadow-b md:flex"
        variant="bodyHl"
        color="textSecondary"
      >
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
      </Typography>
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

        <Typography className="pt-1" variant="caption">
          {translate('text_63e27c56dfe64b846474ef6c')}
        </Typography>
        <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
          {formatTimeOrgaTZ(updatedAt, 'LLL. dd, yyyy HH:mm:ss')}
        </Typography>

        <Typography className="pt-1" variant="caption">
          {translate('text_63e27c56dfe64b846474ef6e')}
        </Typography>
        <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
          {endpoint}
        </Typography>

        <Typography className="pt-1" variant="caption">
          {translate('text_63e27c56dfe64b846474ef70')}
        </Typography>
        <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
          {id}
        </Typography>

        <Typography className="pt-1" variant="caption">
          {translate('text_63e27c56dfe64b846474ef72')}
        </Typography>
        <Typography className="max-w-ful overflow-wrap-anywherel flex min-w-0" color="grey700">
          {webhookType}
        </Typography>

        <Typography className="pt-1" variant="caption">
          {translate('text_63e27c56dfe64b846474ef74')}
        </Typography>
        <Typography className="max-w-ful overflow-wrap-anywherel flex min-w-0" color="grey700">
          {!hasError ? translate('text_63e27c56dfe64b846474ef73') : httpStatus}
        </Typography>

        {retries > 0 && (
          <>
            <Typography className="pt-1" variant="caption">
              {translate('text_63e27c56dfe64b846474efb2')}
            </Typography>
            <Typography className="max-w-ful overflow-wrap-anywherel flex min-w-0" color="grey700">
              {retries}
            </Typography>
          </>
        )}
      </PropertiesContainer>
      {response && hasError && (
        <CodeBlock>
          <Typography color="grey700" variant="captionHl">
            {translate('text_63e27c56dfe64b846474efb3')}
          </Typography>
          <CodeSnippet
            className="*:pb-0"
            language="json"
            code={response}
            canCopy={false}
            displayHead={false}
          />
        </CodeBlock>
      )}
      <CodeBlock $maxHeight>
        <Typography color="grey700" variant="captionHl">
          {translate('text_63e27c56dfe64b846474efb6')}
        </Typography>
        <CodeSnippet
          className="*:pb-0"
          language="json"
          code={JSON.stringify(JSON.parse(payload || ''), null, 2)}
          canCopy={false}
          displayHead={false}
        />
      </CodeBlock>
    </>
  )
}

const WideLine = styled.div`
  grid-column: span 2;
`

const PropertiesContainer = styled.div`
  padding: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: ${theme.spacing(3)};
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
