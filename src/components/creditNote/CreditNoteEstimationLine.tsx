import { Icon } from 'lago-design-system'
import { FC } from 'react'

import { Skeleton, Tooltip, Typography, TypographyProps } from '~/components/designSystem'

interface CreditNoteEstimationLineProps {
  label: string
  labelColor?: TypographyProps['color']
  value: string
  loading?: boolean
  tooltipContent?: string
}

export const CreditNoteEstimationLine: FC<CreditNoteEstimationLineProps> = ({
  label,
  labelColor = 'grey700',
  value,
  loading,
  tooltipContent,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Typography variant="bodyHl" color={labelColor}>
          {label}
        </Typography>
        {tooltipContent && (
          <Tooltip className="flex h-5 items-end" placement="top-start" title={tooltipContent}>
            <Icon name="info-circle" />
          </Tooltip>
        )}
      </div>

      {loading && <Skeleton variant="text" className="w-22" />}

      {!loading && <Typography color="grey700">{value}</Typography>}
    </div>
  )
}
