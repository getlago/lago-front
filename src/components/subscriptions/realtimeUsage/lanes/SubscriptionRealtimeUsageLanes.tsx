import { useState } from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { ButtonSelector } from '~/components/form'
import {
  REALTIME_USAGE_CONTROL_CLASSNAME,
  RealtimeUsageControls,
} from '~/components/subscriptions/realtimeUsage/common/RealtimeUsageControls'
import { RealtimeUsageEmpty } from '~/components/subscriptions/realtimeUsage/common/RealtimeUsageEmpty'
import { RealtimeUsageHeader } from '~/components/subscriptions/realtimeUsage/common/RealtimeUsageHeader'
import { useRealtimeUsage } from '~/components/subscriptions/realtimeUsage/common/useRealtimeUsage'
import { formatUnits } from '~/components/subscriptions/realtimeUsage/common/utils'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import {
  LANE_COLOR,
  LANE_SPARK_HEIGHT,
  REALTIME_LANES_EMPTY_TEST_ID,
  REALTIME_LANES_LANE_NAME_TEST_ID,
  REALTIME_LANES_LANE_TEST_ID,
  REALTIME_LANES_LIST_TEST_ID,
  REALTIME_LANES_LIVE_TEST_ID,
  REALTIME_LANES_SORT_TEST_ID,
  REALTIME_LANES_TEST_ID_PREFIX,
  SORT_MODES,
  TOTAL_SPARK_HEIGHT,
} from './constants'
import { LaneHeading } from './LaneHeading'
import { Sparkline } from './Sparkline'
import { SortMode } from './types'
import { buildLanes } from './utils'

export const SubscriptionRealtimeUsageLanes = ({
  subscriptionId,
}: {
  subscriptionId: string
}): JSX.Element | null => {
  const { translate } = useInternationalization()
  const state = useRealtimeUsage(subscriptionId)
  const [sort, setSort] = useState<SortMode>('volume')

  const { usage, isLoading, unitLabel, formatHour, windowInHours } = state

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'volume', label: translate('text_17876165577909qyyzp0vcfk') },
    { value: 'name', label: translate('text_1787616557790b7igyxgm29h') },
  ]

  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" className="w-40" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-full" />
        </div>
      )
    }

    if (!state.hasUsage || !usage) {
      return <RealtimeUsageEmpty testId={REALTIME_LANES_EMPTY_TEST_ID} hasError={state.hasError} />
    }

    const lanes = buildLanes(usage, translate, sort)
    const grand = lanes.reduce((total, lane) => total + lane.sum, 0)
    const leader = [...lanes].sort((a, b) => b.sum - a.sum)[0]
    const totals = usage.hours.map((_, index) =>
      lanes.reduce((total, lane) => total + lane.values[index], 0),
    )
    const hourLabels = usage.hours.map((hour) => formatHour(hour.time))

    return (
      <div
        className={tw(
          'flex flex-col gap-4 transition-all duration-200 ease-out motion-reduce:transition-none',
          state.isSwitchingScale && 'translate-y-1 opacity-40',
        )}
      >
        <div className="flex flex-row flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey500" noWrap>
              {translate('text_1787616557790ttd8jllb5eu', { hours: windowInHours })}
            </Typography>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Typography variant="headline" color="grey700" noWrap>
                {formatUnits(grand)}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {unitLabel}
              </Typography>
              {!!grand && (
                <Typography variant="caption" color="grey600" noWrap>
                  {translate('text_1787616557790yx0vfkqv320', {
                    filter: leader.label,
                    percent: Math.round((leader.sum / grand) * 100),
                  })}
                </Typography>
              )}
            </div>
          </div>

          <div className="min-w-64 max-w-104 flex-1">
            <Sparkline
              values={totals}
              color={LANE_COLOR}
              height={TOTAL_SPARK_HEIGHT}
              label={translate('text_1787616557790ttd8jllb5eu', { hours: windowInHours })}
              hourLabels={hourLabels}
              unitLabel={unitLabel}
            />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-[104px_minmax(0,1fr)_66px] gap-3.5 border-b border-grey-200 px-2 pb-2 md:grid-cols-[168px_minmax(0,1fr)_96px_108px]">
            <LaneHeading>{translate('text_1787616557790kqpmtk7pft2')}</LaneHeading>
            <LaneHeading>{translate('text_17876165577906xxrvo5wfou')}</LaneHeading>
            <LaneHeading className="text-right">
              {`${translate('text_1787616557790s6wvuoqwwrj')} · ${unitLabel}`}
            </LaneHeading>
            <LaneHeading className="hidden md:block">
              {translate('text_1787616557790xdw9c52dzlc')}
            </LaneHeading>
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5" data-test={REALTIME_LANES_LIST_TEST_ID}>
            {lanes.map((lane) => (
              <div
                key={`realtime-usage-lane-${lane.key}`}
                data-test={REALTIME_LANES_LANE_TEST_ID}
                className="grid grid-cols-[104px_minmax(0,1fr)_66px] items-center gap-3.5 rounded-lg p-2 hover:bg-grey-100 md:grid-cols-[168px_minmax(0,1fr)_96px_108px]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: lane.color }}
                  />
                  <Typography
                    variant="caption"
                    color="grey700"
                    data-test={REALTIME_LANES_LANE_NAME_TEST_ID}
                    noWrap
                  >
                    {lane.label}
                  </Typography>
                </div>

                <Sparkline
                  values={lane.values}
                  color={lane.color}
                  height={LANE_SPARK_HEIGHT}
                  label={lane.label}
                  hourLabels={hourLabels}
                  unitLabel={unitLabel}
                />

                <Typography variant="captionHl" color="grey700" className="text-right" noWrap>
                  {formatUnits(lane.now)}
                </Typography>

                <div className="hidden items-center gap-2 md:flex">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-blue-100">
                    <div
                      className="h-full rounded-sm transition-[width] duration-300 ease-out motion-reduce:transition-none"
                      style={{
                        backgroundColor: lane.color,
                        width: `${grand ? Math.max(1, (lane.sum / grand) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <Typography variant="caption" color="grey600" className="w-9 text-right" noWrap>
                    {`${grand ? Math.round((lane.sum / grand) * 100) : 0}%`}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Typography variant="caption" color="grey500">
          {translate('text_17876165577900f24twmsxnb')}
        </Typography>
      </div>
    )
  }

  if (!state.hasRealtimeCharge) {
    return null
  }

  return (
    <section>
      <RealtimeUsageHeader
        title={translate('text_17876165577890xzllhaav4q')}
        tooltip={translate('text_1787616557790j468aer5cgq')}
        isLive={!isLoading && state.autoRefreshSeconds > 0}
        liveTestId={REALTIME_LANES_LIVE_TEST_ID}
      />

      <div className="flex flex-col gap-4 bg-white py-6">
        <RealtimeUsageControls state={state} testIdPrefix={REALTIME_LANES_TEST_ID_PREFIX}>
          <ButtonSelector
            data-test={REALTIME_LANES_SORT_TEST_ID}
            className={REALTIME_USAGE_CONTROL_CLASSNAME}
            label={translate('text_1787616557790hgby8ktaxck')}
            options={sortOptions}
            value={sort}
            onChange={(value) => {
              const mode = SORT_MODES.find((candidate) => candidate === value)

              if (mode) setSort(mode)
            }}
          />
        </RealtimeUsageControls>

        {renderContent()}
      </div>
    </section>
  )
}
