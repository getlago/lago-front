import { Stack } from '@mui/material'
import styled from 'styled-components'

import { Avatar, Icon, IconName, Skeleton, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

const STATUS_SIZE = 12

type TIntegrationItemLineProps = {
  description: string
  icon: IconName
  label: string
  loading: boolean
  mappingInfos?: {
    id: string
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
      <SkeletonWrapper>
        <Stack direction="row" alignItems="center" gap={3} sx={{ flex: 1 }}>
          <Skeleton variant="connectorAvatar" size="big" />
          <Stack sx={{ flex: 1 }}>
            <Skeleton variant="text" width={180} height={12} marginBottom={10} />
            <Skeleton variant="text" width={80} height={12} />
          </Stack>
        </Stack>

        <Skeleton variant="text" width={200} height={26} />
      </SkeletonWrapper>
    )
  }

  return (
    <ItemLine onClick={onMappingClick}>
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

      <StatusContainer>
        <svg height={STATUS_SIZE} width={STATUS_SIZE}>
          <circle
            cx="6"
            cy="6"
            r="6"
            fill={!!mappingInfos ? theme.palette.success[600] : theme.palette.error[600]}
          />
        </svg>

        <Typography variant="captionHl" color="grey700">
          {!!mappingInfos
            ? `${mappingInfos.name} (${mappingInfos.id})`
            : translate('text_6630e3210c13c500cd398e9a')}
        </Typography>
      </StatusContainer>
    </ItemLine>
  )
}

export default IntegrationItemLine

const ItemLine = styled.div`
  min-height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} ${theme.spacing(12)};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
  cursor: pointer;

  &:hover {
    background-color: ${theme.palette.grey[100]};
  }
`

const SkeletonWrapper = styled.div`
  height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} ${theme.spacing(12)};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${theme.palette.grey[100]};
  padding: ${theme.spacing(1)} ${theme.spacing(2)};
  box-sizing: border-box;
  border-radius: ${theme.shape.borderRadius}px;
  min-height: ${theme.spacing(8)};
  gap: ${theme.spacing(2)};
  outline: 1px solid ${theme.palette.grey[300]};
  outline-offset: -1px;

  svg {
    flex-shrink: 0;
  }
`
