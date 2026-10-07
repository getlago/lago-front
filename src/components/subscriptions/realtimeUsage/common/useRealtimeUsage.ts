import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useState } from 'react'

import { intlFormatDateTime, TimeFormat } from '~/core/timezone'
import {
  AggregationTypeEnum,
  FeatureFlagEnum,
  TimezoneEnum,
  useGetSubscriptionChargesForRealtimeUsageQuery,
  useGetSubscriptionHourlyUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { DEFAULT_WINDOW_IN_HOURS, WINDOW_REFRESH_INTERVAL } from './constants'
import { RealtimeUsage, RealtimeUsageState } from './types'
import { isRealtimeCharge, windowStartOf } from './utils'

gql`
  query getSubscriptionChargesForRealtimeUsage($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      customer {
        id
        applicableTimezone
      }
      plan {
        id
        charges {
          id
          invoiceDisplayName
          chargeModel
          payInAdvance
          prorated
          billableMetric {
            id
            code
            name
            aggregationType
            recurring
            expression
          }
        }
      }
    }
  }

  query getSubscriptionHourlyUsage(
    $subscriptionId: ID!
    $chargeId: ID!
    $fromDatetime: ISO8601DateTime
  ) {
    subscriptionHourlyUsage(
      subscriptionId: $subscriptionId
      chargeId: $chargeId
      fromDatetime: $fromDatetime
    ) {
      fromDatetime
      toDatetime
      timezone
      aggregationType
      filters {
        chargeFilterId
        invoiceDisplayName
        values
        other
        units
        eventsCount
      }
      hours {
        time
        units
        eventsCount
        breakdown {
          chargeFilterId
          other
          units
        }
      }
    }
  }
`

type ServedUsage = { chargeId: string; usage: RealtimeUsage }

// Everything both realtime views need from the pipeline: which charge is on
// screen, which window it covers, whether it is polling, and the hours the
// API served for that combination. The views differ in how they draw it, not
// in what they ask for.
export const useRealtimeUsage = (subscriptionId: string): RealtimeUsageState => {
  const { translate } = useInternationalization()
  const { hasFeatureFlag } = useOrganizationInfos()
  const isEnabled = hasFeatureFlag(FeatureFlagEnum.RealtimeUsage)
  const [chargeId, setChargeId] = useState<string>('')
  const [windowInHours, setWindowInHours] = useState<number>(DEFAULT_WINDOW_IN_HOURS)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(0)
  const [now, setNow] = useState<DateTime>(() => DateTime.now())
  const [servedUsage, setServedUsage] = useState<ServedUsage>()

  useEffect(() => {
    const interval = setInterval(() => setNow(DateTime.now()), WINDOW_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useGetSubscriptionChargesForRealtimeUsageQuery({
    variables: { subscriptionId },
    skip: !subscriptionId || !isEnabled,
  })

  const charges = useMemo(
    () => (subscriptionData?.subscription?.plan?.charges || []).filter(isRealtimeCharge),
    [subscriptionData],
  )

  const selectedCharge = charges.find((charge) => charge.id === chargeId) || charges[0]
  const selectedChargeId = selectedCharge?.id || ''
  const timezone = subscriptionData?.subscription?.customer.applicableTimezone || TimezoneEnum.TzUtc

  // Only moves when the hour turns: the minute tick yields the same string, so
  // Apollo sees unchanged variables and does not refetch.
  const fromDatetime = windowStartOf(now, windowInHours, timezone)

  const { data, loading, error } = useGetSubscriptionHourlyUsageQuery({
    variables: { subscriptionId, chargeId: selectedChargeId, fromDatetime },
    skip: !selectedCharge,
    pollInterval: autoRefreshSeconds * 1000,
  })

  const servedData = data?.subscriptionHourlyUsage

  if (servedData && servedUsage?.usage !== servedData) {
    setServedUsage({ chargeId: selectedChargeId, usage: servedData })
  }

  // Hold the last served hours while new ones are in flight, but only for the
  // charge they belong to and never past a failed request: stale hours would
  // otherwise sit under the new selection's label.
  const heldUsage =
    !error && servedUsage?.chargeId === selectedChargeId ? servedUsage.usage : undefined
  const usage = servedData || heldUsage

  return {
    charges,
    selectedCharge,
    setChargeId,
    windowInHours,
    changeWindow: (value: number): void => {
      if (value === windowInHours) return

      setWindowInHours(value)
    },
    autoRefreshSeconds,
    setAutoRefreshSeconds,
    usage,
    isLoading: (subscriptionLoading || loading) && !usage,
    hasError: (!!subscriptionError || !!error) && !usage,
    hasUsage: (usage?.filters.length || 0) > 0,
    hasRealtimeCharge:
      isEnabled && (subscriptionLoading || !!subscriptionError || charges.length > 0),
    // New variables clear `data` until they are served, while a poll keeps it.
    isSwitchingScale: !servedData && !!heldUsage,
    timezone,
    unitLabel: translate(
      usage?.aggregationType === AggregationTypeEnum.CountAgg
        ? 'text_1787607502687bbm16iot9di'
        : 'text_1787607502687zc1gdrqwnzj',
    ),
    formatHour: (time: string): string =>
      intlFormatDateTime(time, { timezone, formatTime: TimeFormat.TIME_24_SIMPLE }).time,
  }
}
