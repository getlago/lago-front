import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { notifyOnToBoolean } from '~/components/alerts/utils'
import { Alert } from '~/components/designSystem/Alert'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { Link, UPDATE_WEBHOOK_ROUTE } from '~/core/router'
import {
  EventTypeEnum,
  ThresholdInput,
  useGetWebhookEndpointsForResolvedAlertsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { isListeningToAllEvents } from '~/hooks/useWebhookEventTypes'

gql`
  query getWebhookEndpointsForResolvedAlerts {
    webhookEndpoints {
      collection {
        id
        name
        webhookUrl
        eventTypes
      }
    }
  }
`

export const RESOLVED_WEBHOOK_WARNING_TEST_ID = 'resolved-webhook-warning'

export const ResolvedWebhookWarning = ({
  thresholds,
}: {
  thresholds: ThresholdInput[]
}): JSX.Element | null => {
  const { translate } = useInternationalization()
  const notifiesWhenResolved = thresholds.some((threshold) => notifyOnToBoolean(threshold.notifyOn))

  // Not cache-first: endpoints are edited on another page, and a fixed whitelist must clear this.
  const { data, loading, error } = useGetWebhookEndpointsForResolvedAlertsQuery({
    skip: !notifiesWhenResolved,
    fetchPolicy: 'cache-and-network',
  })

  if (!notifiesWhenResolved) return null

  if (loading) {
    return (
      <div role="status" aria-busy="true" className="h-8">
        <Spinner />
      </div>
    )
  }

  if (error || !data) return null

  const endpointsMissingEvent = data.webhookEndpoints.collection.filter(
    ({ eventTypes }) =>
      !isListeningToAllEvents(eventTypes) && !eventTypes?.includes(EventTypeEnum.AlertResolved),
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
