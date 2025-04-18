import debounce from 'lodash/debounce'
import { useCallback, useMemo } from 'react'
import {
  Bar,
  BarChart,
  Customized,
  Tooltip as RechartTooltip,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { NameType, Payload, ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { useAnalyticsState } from '~/components/analytics/AnalyticsStateContext'
import { Typography } from '~/components/designSystem'
import {
  multipleStackedBarChartLoadingFakeBars,
  multipleStackedBarChartLoadingFakeData,
} from '~/components/designSystem/graphs/fixtures'
import { ChartWrapper } from '~/components/layouts/Charts'
import { bigNumberShortenNotationFormater, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { CurrencyEnum, TimeGranularityEnum, TimezoneEnum } from '~/generated/graphql'
import { theme } from '~/styles'

import {
  calculateYAxisDomain,
  checkOnlyZeroValues,
  getItemDateFormatedByTimeGranularity,
} from './utils'

type DataItem = { [key: string]: unknown }

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`
type DotNestedKeys<T> = (
  T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<
        keyof T,
        symbol
      >]
    : ''
) extends infer D
  ? Extract<D, string>
  : never

type StackedBarChartBarVisibleOnGraph<T> = {
  dataKey: DotNestedKeys<T>
  tooltipLabel: string
  colorHex: string
  hideOnGraph?: never
}

type StackedBarChartBarHiddenFromGraph<T> = {
  dataKey: DotNestedKeys<T>
  tooltipLabel: string
  hideOnGraph: true
  colorHex?: never
}

export type StackedBarChartBar<T> =
  | StackedBarChartBarVisibleOnGraph<T>
  | StackedBarChartBarHiddenFromGraph<T>

type StackedBarChartProps<T> = {
  blur?: boolean
  currency: CurrencyEnum
  data?: T[]
  bars: Array<StackedBarChartBar<T>>
  loading: boolean
  xAxisDataKey: DotNestedKeys<T>
  xAxisTickAttributes?: [DotNestedKeys<T>, DotNestedKeys<T>]
  timeGranularity: TimeGranularityEnum
}

const LOADING_TICK_SIZE = 32

type CustomTooltipProps<T> = {
  includeHidden: boolean
  active: boolean
  currency: CurrencyEnum
  payload: Payload<ValueType & { payload: T }, NameType>[] | undefined
  bars: Array<StackedBarChartBar<T>>
  timeGranularity: TimeGranularityEnum
}

const CustomTooltip = <T,>({
  active,
  payload,
  currency,
  bars,
  timeGranularity,
}: CustomTooltipProps<T>) => {
  if (!active || !payload?.length) return null

  const labelValues = payload[0].payload

  return (
    <div className="min-w-90 rounded-xl bg-grey-700 px-4 py-3">
      <Typography className="mb-3" variant="captionHl" color="white">
        {getItemDateFormatedByTimeGranularity({
          item: {
            startOfPeriodDt: labelValues.startOfPeriodDt,
            endOfPeriodDt: labelValues.endOfPeriodDt,
          },
          timeGranularity,
        })}
      </Typography>

      <div className="flex flex-col gap-2">
        {bars.map((bar, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: bar.colorHex }} />
              <Typography variant="caption" color="white" noWrap>
                {bar.tooltipLabel}
              </Typography>
            </div>
            <Typography variant="caption" color="white" noWrap>
              {intlFormatNumber(
                deserializeAmount(String(labelValues[bar.dataKey]) || '0', currency),
                {
                  currencyDisplay: 'symbol',
                  currency,
                },
              )}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}

const StackedBarChart = <T extends DataItem>({
  blur,
  currency,
  data,
  bars,
  loading,
  xAxisDataKey,
  xAxisTickAttributes,
  timeGranularity,
}: StackedBarChartProps<T>) => {
  const { setClickedDataIndex, setHoverDataIndex, hoverDataIndex, handleMouseLeave } =
    useAnalyticsState()

  const handleHoverUpdate = useCallback(
    (index: number | undefined) => {
      setHoverDataIndex(index)
    },
    [setHoverDataIndex],
  )

  const { localData, localBars } = useMemo(() => {
    const fakeData = {
      localData: multipleStackedBarChartLoadingFakeData as unknown as T[],
      localBars: multipleStackedBarChartLoadingFakeBars as unknown as typeof bars,
    }

    if (loading || !data) {
      return fakeData
    } else if (!!blur) {
      return fakeData
    }

    return {
      localData: data.length < 2 ? [...data, ...data] : data,
      localBars: bars,
    }
  }, [blur, data, bars, loading])

  const { localHoverDataIndex } = useMemo(() => {
    return {
      localHoverDataIndex: hoverDataIndex,
    }
  }, [hoverDataIndex])

  const yTooltipPosition = useMemo(() => {
    const DEFAULT_TOOLTIP_Y_GAP = 60
    const TOOLTIP_INNER_LINE_HEIGHT = 31

    return -(DEFAULT_TOOLTIP_Y_GAP + (bars.length || 0) * TOOLTIP_INNER_LINE_HEIGHT)
  }, [bars.length])

  const hasOnlyZeroValues: boolean = useMemo(() => {
    if (!localData?.length || loading) {
      return true
    }

    return checkOnlyZeroValues(localData, localBars)
  }, [localData, localBars, loading])

  const yAxisDomain: [number, number] = useMemo(
    () => calculateYAxisDomain(localData, localBars, hasOnlyZeroValues),
    [localData, localBars, hasOnlyZeroValues],
  )

  return (
    <ChartWrapper className="rounded-xl bg-white" blur={blur}>
      <ResponsiveContainer width="100%" height={232}>
        <BarChart
          data={localData}
          onMouseLeave={handleMouseLeave}
          onMouseMove={useMemo(
            () =>
              debounce((event) => {
                const index = event?.activeTooltipIndex
                if (typeof index === 'number') handleHoverUpdate(index)
              }, 16),
            [handleHoverUpdate],
          )}
          onClick={(event) => {
            if (typeof event?.activeTooltipIndex === 'number') {
              setClickedDataIndex(event.activeTooltipIndex)
            }
          }}
          margin={{ top: 1, left: 1, right: 4, bottom: 0 }}
        >
          <XAxis
            axisLine={true}
            tickLine={false}
            dataKey={xAxisDataKey}
            stroke={theme.palette.grey[300]}
            interval={0}
            domain={['dataMin', 'dataMax']}
            tick={(props: {
              x: number
              y: number
              index: number
              payload: { value: string }
            }): React.ReactElement => {
              const { x, y, index } = props

              if (index !== 0 && index !== (localData?.length || 0) - 1) {
                return <></>
              }

              if (loading) {
                return (
                  <g transform={`translate(${index !== 0 ? x - LOADING_TICK_SIZE : x},${y + 6})`}>
                    <rect
                      width={LOADING_TICK_SIZE}
                      height={12}
                      rx={6}
                      fill={theme.palette.grey[100]}
                    ></rect>
                  </g>
                )
              }

              let dateValue = ''

              if (xAxisTickAttributes && localData?.length) {
                if (index === 0 && localData[0]) {
                  const firstAttributeKey = xAxisTickAttributes[0]
                  const attributeValue = localData[0][firstAttributeKey]

                  dateValue = String(attributeValue)
                } else if (index === localData.length - 1 && localData[localData.length - 1]) {
                  const secondAttributeKey = xAxisTickAttributes[1]
                  const lastItem = localData[localData.length - 1]

                  dateValue = String(lastItem[secondAttributeKey])
                }
              } else {
                dateValue = props.payload?.value || ''
              }

              return (
                <g transform={`translate(${x},${y + 16})`}>
                  <text
                    fill={theme.palette.grey[600]}
                    style={{
                      fontFamily: 'Inter',
                      fontSize: '14px',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      lineHeight: '24px',
                      letterSpacing: '-0.16px',
                      textAnchor: index === 0 ? 'start' : 'end',
                    }}
                  >
                    {formatDateToTZ(dateValue, TimezoneEnum.TzUtc, 'LLL dd yyyy')}
                  </text>
                </g>
              )
            }}
          />
          <YAxis
            allowDataOverflow={false}
            axisLine={false}
            stroke={theme.palette.grey[600]}
            tickLine={false}
            interval={0}
            domain={yAxisDomain}
            orientation="right"
            tick={(props: {
              x: number
              y: number
              index: number
              visibleTicksCount: number
              payload: { value: number }
            }) => {
              const { x, y, payload, index, visibleTicksCount } = props

              if (index !== 0 && index !== visibleTicksCount - 1) {
                return <></>
              }

              return (
                <>
                  {!loading ? (
                    <g transform={`translate(${x},${index !== 0 ? y + 12 : y - 2})`}>
                      <text
                        fill={theme.palette.grey[600]}
                        style={{
                          fontFamily: 'Inter',
                          fontSize: '14px',
                          fontStyle: 'normal',
                          fontWeight: '400',
                          lineHeight: '24px',
                          letterSpacing: '-0.16px',
                        }}
                      >
                        {index !== 0 && hasOnlyZeroValues
                          ? '-'
                          : bigNumberShortenNotationFormater(
                              deserializeAmount(payload.value, currency),
                              {
                                currency,
                              },
                            )}
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${x},${index !== 0 ? y + 2 : y - 12})`}>
                      <rect width={32} height={12} rx={6} fill={theme.palette.grey[100]}></rect>
                    </g>
                  )}
                </>
              )
            }}
          />

          <ReferenceLine
            ifOverflow="extendDomain"
            x={1}
            stroke={theme.palette.grey[200]}
            strokeWidth={2}
          />

          <ReferenceLine
            ifOverflow="extendDomain"
            y={0}
            stroke={theme.palette.grey[200]}
            strokeWidth={1}
          />

          <Customized
            // @ts-ignore
            component={({ xAxisMap, offset, height }) => {
              const xAxis = xAxisMap[Object.keys(xAxisMap)[0]]
              const scale = xAxis?.scale

              if (!scale || !localData?.length) return null

              const lastX =
                scale(localData[localData.length - 1][xAxis.dataKey]) + scale.bandwidth()

              return (
                <line
                  x1={lastX}
                  x2={lastX}
                  y1={offset.top}
                  y2={height - offset.bottom}
                  stroke={theme.palette.grey[200]}
                  strokeWidth={1}
                />
              )
            }}
          />
          {localData?.map((item, index) => (
            <ReferenceLine
              key={`ref-line-${index}`}
              x={item[xAxisDataKey] as number | string}
              stroke={theme.palette.grey[200]}
              strokeWidth={1}
            />
          ))}
          {!loading && (
            <RechartTooltip
              defaultIndex={localHoverDataIndex}
              cursor={false}
              active={typeof localHoverDataIndex === 'number'}
              includeHidden={true}
              offset={0}
              position={{ y: yTooltipPosition }}
              content={({ active, payload, includeHidden }) => (
                <div className="min-w-90 rounded-xl bg-grey-700 px-4 py-3">
                  {!!payload && (
                    <CustomTooltip
                      active={active || false}
                      currency={currency}
                      bars={bars}
                      payload={payload as unknown as CustomTooltipProps<T>['payload']}
                      timeGranularity={timeGranularity}
                      includeHidden={!!includeHidden}
                    />
                  )}
                </div>
              )}
            />
          )}
          {typeof localHoverDataIndex === 'number' && (
            <>
              <Customized
                // @ts-ignore
                component={({ xAxisMap, yAxisMap }) => {
                  const xAxis = xAxisMap[Object.keys(xAxisMap)[0]]
                  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]]
                  const xValue = data?.[localHoverDataIndex]?.[xAxisDataKey]

                  if (!xAxis || !xValue || typeof xAxis.scale !== 'function') return null

                  const x = xAxis.scale(xValue)
                  const bandwidth = xAxis.bandSize ?? 0

                  if (typeof x !== 'number' || !yAxis) return null

                  return (
                    <line
                      x1={x + bandwidth / 2}
                      x2={x + bandwidth / 2}
                      y1={yAxis.y}
                      y2={yAxis.y + yAxis.height}
                      stroke={theme.palette.primary[200]}
                      strokeWidth={2}
                    />
                  )
                }}
              />
            </>
          )}
          {localBars.map((line) => (
            <Bar
              key={line.dataKey}
              dataKey={line.dataKey}
              stackId="stack"
              fill={line.colorHex}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export default StackedBarChart
