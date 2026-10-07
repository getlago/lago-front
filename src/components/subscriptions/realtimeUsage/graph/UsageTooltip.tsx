import { Typography } from '~/components/designSystem/Typography'
import { formatUnits } from '~/components/subscriptions/realtimeUsage/common/utils'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { HourPoint, Series } from './types'
import { seriesValue, totalOf } from './utils'

type UsageTooltipProps = {
  active: boolean
  point?: HourPoint
  series: Series[]
  unitLabel: string
  formatHour: (time: string) => string
}

export const UsageTooltip = ({
  active,
  point,
  series,
  unitLabel,
  formatHour,
}: UsageTooltipProps): JSX.Element | null => {
  const { translate } = useInternationalization()

  if (!active || !point) return null

  const suffix = point.isPartial ? ` · ${translate('text_17876075026871lkywkgyybv')}` : ''

  return (
    <div className="flex min-w-50 flex-col gap-2 rounded-xl bg-grey-700 p-4">
      <Typography variant="captionHl" color="white">
        {`${formatHour(point.time)}${suffix}`}
      </Typography>
      {series.map((serie) => (
        <div
          key={`realtime-usage-tooltip-${serie.key}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: serie.color }} />
            <Typography variant="caption" color="white" noWrap>
              {serie.label}
            </Typography>
          </div>
          <Typography variant="caption" color="white" noWrap>
            {formatUnits(seriesValue(point, serie.key))}
          </Typography>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 border-t border-grey-500 pt-2">
        <Typography variant="caption" color="white" noWrap>
          {translate('text_1787607502687fbugu4gz6xl')}
        </Typography>
        <Typography variant="captionHl" color="white" noWrap>
          {`${formatUnits(totalOf(point, series))} ${unitLabel}`}
        </Typography>
      </div>
    </div>
  )
}
