import { gql } from '@apollo/client'

import { CodeSnippet } from '~/components/CodeSnippet'
import { Alert, Typography } from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { EventDetailsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment EventDetails on Event {
    id
    code
    transactionId
    timestamp
    receivedAt
    payload
    billableMetricName
    matchBillableMetric
    matchCustomField
    apiClient
    ipAddress
    externalSubscriptionId
    customerTimezone
  }
`

interface EventDetailsProps {
  event: EventDetailsFragment
}

export const EventDetails = ({ event }: EventDetailsProps) => {
  const { translate } = useInternationalization()
  const {
    billableMetricName,
    timestamp,
    receivedAt,
    payload,
    transactionId,
    apiClient,
    code,
    ipAddress,
    matchBillableMetric,
    matchCustomField,
    externalSubscriptionId,
    customerTimezone,
  } = event

  return (
    <>
      <Typography
        className="hidden min-h-14 items-center justify-between px-4 py-2 shadow-b md:flex"
        variant="bodyHl"
        color="textSecondary"
      >
        {code}
      </Typography>

      <div className="flex flex-col gap-12 p-4">
        <div className="grid grid-cols-[140px,_1fr] items-baseline gap-3 pb-12 shadow-b">
          <div className="col-span-2">
            <Typography variant="subhead" color="grey700">
              {translate('text_63ebba5f5160e26242c48bd2')}
            </Typography>
          </div>

          {!matchBillableMetric && (
            <div className="col-span-2">
              <Alert type="warning">{translate('text_6298bd525e359200d5ea01b7')}</Alert>
            </div>
          )}

          {!matchCustomField && (
            <div className="col-span-2">
              <Alert type="warning">{translate('text_6298bd525e359200d5ea0197')}</Alert>
            </div>
          )}

          <Typography className="pt-1" variant="caption">
            {translate('text_6298bd525e359200d5ea01da')}
          </Typography>
          <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
            {billableMetricName}
          </Typography>

          <Typography className="pt-1" variant="caption">
            {translate('text_6298bd525e359200d5ea01c1')}
          </Typography>
          <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
            {code}
          </Typography>

          <Typography className="pt-1" variant="caption">
            {translate('text_6298bd525e359200d5ea01f2')}
          </Typography>
          <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
            {transactionId}
          </Typography>

          <Typography className="pt-1" variant="caption">
            {translate('text_62e0feac0a543924c8f67ae5')}
          </Typography>
          <Typography className="overflow-wrap-anywhere flex min-w-0 max-w-full" color="grey700">
            {externalSubscriptionId}
          </Typography>

          <Typography className="pt-1" variant="caption">
            {translate('text_1730132579304cmiwba11ha6')}
          </Typography>
          <TimezoneDate
            date={receivedAt}
            customerTimezone={customerTimezone}
            mainTimezone="utc0"
            mainDateFormat="LLL. dd, yyyy HH:mm:ss 'UTC'"
          />

          <Typography className="pt-1" variant="caption">
            {translate('text_6298bd525e359200d5ea018f')}
          </Typography>
          <TimezoneDate
            date={timestamp}
            customerTimezone={customerTimezone}
            mainTimezone="utc0"
            mainDateFormat="LLL. dd, yyyy HH:mm:ss 'UTC'"
          />

          {!!ipAddress && (
            <>
              <Typography className="pt-1" variant="caption">
                {translate('text_6298bd525e359200d5ea020a')}
              </Typography>
              <Typography
                className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                color="grey700"
              >
                {ipAddress}
              </Typography>
            </>
          )}

          {!!apiClient && (
            <>
              <Typography className="pt-1" variant="caption">
                {translate('text_6298bd525e359200d5ea0222')}
              </Typography>
              <Typography
                className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                color="grey700"
              >
                {apiClient}
              </Typography>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 pb-12">
          <Typography variant="subhead" color="grey700">
            {translate('text_1746623729674wq0tach0cop')}
          </Typography>
          <CodeSnippet
            variant="minimal"
            language="json"
            code={JSON.stringify(payload, null, 2)}
            displayHead={false}
            canCopy
          />
        </div>
      </div>
    </>
  )
}
