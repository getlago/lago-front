import { gql } from '@apollo/client'
import { useMemo, useState } from 'react'

import { useHeldData } from '~/components/realtimeUsage/useHeldData'
import { useRealtimeUsageClock } from '~/components/realtimeUsage/useRealtimeUsageClock'
import { windowStartOf } from '~/components/realtimeUsage/utils'
import { intlFormatDateTime, TimeFormat } from '~/core/timezone'
import {
  AggregationTypeEnum,
  TimezoneEnum,
  useGetSubscriptionChargesForRealtimeUsageQuery,
  useGetSubscriptionHourlyUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { DEFAULT_WINDOW_IN_HOURS } from './constants'
import { RealtimeUsageState } from './types'
import { isRealtimeCharge } from './utils'

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
    $toDatetime: ISO8601DateTime
  ) {
    subscriptionHourlyUsage(
      subscriptionId: $subscriptionId
      chargeId: $chargeId
      fromDatetime: $fromDatetime
      toDatetime: $toDatetime
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

// Everything both realtime views need from the pipeline: which charge is on
// screen, which window it covers, whether it is polling, and the hours the
// API served for that combination. The views differ in how they draw it, not
// in what they ask for.
export const useRealtimeUsage = (subscriptionId: string): RealtimeUsageState => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const isEnabled = !!organization?.realtimeUsageEnabled
  const [chargeId, setChargeId] = useState<string>('')
  const [windowInHours, setWindowInHours] = useState<number>(DEFAULT_WINDOW_IN_HOURS)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(0)

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

  const { now } = useRealtimeUsageClock({
    autoRefreshSeconds,
    resetKey: `${selectedChargeId}-${windowInHours}`,
  })

  const { data, loading, error } = useGetSubscriptionHourlyUsageQuery({
    variables: {
      subscriptionId,
      chargeId: selectedChargeId,
      fromDatetime: windowStartOf(now, windowInHours, timezone),
      toDatetime: now.toUTC().toISO(),
    },
    skip: !selectedCharge,
    fetchPolicy: 'no-cache',
  })

  const servedData = data?.subscriptionHourlyUsage
  // Held across a window change too, so the columns rescale from the hours on screen.
  const { data: usage, isHeld } = useHeldData(servedData, selectedChargeId, !!error)

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
    isSwitchingScale: isHeld && usage?.hours.length !== windowInHours,
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
