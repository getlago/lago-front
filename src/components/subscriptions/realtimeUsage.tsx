import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { ReactNode, useEffect, useMemo, useState } from 'react'

import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { intlFormatDateTime, TimeFormat } from '~/core/timezone'
import {
  AggregationTypeEnum,
  GetSubscriptionChargesForRealtimeUsageQuery,
  GetSubscriptionHourlyUsageQuery,
  TimezoneEnum,
  useGetSubscriptionChargesForRealtimeUsageQuery,
  useGetSubscriptionHourlyUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

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
          billableMetric {
            id
            code
            name
            aggregationType
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
        units
        eventsCount
      }
      hours {
        time
        units
        eventsCount
        breakdown {
          chargeFilterId
          units
        }
      }
    }
  }
`

export type RealtimeUsage = GetSubscriptionHourlyUsageQuery['subscriptionHourlyUsage']
export type RealtimeUsageCharge = NonNullable<
  NonNullable<GetSubscriptionChargesForRealtimeUsageQuery['subscription']>['plan']['charges']
>[number]

// Auto-refresh is off by default: polling is opt-in, so an idle usage tab
// stays idle.
export const AUTO_REFRESH_OPTIONS = [0, 1, 5, 10]
// Fewer hours on the axis leave more room per column, so the bar thickens
// with the scale instead of stranding the columns in whitespace. Recharts
// interpolates width as well as height, so the widening is part of the
// rescale rather than a jump once it lands.
export const WINDOWS = [
  { hours: 6, barSize: 56 },
  { hours: 12, barSize: 36 },
  { hours: 24, barSize: 24 },
]

const WINDOW_REFRESH_INTERVAL = 60000
const REALTIME_AGGREGATION_TYPES = [AggregationTypeEnum.CountAgg, AggregationTypeEnum.SumAgg]

export const formatUnits = (value: number): string =>
  intlFormatNumber(value, { style: 'decimal', maximumFractionDigits: 2 })

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const startOfHourMinusHours = (hours: number): string => {
  const date = new Date()

  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() - (hours - 1))

  return date.toISOString()
}

export type RealtimeUsageState = {
  charges: RealtimeUsageCharge[]
  selectedCharge?: RealtimeUsageCharge
  setChargeId: (chargeId: string) => void
  windowInHours: number
  changeWindow: (hours: number) => void
  autoRefreshSeconds: number
  setAutoRefreshSeconds: (seconds: number) => void
  usage?: RealtimeUsage
  isLoading: boolean
  hasUsage: boolean
  hasRealtimeCharge: boolean
  isSwitchingScale: boolean
  timezone: TimezoneEnum
  unitLabel: string
  formatHour: (time: string) => string
}

// Everything both realtime views need from the pipeline: which charge is on
// screen, which window it covers, whether it is polling, and the hours the
// API served for that combination. The views differ in how they draw it, not
// in what they ask for.
export const useRealtimeUsage = (subscriptionId: string): RealtimeUsageState => {
  const { translate } = useInternationalization()
  const [chargeId, setChargeId] = useState<string>('')
  const [windowInHours, setWindowInHours] = useState<number>(24)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(0)
  const [fromDatetime, setFromDatetime] = useState<string>(() =>
    startOfHourMinusHours(windowInHours),
  )

  // The window start only moves when the selection changes or the hour turns;
  // recomputing it on every poll would refetch on every tick.
  useEffect(() => {
    const refresh = (): void => setFromDatetime(startOfHourMinusHours(windowInHours))

    refresh()

    const interval = setInterval(refresh, WINDOW_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [windowInHours])

  const { data: subscriptionData, loading: subscriptionLoading } =
    useGetSubscriptionChargesForRealtimeUsageQuery({
      variables: { subscriptionId },
      skip: !subscriptionId,
    })

  const charges = useMemo(
    () =>
      (subscriptionData?.subscription?.plan?.charges || []).filter((charge) =>
        REALTIME_AGGREGATION_TYPES.includes(charge.billableMetric.aggregationType),
      ),
    [subscriptionData],
  )

  const selectedCharge = charges.find((charge) => charge.id === chargeId) || charges[0]
  const timezone = (subscriptionData?.subscription?.customer?.applicableTimezone ||
    TimezoneEnum.TzUtc) as TimezoneEnum

  const { data, loading, previousData } = useGetSubscriptionHourlyUsageQuery({
    variables: {
      subscriptionId,
      chargeId: selectedCharge?.id || '',
      fromDatetime,
    },
    skip: !selectedCharge,
    pollInterval: autoRefreshSeconds * 1000,
  })

  // Hold the previous render while a poll is in flight: no skeleton flash and
  // no layout jump every five seconds.
  const usage = data?.subscriptionHourlyUsage || previousData?.subscriptionHourlyUsage

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
    hasUsage: (usage?.filters.length || 0) > 0,
    hasRealtimeCharge: subscriptionLoading || charges.length > 0,
    // The served window still lags the requested one while the new scale loads.
    isSwitchingScale:
      !!usage && new Date(usage.fromDatetime).getTime() !== new Date(fromDatetime).getTime(),
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

export const RealtimeUsageHeader = ({
  title,
  tooltip,
  isLive,
  liveTestId,
}: {
  title: string
  tooltip: string
  isLive: boolean
  liveTestId: string
}): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex h-10 flex-row items-start shadow-b">
      <div className="flex flex-row items-center gap-2">
        <Typography variant="subhead1" color="grey700" noWrap>
          {title}
        </Typography>
        <Tooltip placement="top-start" title={tooltip}>
          <Icon name="info-circle" />
        </Tooltip>
        {isLive && (
          <span
            className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5"
            data-test={liveTestId}
          >
            <span className="size-1.5 animate-pulse rounded-full bg-green-600 motion-reduce:animate-none" />
            <Typography variant="captionHl" color="success600">
              {translate('text_1787607502687jr0jliz0c3k')}
            </Typography>
          </span>
        )}
      </div>
    </div>
  )
}

// Charge selection on the left, view-specific controls then window and
// polling on the right. Both views take the same decisions in the same
// place, so switching between them below the fold is not a relearn.
export const RealtimeUsageControls = ({
  state,
  testIdPrefix,
  children,
}: {
  state: RealtimeUsageState
  testIdPrefix: string
  children?: ReactNode
}): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex flex-row flex-wrap items-center gap-2">
        {state.charges.length > 1 &&
          state.charges.map((charge) => (
            <button
              key={`${testIdPrefix}-charge-${charge.id}`}
              type="button"
              data-test={`${testIdPrefix}-charge-tab-${charge.billableMetric.code}`}
              onClick={() => state.setChargeId(charge.id)}
              className={tw(
                'rounded-lg border border-grey-300 px-3 py-1 text-sm text-grey-600 hover:bg-grey-100',
                charge.id === state.selectedCharge?.id &&
                  'border-blue-600 bg-blue-100 text-blue-600',
              )}
            >
              {charge.invoiceDisplayName || charge.billableMetric.name}
            </button>
          ))}
      </div>

      <div className="ml-auto flex flex-row flex-wrap items-center gap-x-5 gap-y-2">
        {children}

        <SegmentedControl
          dataTest={`${testIdPrefix}-time-range`}
          label={translate('text_1787610177631jhuc7lxfw1v')}
          value={state.windowInHours}
          onChange={state.changeWindow}
          options={WINDOWS.map(({ hours }) => ({ value: hours, label: `${hours}h` }))}
        />

        <SegmentedControl
          dataTest={`${testIdPrefix}-auto-refresh`}
          label={translate('text_17876098439600jp8nt3z0hk')}
          value={state.autoRefreshSeconds}
          onChange={state.setAutoRefreshSeconds}
          options={AUTO_REFRESH_OPTIONS.map((value) => ({
            value,
            label: value === 0 ? translate('text_1787609843960bopfeje8bho') : `${value}s`,
          }))}
        />
      </div>
    </div>
  )
}

export const RealtimeUsageEmpty = ({ testId }: { testId: string }): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-1 py-8 text-center" data-test={testId}>
      <Typography variant="subhead2" color="grey700">
        {translate('text_1787607502687zw3kwy13xlm')}
      </Typography>
      <Typography variant="caption" color="grey600">
        {translate('text_17876075026878y6buigdffk')}
      </Typography>
    </div>
  )
}

export const SegmentedControl = <T extends number | string>({
  label,
  options,
  value,
  onChange,
  dataTest,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  dataTest: string
}): JSX.Element => (
  <div className="flex flex-row items-center gap-2" data-test={dataTest}>
    <Typography variant="captionHl" color="grey500" noWrap>
      {label}
    </Typography>
    <div className="flex flex-row items-center overflow-hidden rounded-lg border border-grey-300">
      {options.map((option) => (
        <button
          key={`${dataTest}-${option.value}`}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={tw(
            'border-r border-grey-300 px-2 py-1 text-sm text-grey-600 last:border-r-0 hover:bg-grey-100',
            option.value === value && 'bg-blue-100 font-medium text-blue-600',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
)
