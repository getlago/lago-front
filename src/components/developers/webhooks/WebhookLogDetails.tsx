import { gql } from '@apollo/client'

import { CodeSnippet } from '~/components/CodeSnippet'
import { Button, Status, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { statusWebhookMapping } from '~/core/constants/statusWebhookMapping'
import {
  useRetryWebhookMutation,
  WebhookLogDetailsFragment,
  WebhookStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

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
    async onCompleted({ retryWebhook }) {
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
        className="hidden min-h-14 items-center justify-between px-4 py-2 shadow-b md:flex"
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

      <div className="flex flex-col gap-12 p-4">
        <div className="grid grid-cols-[140px,_1fr] items-baseline gap-3 pb-12 shadow-b">
          <div className="col-span-2">
            <Typography variant="subhead" color="grey700">
              {translate('text_174662372967481i3t20hzfv')}
            </Typography>
          </div>

          <Typography className="pt-1" variant="caption">
            {translate('text_63e27c56dfe64b846474ef72')}
          </Typography>
          <div className="flex items-center gap-2">
            <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
              {webhookType}
            </Typography>
            <Status {...statusWebhookMapping(status)} />
          </div>

          <Typography className="pt-1" variant="caption">
            {translate('text_63e27c56dfe64b846474ef70')}
          </Typography>
          <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
            {id}
          </Typography>

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

          {httpStatus && (
            <>
              <Typography className="pt-1" variant="caption">
                {translate('text_63e27c56dfe64b846474ef74')}
              </Typography>
              <Typography
                className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                color="grey700"
              >
                {!hasError ? translate('text_63e27c56dfe64b846474ef73') : httpStatus}
              </Typography>
            </>
          )}

          {retries > 0 && (
            <>
              <Typography className="pt-1" variant="caption">
                {translate('text_63e27c56dfe64b846474efb2')}
              </Typography>
              <Typography
                className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                color="grey700"
              >
                {retries}
              </Typography>
            </>
          )}
        </div>

        {response && hasError && (
          <div className="flex flex-col gap-4 pb-12 shadow-b">
            <Typography variant="subhead" color="grey700">
              {translate('text_1746623729674lo13y0oatk9')}
            </Typography>
            <CodeSnippet
              variant="minimal"
              language="json"
              code={response}
              canCopy={false}
              displayHead={false}
            />
          </div>
        )}

        <div className="flex flex-col gap-4 pb-12">
          <Typography variant="subhead" color="grey700">
            {translate('text_1746623729674wq0tach0cop')}
          </Typography>
          <CodeSnippet
            variant="minimal"
            language="json"
            code={JSON.stringify(JSON.parse(payload || ''), null, 2)}
            canCopy
            displayHead={false}
          />
        </div>
      </div>
    </>
  )
}
