import { useState } from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import {
  formatUnits,
  RealtimeUsage,
  RealtimeUsageControls,
  RealtimeUsageEmpty,
  RealtimeUsageHeader,
  SegmentedControl,
  useRealtimeUsage,
} from '~/components/subscriptions/realtimeUsage'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

export const REALTIME_LANES_LIVE_TEST_ID = 'realtime-usage-lanes-live'
export const REALTIME_LANES_EMPTY_TEST_ID = 'realtime-usage-lanes-empty'
export const REALTIME_LANES_SORT_TEST_ID = 'realtime-usage-lanes-sort'
export const REALTIME_LANES_LIST_TEST_ID = 'realtime-usage-lanes-list'
export const REALTIME_LANES_LANE_TEST_ID = 'realtime-usage-lane'
export const REALTIME_LANES_LANE_NAME_TEST_ID = 'realtime-usage-lane-name'

// Small multiples, not a stack: every lane carries the same single hue and
// identity comes from the row label, so a twentieth filter costs no palette.
// The charge default (events matching no filter) is grey because it is the
// absence of a filter rather than another one.
const LANE_COLOR = theme.palette.primary.main
const DEFAULT_LANE_COLOR = theme.palette.grey[500]

const DEFAULT_KEY = 'default'
const SPARK_VIEWBOX_WIDTH = 240
const LANE_SPARK_HEIGHT = 34
const TOTAL_SPARK_HEIGHT = 52

type SortMode = 'volume' | 'name'

type Lane = {
  key: string
  label: string
  color: string
  values: number[]
  sum: number
  now: number
  peak: number
}

export const SubscriptionRealtimeUsageLanes = ({
  subscriptionId,
}: {
  subscriptionId: string
}): JSX.Element | null => {
  const { translate } = useInternationalization()
  const state = useRealtimeUsage(subscriptionId)
  const [sort, setSort] = useState<SortMode>('volume')

  const { usage, isLoading, unitLabel, formatHour, windowInHours } = state

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
      return <RealtimeUsageEmpty testId={REALTIME_LANES_EMPTY_TEST_ID} />
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
              translate={translate}
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
                  translate={translate}
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
        <RealtimeUsageControls state={state} testIdPrefix="realtime-usage-lanes">
          <SegmentedControl<SortMode>
            dataTest={REALTIME_LANES_SORT_TEST_ID}
            label={translate('text_1787616557790hgby8ktaxck')}
            value={sort}
            onChange={setSort}
            options={[
              { value: 'volume', label: translate('text_17876165577909qyyzp0vcfk') },
              { value: 'name', label: translate('text_1787616557790b7igyxgm29h') },
            ]}
          />
        </RealtimeUsageControls>

        {renderContent()}
      </div>
    </section>
  )
}

// One lane per filter the window knows about, gap-filled by the API, so a
// filter that went quiet keeps its row and draws a flat line instead of
// disappearing from the list.
const buildLanes = (usage: RealtimeUsage, translate: TranslateFunc, sort: SortMode): Lane[] => {
  const lanes: Lane[] = usage.filters.map((filter) => {
    const key = filter.chargeFilterId || DEFAULT_KEY
    const values = usage.hours.map((hour) =>
      hour.breakdown
        .filter((breakdown) => (breakdown.chargeFilterId || DEFAULT_KEY) === key)
        .reduce((total, breakdown) => total + breakdown.units, 0),
    )

    return {
      key,
      label: filter.invoiceDisplayName || translate('text_17876075026872bdz1e5aeep'),
      color: filter.chargeFilterId ? LANE_COLOR : DEFAULT_LANE_COLOR,
      values,
      sum: values.reduce((total, value) => total + value, 0),
      now: values[values.length - 1] || 0,
      peak: Math.max(...values, 0),
    }
  })

  return lanes.sort((a, b) => (sort === 'volume' ? b.sum - a.sum : a.label.localeCompare(b.label)))
}

const LaneHeading = ({
  children,
  className,
}: {
  children: string
  className?: string
}): JSX.Element => (
  <Typography
    variant="note"
    color="grey500"
    className={tw('uppercase tracking-wider', className)}
    noWrap
  >
    {children}
  </Typography>
)

// Each lane is scaled to its own peak: the shape is the subject here, and
// magnitudes are read from the "now" and share columns instead. The right
// edge is the current hour, still filling, so it is marked rather than drawn
// as if it were settled.
const Sparkline = ({
  values,
  color,
  height,
  label,
  hourLabels,
  unitLabel,
  translate,
}: {
  values: number[]
  color: string
  height: number
  label: string
  hourLabels: string[]
  unitLabel: string
  translate: TranslateFunc
}): JSX.Element => {
  const [hovered, setHovered] = useState<number | undefined>(undefined)

  const peak = Math.max(...values, 1)
  const lastIndex = values.length - 1
  const step = SPARK_VIEWBOX_WIDTH / (lastIndex || 1)
  const pointY = (value: number): number => height - 2 - (value / peak) * (height - 6)
  const line = values
    .map(
      (value, index) =>
        `${index ? 'L' : 'M'}${(index * step).toFixed(1)},${pointY(value).toFixed(1)}`,
    )
    .join('')

  const track = (event: React.PointerEvent<HTMLDivElement>): void => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = bounds.width ? (event.clientX - bounds.left) / bounds.width : 0

    setHovered(Math.min(lastIndex, Math.max(0, Math.round(ratio * lastIndex))))
  }

  const hoveredLeft = `${((hovered || 0) / (lastIndex || 1)) * 100}%`

  return (
    <div
      className="relative min-w-0"
      onPointerMove={track}
      onPointerLeave={() => setHovered(undefined)}
    >
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${SPARK_VIEWBOX_WIDTH} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        className="block"
      >
        <path
          d={`${line}L${SPARK_VIEWBOX_WIDTH},${height}L0,${height}Z`}
          fill={color}
          opacity={0.1}
        />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={SPARK_VIEWBOX_WIDTH}
          x2={SPARK_VIEWBOX_WIDTH}
          y1={2}
          y2={height}
          stroke={color}
          strokeWidth={2}
          opacity={0.35}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {hovered !== undefined && (
        <>
          {/* Positioned in HTML rather than SVG: the viewBox is stretched on
              the x axis, so a circle drawn inside it would render as an
              ellipse and a guide line would land off the cursor. */}
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-grey-300"
            style={{ left: hoveredLeft }}
          />
          <div
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: hoveredLeft,
              top: pointY(values[hovered]),
              backgroundColor: color,
            }}
          />
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 flex min-w-40 -translate-x-1/2 flex-col gap-1 rounded-xl bg-grey-700 p-3"
            style={{ left: hoveredLeft }}
          >
            <Typography variant="captionHl" color="white" noWrap>
              {hovered === lastIndex
                ? `${hourLabels[hovered]} · ${translate('text_17876075026871lkywkgyybv')}`
                : hourLabels[hovered]}
            </Typography>
            <div className="flex items-center justify-between gap-4">
              <Typography variant="caption" color="white" noWrap>
                {label}
              </Typography>
              <Typography variant="captionHl" color="white" noWrap>
                {`${formatUnits(values[hovered])} ${unitLabel}`}
              </Typography>
            </div>
            <Typography variant="caption" color="grey400" noWrap>
              {translate('text_17876165577903v2axlbti3m', { peak: formatUnits(peak) })}
            </Typography>
          </div>
        </>
      )}
    </div>
  )
}
