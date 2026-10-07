import { HourPoint } from './types'
import { seriesValue } from './utils'

type StackedSegmentProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: HourPoint
  seriesKey?: string
  seriesKeys?: string[]
}

// Draws one segment of a stacked column: a 2px gap in the surface color
// separates it from the segment below, and the topmost segment of the column
// carries the rounded cap. The current hour is still filling, so it is drawn
// lighter than the hours that are already closed.
export const StackedSegment = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  payload,
  seriesKey,
  seriesKeys = [],
}: StackedSegmentProps): JSX.Element | null => {
  if (height <= 0 || !seriesKey) return null

  const topSeriesKey = [...seriesKeys].reverse().find((key) => seriesValue(payload, key) > 0)
  const isTop = topSeriesKey === seriesKey
  const radius = isTop ? Math.min(4, width / 2, height) : 0
  const gap = height > 3 ? 2 : 0

  return (
    <path
      d={`M${x},${y + height - gap}L${x},${y + radius}Q${x},${y} ${x + radius},${y}L${
        x + width - radius
      },${y}Q${x + width},${y} ${x + width},${y + radius}L${x + width},${y + height - gap}Z`}
      fill={fill}
      opacity={payload?.isPartial ? 0.5 : 1}
    />
  )
}
