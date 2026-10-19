import { generatePath } from 'react-router'

import { notifyOnToBoolean } from '~/components/alerts/utils'
import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { Link, UPDATE_WEBHOOK_ROUTE } from '~/core/router'
import { ThresholdInput, useGetWebhookListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { isListeningToAllEvents } from '~/hooks/useWebhookEventTypes'

// Swap for `EventTypeEnum.AlertResolved` once the API schema exposes the event.
export const ALERT_RESOLVED_EVENT_KEY = 'alert_resolved'

export const RESOLVED_WEBHOOK_WARNING_TEST_ID = 'resolved-webhook-warning'

export const ResolvedWebhookWarning = ({ thresholds }: { thresholds: ThresholdInput[] }) => {
  const { translate } = useInternationalization()
  const notifiesWhenResolved = thresholds.some((threshold) => notifyOnToBoolean(threshold.notifyOn))

  const { data } = useGetWebhookListQuery({ skip: !notifiesWhenResolved })

  if (!notifiesWhenResolved) return null

  const endpointsMissingEvent = (data?.webhookEndpoints.collection ?? []).filter(
    ({ eventTypes }) => {
      if (isListeningToAllEvents(eventTypes)) return false

      const listenedEvents: string[] = eventTypes ?? []

      return !listenedEvents.includes(ALERT_RESOLVED_EVENT_KEY)
    },
  )

  if (!endpointsMissingEvent.length) return null

  return (
    <Alert type="warning" data-test={RESOLVED_WEBHOOK_WARNING_TEST_ID}>
      <div className="flex flex-col gap-1">
        <Typography variant="body" color="grey700">
          {translate('text_1792439710542z5bi1sj7k1j')}
        </Typography>
        <ul className="flex flex-col gap-1">
          {endpointsMissingEvent.map(({ id, name, webhookUrl }) => (
            <li key={id}>
              <Link
                className="text-blue-600 hover:underline"
                to={generatePath(UPDATE_WEBHOOK_ROUTE, { webhookId: id })}
              >
                {name || webhookUrl}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Alert>
  )
}
