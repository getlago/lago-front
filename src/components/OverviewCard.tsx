import { FC } from 'react'

import { Icon, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { Card } from '~/styles'

interface OverviewCardProps {
  title: string
  tooltipContent?: string
  content: string
  caption: string
  isAccentContent?: boolean
  isLoading?: boolean
}

export const OverviewCard: FC<OverviewCardProps> = ({
  title,
  tooltipContent,
  content,
  caption,
  isAccentContent,
  isLoading,
}) => {
  return (
    <Card $padding={6} $flexItem $childSpacing={4}>
      {isLoading ? (
        <div className="h-22">
          <Skeleton className="mb-8 w-22" variant="text" />
          <div className="flex flex-col gap-4">
            <Skeleton className="w-50" variant="text" />
            <Skeleton className="w-12" variant="text" />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Typography variant="captionHl">{title}</Typography>
            {tooltipContent && (
              <Tooltip className="flex h-5 items-end" placement="top-start" title={tooltipContent}>
                <Icon name="info-circle" />
              </Tooltip>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Typography variant="subhead" color={isAccentContent ? 'warning700' : 'grey700'}>
              {content}
            </Typography>
            <Typography variant="caption">{caption}</Typography>
          </div>
        </>
      )}
    </Card>
  )
}
