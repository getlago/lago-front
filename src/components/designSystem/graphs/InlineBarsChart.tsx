import { Bar, BarChart, BarProps, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'

import { theme } from '~/styles'

type InlineBarsChartProps = {
  data: Record<string, number>[]
  colors: string[]
  hoveredBarId?: string
}

type TShapeBarProps = Omit<BarProps, 'name' | 'opacity'>

const BarWithBorder = (props: TShapeBarProps & { opacity: number }) => {
  const { fill, x, y, width, height, opacity } = props

  return (
    <g>
      <rect opacity={opacity} x={x} y={y} width={width} height={height} stroke="none" fill={fill} />
      {x !== 0 && (
        <rect x={x} y={y} width={2} height={12} stroke="none" fill={theme.palette.common.white} />
      )}
    </g>
  )
}

BarWithBorder.displayName = 'BarWithBorder'

const InlineBarsChart = ({ data, colors, hoveredBarId }: InlineBarsChartProps) => {
  return (
    <Wrapper>
      <ResponsiveContainer width="100%" height={12}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          barCategoryGap={0}
        >
          <XAxis hide axisLine={false} tickLine={false} type="number" domain={[0, 'dataMax']} />
          <YAxis hide axisLine={false} tickLine={false} dataKey="name" type="category" />
          {Object.keys(data[0]).map((key, index) => (
            <Bar
              key={`inline-bar-${key}`}
              isAnimationActive={false}
              dataKey={key}
              stackId="a"
              fill={colors[index]}
              shape={(props: TShapeBarProps) => (
                <BarWithBorder
                  opacity={!hoveredBarId || hoveredBarId === key ? 1 : 0.2}
                  {...props}
                />
              )}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Wrapper>
  )
}

export default InlineBarsChart

const Wrapper = styled.div`
  background-color: #fff;
  border-radius: 12px;
  /* Used to round the bars */
  overflow: hidden;

  /* NOTE: The two definition above are a hack https://github.com/recharts/recharts/issues/172 */
  .recharts-wrapper {
    width: 100% !important;
  }

  .recharts-surface {
    width: 100% !important;
    display: block;
  }
`
