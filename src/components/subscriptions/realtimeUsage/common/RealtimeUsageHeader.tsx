import { Icon } from 'lago-design-system'

import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type RealtimeUsageHeaderProps = {
  title: string
  tooltip: string
  isLive: boolean
  liveTestId: string
}

export const RealtimeUsageHeader = ({
  title,
  tooltip,
  isLive,
  liveTestId,
}: RealtimeUsageHeaderProps): JSX.Element => {
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
