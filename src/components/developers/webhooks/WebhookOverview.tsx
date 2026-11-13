import { gql } from '@apollo/client'
import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import {
  GetWebhookEndpointQuery,
  useGetWebhookEndpointSigningKeysQuery,
  WebhookEndpointSignatureAlgoEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useWebhookEventTypes } from '~/hooks/useWebhookEventTypes'

// Test ID constants
export const WEBHOOK_OVERVIEW_CONTAINER_TEST_ID = 'webhook-overview-container'
export const WEBHOOK_OVERVIEW_LOADING_TEST_ID = 'webhook-overview-loading'
export const WEBHOOK_OVERVIEW_NAME_VALUE_TEST_ID = 'webhook-overview-name-value'
export const WEBHOOK_OVERVIEW_SIGNATURE_VALUE_TEST_ID = 'webhook-overview-signature-value'
export const WEBHOOK_OVERVIEW_URL_VALUE_TEST_ID = 'webhook-overview-url-value'
export const WEBHOOK_OVERVIEW_EVENTS_LIST_TEST_ID = 'webhook-overview-events-list'
export const WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID = 'webhook-overview-signing-key-value'
export const WEBHOOK_OVERVIEW_SIGNING_KEY_REVEAL_BUTTON_TEST_ID =
  'webhook-overview-signing-key-reveal-button'

gql`
  query getWebhookEndpointSigningKeys($id: ID!) {
    webhookEndpoint(id: $id) {
      id
      signingKeys {
        id
        secretKey
      }
    }
  }
`

type WebhookOverviewProps = {
  webhook: GetWebhookEndpointQuery['webhookEndpoint'] | undefined
  loading: boolean
  signatureLabel: string
}

export const WebhookOverview = ({ webhook, loading, signatureLabel }: WebhookOverviewProps) => {
  const { translate } = useInternationalization()
  const { getEventDisplayInfo, loading: eventTypesLoading } = useWebhookEventTypes()
  const [showSigningKey, setShowSigningKey] = useState(false)

  const { displayedEvents, eventCount } = getEventDisplayInfo(webhook?.eventTypes)
  // `no-cache` keeps the plaintext key out of the normalized cache, which `cachePersistor`
  // writes to IndexedDB. `nextFetchPolicy` too, as the client defaults it to `cache-first`.
  const { data: signingKeysData } = useGetWebhookEndpointSigningKeysQuery({
    variables: { id: webhook?.id ?? '' },
    skip:
      !webhook?.id || webhook.signatureAlgo !== WebhookEndpointSignatureAlgoEnum.StandardWebhooks,
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })
  const signingKey = signingKeysData?.webhookEndpoint?.signingKeys?.at(-1)?.secretKey

  if (loading || eventTypesLoading) {
    return (
      <div className="flex flex-col gap-6 p-4" data-test={WEBHOOK_OVERVIEW_LOADING_TEST_ID}>
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
    <div className="flex flex-col gap-6 p-4" data-test={WEBHOOK_OVERVIEW_CONTAINER_TEST_ID}>
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
          <Typography
            variant="body"
            color="grey700"
            data-test={WEBHOOK_OVERVIEW_NAME_VALUE_TEST_ID}
          >
            {webhook?.name || '-'}
          </Typography>
        </div>
        <div className="flex flex-col gap-1">
          <Typography variant="caption" color="grey600">
            {translate('text_17709035152819kiyigswn18')}
          </Typography>
          <Typography
            variant="body"
            color="grey700"
            data-test={WEBHOOK_OVERVIEW_SIGNATURE_VALUE_TEST_ID}
          >
            {signatureLabel}
          </Typography>
        </div>
      </div>

      {!!signingKey && (
        <div className="flex flex-col gap-1">
          <Typography variant="caption" color="grey600">
            {translate('text_658567dffff71e31ea5f0d3e')}
          </Typography>
          <div className="flex items-center gap-2">
            <TypographyWithCopy
              variant="body"
              color="grey700"
              masked={!showSigningKey}
              maskOptions={{ dotsCount: 8, visibleChars: 3 }}
              data-test={WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID}
            >
              {signingKey}
            </TypographyWithCopy>
            <Tooltip
              placement="top-start"
              title={translate(
                showSigningKey ? 'text_1731082143943pr83kgzeh86' : 'text_1731082129536sv17ey4g0sk',
              )}
            >
              <Button
                variant="quaternary"
                size="small"
                icon={showSigningKey ? 'eye-hidden' : 'eye'}
                onClick={() => setShowSigningKey((prev) => !prev)}
                data-test={WEBHOOK_OVERVIEW_SIGNING_KEY_REVEAL_BUTTON_TEST_ID}
              />
            </Tooltip>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Typography variant="caption" color="grey600">
          {translate('text_6271200984178801ba8bdf22')}
        </Typography>
        <TypographyWithCopy
          variant="body"
          color="grey700"
          data-test={WEBHOOK_OVERVIEW_URL_VALUE_TEST_ID}
        >
          {webhook?.webhookUrl ?? ''}
        </TypographyWithCopy>
      </div>

      <div className="flex flex-col gap-1">
        <Typography variant="caption" color="grey600">
          {translate('text_1770903515281cixrd5unzhz', { count: eventCount }, eventCount)}
        </Typography>
        {displayedEvents.length > 0 && (
          <div className="flex flex-col" data-test={WEBHOOK_OVERVIEW_EVENTS_LIST_TEST_ID}>
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
