import { Stack } from '@mui/material'
import { Avatar, Icon, IconName } from 'lago-design-system'

import { Skeleton, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

const STATUS_SIZE = 12

type TIntegrationItemLineProps = {
  description: string
  icon: IconName
  label: string
  loading: boolean
  mappingInfos?: {
    id?: string
    name: string
  }
  onMappingClick?: () => void
}

const IntegrationItemLine = ({
  description,
  icon,
  label,
  loading,
  mappingInfos,
  onMappingClick,
}: TIntegrationItemLineProps) => {
  const { translate } = useInternationalization()

  if (loading) {
    return (
      <div className="flex h-nav w-full items-center justify-between px-12 py-3 shadow-b">
        <Stack direction="row" alignItems="center" gap={3} sx={{ flex: 1 }}>
          <Skeleton variant="connectorAvatar" size="big" />
          <Stack sx={{ flex: 1 }}>
            <Skeleton variant="text" className="w-45" />
            <Skeleton variant="text" className="w-20" />
          </Stack>
        </Stack>
        <Skeleton variant="text" className="w-50" />
      </div>
    )
  }

  return (
    <button
      className="flex min-h-nav w-full items-center justify-between rounded-none px-12 py-3 text-left shadow-b hover:bg-grey-100"
      onClick={onMappingClick}
    >
      <Stack direction="row" alignItems="center" gap={3}>
        <Avatar size="big" variant="connector">
          <Icon name={icon} color="dark" />
        </Avatar>

        <Stack>
          <Typography variant="bodyHl" color="grey700">
            {label}
          </Typography>
          <Typography variant="caption" color="grey600">
            {description}
          </Typography>
        </Stack>
      </Stack>

      <div className="flex min-h-8 items-center gap-2 rounded-xl border border-grey-300 bg-grey-100 px-2 py-1">
        <svg height={STATUS_SIZE} width={STATUS_SIZE} className="shrink-0">
          <circle
            cx="6"
            cy="6"
            r="6"
            fill={!!mappingInfos ? theme.palette.success[600] : theme.palette.error[600]}
          />
        </svg>

        <Typography variant="captionHl" color="grey700">
          {!!mappingInfos
            ? `${mappingInfos.name}${!!mappingInfos.id ? ` (${mappingInfos.id})` : ''} `
            : translate('text_6630e3210c13c500cd398e9a')}
        </Typography>
      </div>
    </button>
  )
}

export default IntegrationItemLine
