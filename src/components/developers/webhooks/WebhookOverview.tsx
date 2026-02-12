import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { GetWebhookEndpointQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useWebhookEventTypes } from '~/hooks/useWebhookEventTypes'

type WebhookOverviewProps = {
  webhook: GetWebhookEndpointQuery['webhookEndpoint'] | undefined
  loading: boolean
  signatureLabel: string
}

export const WebhookOverview = ({ webhook, loading, signatureLabel }: WebhookOverviewProps) => {
  const { translate } = useInternationalization()
  const { getEventDisplayInfo, loading: eventTypesLoading } = useWebhookEventTypes()

  const { displayedEvents, eventCount } = getEventDisplayInfo(webhook?.eventTypes)

  if (loading || eventTypesLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton variant="text" className="w-40" textVariant="subhead1" />
          <Skeleton variant="text" className="w-80" />
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-20" />
            <Skeleton variant="text" className="w-30" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-20" />
            <Skeleton variant="text" className="w-30" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1770903515281cpcq0pj4lxh')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_1770903515281wkfhtiti00a')}
        </Typography>
      </div>

      <div className="flex gap-8">
        <div className="flex flex-col gap-1">
          <Typography variant="caption" color="grey600">
            {translate('text_6419c64eace749372fc72b0f')}
          </Typography>
          <Typography variant="body" color="grey700">
            {webhook?.name || '-'}
          </Typography>
        </div>
        <div className="flex flex-col gap-1">
          <Typography variant="caption" color="grey600">
            {translate('text_17709035152819kiyigswn18')}
          </Typography>
          <Typography variant="body" color="grey700">
            {signatureLabel}
          </Typography>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Typography variant="caption" color="grey600">
          {translate('text_6271200984178801ba8bdf22')}
        </Typography>
        <Typography variant="body" color="grey700">
          {webhook?.webhookUrl}
        </Typography>
      </div>

      <div className="flex flex-col gap-1">
        <Typography variant="caption" color="grey600">
          {translate('text_1770903515281cixrd5unzhz', { count: eventCount }, eventCount)}
        </Typography>
        {displayedEvents.length > 0 && (
          <div className="flex flex-col">
            {displayedEvents.map((event) => (
              <Typography key={event} variant="body" color="grey700">
                {event}
              </Typography>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
