import { gql } from '@apollo/client'
import { Fragment } from 'react'
import { useParams } from 'react-router-dom'

import { CodeSnippet } from '~/components/CodeSnippet'
import { Button, Skeleton, Status, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { statusWebhookMapping } from '~/core/constants/statusWebhookMapping'
import {
  useGetSingleWebhookLogQuery,
  useRetryWebhookMutation,
  WebhookStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFormatterDateHelper } from '~/hooks/helpers/useFormatterDateHelper'

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

  query getSingleWebhookLog($id: ID!) {
    webhook(id: $id) {
      id
      ...WebhookLogDetails
    }
  }
`

export const WebhookLogDetails = ({ goBack }: { goBack: () => void }) => {
  const { logId } = useParams<{ webhookId: string; logId: string }>()
  const { formattedDateTimeWithSecondsOrgaTZ } = useFormatterDateHelper()
  const { translate } = useInternationalization()

  const { data, loading } = useGetSingleWebhookLogQuery({
    variables: { id: logId || '' },
    skip: !logId,
  })

  const { id, webhookType, updatedAt, endpoint, retries, response, status, httpStatus, payload } =
    data?.webhook || {}

  const [retry] = useRetryWebhookMutation({
    variables: { input: { id: id || '' } },
    async onCompleted({ retryWebhook }) {
      if (!!retryWebhook) {
        addToast({
          severity: 'success',
          translateKey: 'text_63f79ddae2e0b1892bb4955c',
        })
      }
    },
  })

  const hasError = status === WebhookStatusEnum.Failed

  return (
    <>
      <Typography
        className="hidden min-h-14 items-center justify-between px-4 py-2 shadow-b md:flex"
        variant="bodyHl"
        color="textSecondary"
      >
        {loading ? (
          <Skeleton variant="text" textVariant="bodyHl" className="w-30" />
        ) : (
          <>
            {webhookType}
            {hasError && (
              <Button variant="quaternary" onClick={async () => await retry()}>
                {translate('text_63e27c56dfe64b846474efa3')}
              </Button>
            )}
          </>
        )}
      </Typography>

      {loading && (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton variant="text" textVariant="subhead1" className="w-40" />
          <div className="grid grid-cols-[140px,_1fr] items-baseline gap-x-8 gap-y-3">
            {[...Array(3)].map((_, index) => (
              <Fragment key={index}>
                <Skeleton variant="text" textVariant="caption" className="w-20" />
                <Skeleton variant="text" textVariant="caption" className="w-full" />
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-12 p-4">
          <div className="grid grid-cols-[140px,_1fr] items-baseline gap-3 pb-12 shadow-b">
            <div className="col-span-2 flex items-center justify-between">
              <Typography variant="subhead1" color="grey700">
                {translate('text_174662372967481i3t20hzfv')}
              </Typography>
              <Button
                icon="close"
                variant="quaternary"
                size="small"
                onClick={() => goBack()}
                className="md:hidden"
              />
            </div>

            <Typography className="pt-1" variant="caption">
              {translate('text_63e27c56dfe64b846474ef72')}
            </Typography>
            <div className="flex items-center gap-2">
              <Typography
                className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                color="grey700"
              >
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
              {formattedDateTimeWithSecondsOrgaTZ(updatedAt)}
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

            {retries && retries > 0 && (
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
              <Typography variant="subhead1" color="grey700">
                {translate('text_1746623729674lo13y0oatk9')}
              </Typography>
              <CodeSnippet
                variant="minimal"
                language="json"
                code={response}
                canCopy
                displayHead={false}
              />
            </div>
          )}

          {Object.keys(payload ?? {}).length > 0 && (
            <div className="flex flex-col gap-4 pb-12">
              <Typography variant="subhead1" color="grey700">
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
          )}
        </div>
      )}
    </>
  )
}
