import { PointerEvent, useState } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { formatUnits } from '~/components/subscriptions/realtimeUsage/common/utils'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { SPARK_VIEWBOX_WIDTH } from './constants'

type SparklineProps = {
  values: number[]
  color: string
  height: number
  label: string
  hourLabels: string[]
  unitLabel: string
}

// Each lane is scaled to its own peak: the shape is the subject here, and
// magnitudes are read from the "now" and share columns instead. The right
// edge is the current hour, still filling, so it is marked rather than drawn
// as if it were settled.
export const Sparkline = ({
  values,
  color,
  height,
  label,
  hourLabels,
  unitLabel,
}: SparklineProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [hovered, setHovered] = useState<number | undefined>(undefined)

  const peak = Math.max(0, ...values)
  const lastIndex = values.length - 1
  const step = SPARK_VIEWBOX_WIDTH / (lastIndex || 1)
  // A flat-zero lane still needs a divisor to draw its line on the baseline.
  const pointY = (value: number): number => height - 2 - (value / (peak || 1)) * (height - 6)
  const line = values
    .map(
      (value, index) =>
        `${index ? 'L' : 'M'}${(index * step).toFixed(1)},${pointY(value).toFixed(1)}`,
    )
    .join('')

  const track = (event: PointerEvent<HTMLDivElement>): void => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = bounds.width ? (event.clientX - bounds.left) / bounds.width : 0

    setHovered(Math.min(lastIndex, Math.max(0, Math.round(ratio * lastIndex))))
  }

  const hoveredLeft = `${((hovered || 0) / (lastIndex || 1)) * 100}%`
  const hoveredHourLabel =
    hovered === lastIndex
      ? `${hourLabels[hovered]} · ${translate('text_17876075026871lkywkgyybv')}`
      : hourLabels[hovered || 0]

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
              {hoveredHourLabel}
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
