import { gql } from '@apollo/client'
import { ReactNode } from 'react'

import { CodeSnippet } from '~/components/CodeSnippet'
import { Alert, Icon, Tooltip, Typography } from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { DebuggerEventDetailsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DebuggerEventDetails on Event {
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

interface DebuggerEventDetailsProps {
  event: DebuggerEventDetailsFragment
}

const PropertyItem = ({ label, value }: { label: string; value?: string | ReactNode }) => (
  <>
    <Typography variant="caption">{label}</Typography>

    {!!value ? (
      typeof value === 'string' ? (
        <Typography
          noWrap
          className="flex min-w-0 max-w-full [overflow-wrap:anywhere]"
          color="textSecondary"
        >
          {value}
        </Typography>
      ) : (
        <>{value}</>
      )
    ) : null}
  </>
)

export const DebuggerEventDetails = ({ event }: DebuggerEventDetailsProps) => {
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
        className="hidden min-h-18 items-center justify-between px-8 py-0 shadow-b md:flex"
        variant="bodyHl"
        color="textSecondary"
      >
        {billableMetricName}
      </Typography>

      <div className="grid grid-cols-[140px,_1fr] items-baseline gap-3 p-8 shadow-b">
        <div className="col-span-2">
          <Typography variant="captionHl" color="grey700">
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

        <PropertyItem
          label={translate('text_1730132579304cmiwba11ha6')}
          value={
            <TimezoneDate
              date={receivedAt}
              customerTimezone={customerTimezone}
              mainTimezone="utc0"
              mainDateFormat="LLL. dd, yyyy HH:mm:ss 'UTC'"
            />
          }
        />

        <PropertyItem
          label={translate('text_6298bd525e359200d5ea018f')}
          value={
            <TimezoneDate
              date={timestamp}
              customerTimezone={customerTimezone}
              mainTimezone="utc0"
              mainDateFormat="LLL. dd, yyyy HH:mm:ss 'UTC'"
            />
          }
        />

        <PropertyItem
          label={translate('text_62e0feac0a543924c8f67ae5')}
          value={externalSubscriptionId}
        />

        <PropertyItem label={translate('text_6298bd525e359200d5ea01c1')} value={code} />

        <PropertyItem
          label={translate('text_6298bd525e359200d5ea01da')}
          value={billableMetricName}
        />

        <PropertyItem
          label={translate('text_6298bd525e359200d5ea01f2')}
          value={
            <Typography
              noWrap
              className="flex min-w-0 max-w-full [overflow-wrap:anywhere]"
              color="textSecondary"
            >
              {transactionId}
              <Tooltip
                className="flex h-5 items-end"
                placement="bottom-start"
                title={translate('text_6298bd525e359200d5ea0257')}
              >
                <Icon className="ml-1 mt-1" color="dark" name="info-circle" />
              </Tooltip>
            </Typography>
          }
        />

        {!!ipAddress && (
          <PropertyItem label={translate('text_6298bd525e359200d5ea020a')} value={ipAddress} />
        )}

        {!!apiClient && (
          <PropertyItem label={translate('text_6298bd525e359200d5ea0222')} value={apiClient} />
        )}
      </div>

      <div className="ml-px flex-1 bg-grey-100 pb-4 shadow-b">
        <Typography className="pl-8 pt-8" color="grey700" variant="captionHl">
          {translate('text_63ebba678559020885cee000')}
        </Typography>
        <CodeSnippet
          className="h-[calc(100%-52px)] *:pb-0"
          language="json"
          code={JSON.stringify(payload, null, 2)}
          canCopy={false}
          displayHead={false}
        />
      </div>
    </>
  )
}
