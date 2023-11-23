import { memo } from 'react'
import {
  Area,
  CartesianGrid,
  AreaChart as RechartAreaChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import styled, { css } from 'styled-components'

import { Typography } from '~/components/designSystem'
import {
  bigNumberShortenNotationFormater,
  getCurrencySymbol,
} from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { theme } from '~/styles'

import { AreaChartDataType } from './types'

const LOADING_TICK_SIZE = 32

type CustomTooltipProps = {
  active?: boolean
  payload?: {
    payload?: {
      axisName?: string | null
      value?: number | null
      tooltipLabel?: string | null
    }
  }[]
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps): JSX.Element | null => {
  if (active && payload && payload.length) {
    return (
      <HoverTooltip variant="caption" color="white">
        {payload[0]?.payload?.tooltipLabel}
      </HoverTooltip>
    )
  }

  return null
}

type AreaChartProps = {
  blur: boolean
  data: AreaChartDataType[]
  loading?: boolean
  hasOnlyZeroValues?: boolean
  currency: CurrencyEnum
}

const AreaChart = memo(({ blur, currency, data, hasOnlyZeroValues, loading }: AreaChartProps) => {
  return (
    <Wrapper $blur={blur}>
      <ResponsiveContainer width="100%" height={112}>
        <RechartAreaChart
          margin={{
            top: 1,
            left: 1,
            right: getCurrencySymbol(currency).length > 1 ? 12 : 2,
            bottom: -6,
          }}
          data={data}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.palette.primary[200]} stopOpacity={1} />
              <stop offset="100%" stopColor={theme.palette.primary[200]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            axisLine={true}
            stroke={theme.palette.grey[200]}
            tickLine={false}
            interval={0}
            domain={['dataMin', 'dataMax']}
            dataKey="axisName"
            tick={(props: { x: number; y: number; index: number; payload: { value: string } }) => {
              const { x, y, payload, index } = props

              if (index !== 0 && index !== data.length - 1) {
                return <></>
              }

              return (
                <>
                  {!loading ? (
                    <g transform={`translate(${x},${y + 10})`}>
                      <text
                        fill={theme.palette.grey[600]}
                        style={{
                          fontFamily: 'Inter',
                          fontSize: '12px',
                          fontStyle: 'normal',
                          fontWeight: '400',
                          lineHeight: '16px',
                          textAnchor: index === 0 ? 'start' : 'end',
                        }}
                      >
                        {payload?.value}
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${index !== 0 ? x - LOADING_TICK_SIZE : x},${y + 2})`}>
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
            height={87}
            axisLine={false}
            stroke={theme.palette.grey[600]}
            tickLine={false}
            interval={0}
            domain={[0, 'dataMax + 10']}
            orientation="right"
            dataKey="value"
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
                          fontSize: '12px',
                          fontStyle: 'normal',
                          fontWeight: '400',
                          lineHeight: '16px',
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
          <CartesianGrid
            horizontal={<>{/* Hide hirizontal line */}</>}
            stroke={theme.palette.grey[200]}
          />
          <Area
            isAnimationActive={false}
            dataKey="value"
            stroke={!loading ? theme.palette.primary[600] : theme.palette.grey[200]}
            fill={!loading ? 'url(#colorUv)' : 'transparent'}
          />
          {!loading && (
            <RechartTooltip
              isAnimationActive={false}
              cursor={{ stroke: `${theme.palette.primary[600]}` }}
              position={{ y: -45 }}
              content={<CustomTooltip />}
            />
          )}
        </RechartAreaChart>
      </ResponsiveContainer>
    </Wrapper>
  )
})

AreaChart.displayName = 'AreaChart'

export default AreaChart

const Wrapper = styled.div<{ $blur: boolean }>`
  circle.recharts-dot {
    display: none;
  }

  /* NOTE: The two definition bellow are a hack https://github.com/recharts/recharts/issues/172 */
  .recharts-wrapper {
    width: 100% !important;
  }

  .recharts-surface {
    width: 100% !important;
    display: block;
  }

  ${({ $blur }) =>
    $blur &&
    css`
      filter: blur(4px);
      pointer-events: none;
    `}
`

const HoverTooltip = styled(Typography)`
  width: fit-content;
  box-sizing: border-box;
  border-radius: 12px;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  background-color: ${theme.palette.grey[700]};
`
