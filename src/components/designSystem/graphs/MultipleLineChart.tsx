import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { NameType, Payload, ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { Typography } from '~/components/designSystem'
import {
  multipleLineChartFakeData,
  multipleLineChartFakeLines,
  multipleLineChartLoadingFakeData,
  multipleLineChartLoadingFakeLines,
} from '~/components/designSystem/graphs/fixtures'
import { ChartWrapper } from '~/components/layouts/Charts'
import {
  bigNumberShortenNotationFormater,
  getCurrencySymbol,
  intlFormatNumber,
} from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { CurrencyEnum, TimezoneEnum } from '~/generated/graphql'
import { theme } from '~/styles'

import { calculateYAxisDomain, checkOnlyZeroValues } from './utils'

const LOADING_TICK_SIZE = 32

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

type DataItem = {
  [key: string]: unknown
}

type MultipleLineChartLineVisibleOnGraph<T> = {
  dataKey: DotNestedKeys<T>
  tooltipLabel: string
  colorHex: string
  hideOnGraph?: never
}
type MultipleLineChartLineHiddenFromGraph<T> = {
  dataKey: DotNestedKeys<T>
  tooltipLabel: string
  hideOnGraph: true
  colorHex?: never
}
export type MultipleLineChartLine<T> =
  | MultipleLineChartLineVisibleOnGraph<T>
  | MultipleLineChartLineHiddenFromGraph<T>

type MultipleLineChartProps<T> = {
  blur?: boolean
  currency: CurrencyEnum
  data?: T[]
  hoveredDataIndex?: number | undefined
  lines: Array<MultipleLineChartLine<T>>
  loading: boolean
  xAxisDataKey: DotNestedKeys<T>
  setClickedDataIndex?: Dispatch<SetStateAction<number | undefined>>
  setHoverDataIndex?: Dispatch<SetStateAction<number | undefined>>
}

type CustomTooltipProps<T> = {
  includeHidden: boolean
  active: boolean
  currency: CurrencyEnum
  payload: Payload<ValueType & { payload: T }, NameType>[] | undefined
  lines: Array<MultipleLineChartLine<T>>
  xAxisDataKey: DotNestedKeys<T>
}

const CustomTooltip = <T,>({
  active,
  currency,
  payload,
  lines,
  xAxisDataKey,
}: CustomTooltipProps<T>): JSX.Element | null => {
  if (active && payload && payload.length) {
    const labelValue: string | undefined = payload?.[0].payload[xAxisDataKey]

    return (
      <>
        {!!labelValue && (
          <Typography className="mb-3" variant="captionHl" color="white">
            {formatDateToTZ(labelValue, TimezoneEnum.TzUtc, 'LLL yyyy')}
          </Typography>
        )}

        <div className="flex flex-col gap-2">
          {lines.map((line, lineIndex) => {
            const associatedPayload = payload.find((p) => p?.dataKey === line.dataKey)

            return (
              <div
                key={`multiple-line-chart-custom-tooltip-${lineIndex}`}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {!!line.colorHex && (
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: line.colorHex,
                      }}
                    ></div>
                  )}
                  <Typography variant="caption" color="white" noWrap>
                    {line.tooltipLabel || line.dataKey}
                  </Typography>
                </div>
                <Typography variant="caption" color="white" noWrap>
                  {intlFormatNumber(
                    deserializeAmount(String(associatedPayload?.value) || 0, currency),
                    {
                      currencyDisplay: 'symbol',
                      currency: currency,
                    },
                  )}
                </Typography>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return null
}

const MultipleLineChart = <T extends DataItem>({
  blur,
  currency,
  data,
  hoveredDataIndex,
  lines,
  loading,
  xAxisDataKey,
  setClickedDataIndex,
  setHoverDataIndex,
}: MultipleLineChartProps<T>) => {
  const [localHoverDataIndexFallback, setLocalHoverDataIndexFallback] = useState<
    number | undefined
  >(undefined)

  const { localData, localLines } = useMemo(() => {
    if (loading) {
      return {
        localData: multipleLineChartLoadingFakeData as unknown as T[],
        localLines: multipleLineChartLoadingFakeLines as unknown as Array<MultipleLineChartLine<T>>,
      }
    } else if (!!blur) {
      return {
        localData: multipleLineChartFakeData as unknown as T[],
        localLines: multipleLineChartFakeLines as unknown as Array<MultipleLineChartLine<T>>,
      }
    }

    return {
      localData: data,
      localLines: lines,
    }
  }, [blur, data, lines, loading])

  // This makes sure that tiiltip is shown on hover even if setHoverDataIndex is not defined: if chart is used as a standalone component
  const { localHoverDataIndex, localSetHoverDataIndex } = useMemo(() => {
    if (!setHoverDataIndex) {
      return {
        localHoverDataIndex: localHoverDataIndexFallback,
        localSetHoverDataIndex: setLocalHoverDataIndexFallback,
      }
    }

    return {
      localHoverDataIndex: hoveredDataIndex,
      localSetHoverDataIndex: setHoverDataIndex,
    }
  }, [setHoverDataIndex, hoveredDataIndex, localHoverDataIndexFallback])

  const yTooltipPosition = useMemo(() => {
    const DEFAULT_TOOLTIP_Y_GAP = 60
    const TOOLTIP_INNER_LINE_HEIGHT = 31

    return -(DEFAULT_TOOLTIP_Y_GAP + (lines.length || 0) * TOOLTIP_INNER_LINE_HEIGHT)
  }, [lines.length])

  const hasOnlyZeroValues: boolean = useMemo(() => {
    if (!localData?.length || loading) {
      return true
    }

    return checkOnlyZeroValues(localData, localLines)
  }, [localData, localLines, loading])

  const yAxisDomain: [number, number] = useMemo(
    () => calculateYAxisDomain(localData, localLines, hasOnlyZeroValues),
    [localData, localLines, hasOnlyZeroValues],
  )

  return (
    <ChartWrapper className="rounded-xl bg-white" blur={blur}>
      <ResponsiveContainer width="100%" height={232}>
        <LineChart
          margin={{
            top: 1,
            left: 1,
            right: getCurrencySymbol(currency).length > 1 ? 12 : 2,
            bottom: -2,
          }}
          width={500}
          height={300}
          data={localData}
          onClick={
            !!setClickedDataIndex
              ? (event) =>
                  typeof event?.activeTooltipIndex === 'number' &&
                  setClickedDataIndex(event.activeTooltipIndex)
              : undefined
          }
          onMouseMove={
            !!localSetHoverDataIndex
              ? (event) => {
                  typeof event?.activeTooltipIndex === 'number' &&
                    event.activeTooltipIndex !== localHoverDataIndex &&
                    localSetHoverDataIndex(event.activeTooltipIndex)
                }
              : undefined
          }
          onMouseLeave={() => {
            localSetHoverDataIndex(undefined)
          }}
        >
          <XAxis
            axisLine={true}
            tickLine={false}
            dataKey={xAxisDataKey}
            stroke={theme.palette.grey[300]}
            interval={0}
            domain={['dataMin', 'dataMax']}
            tick={(props: { x: number; y: number; index: number; payload: { value: string } }) => {
              const { x, y, payload, index } = props

              if (index !== 0 && index !== (data?.length || 0) - 1) {
                return <></>
              }

              return (
                <>
                  {!loading ? (
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
                        {formatDateToTZ(payload?.value, TimezoneEnum.TzUtc, 'LLL dd yyyy')}
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${index !== 0 ? x - LOADING_TICK_SIZE : x},${y + 6})`}>
                      <rect
                        width={LOADING_TICK_SIZE}
                        height={12}
                        rx={6}
                        fill={theme.palette.grey[100]}
                      ></rect>
                    </g>
                  )}
                </>
              )
            }}
          />
          <YAxis
            allowDataOverflow
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

          {localLines?.map((line) => {
            return (
              <Line
                key={`multiple-line-chart-line-${line.dataKey}`}
                type="linear"
                hide={line.hideOnGraph}
                dataKey={line.dataKey}
                stroke={line.colorHex}
                strokeWidth={2}
                isAnimationActive={false}
              />
            )
          })}
          {!loading && (
            <RechartTooltip
              defaultIndex={localHoverDataIndex}
              active={typeof localHoverDataIndex === 'number'}
              includeHidden={true}
              cursor={{
                stroke: `${theme.palette.grey[500]}`,
                strokeDasharray: '2 2',
              }}
              offset={0}
              position={{ y: yTooltipPosition }}
              content={({ active, payload, includeHidden }) => (
                <div className="min-w-90 rounded-xl bg-grey-700 px-4 py-3">
                  {!!payload && (
                    <CustomTooltip
                      active={active || false}
                      currency={currency}
                      lines={lines}
                      // Payload does not cast T type from data, so we have to manually override
                      payload={payload as unknown as CustomTooltipProps<T>['payload']}
                      xAxisDataKey={xAxisDataKey}
                      includeHidden={!!includeHidden}
                    />
                  )}
                </div>
              )}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export default MultipleLineChart
