import { Stack } from '@mui/material'
import { FC } from 'react'
import styled from 'styled-components'

import { Icon, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { Card, theme } from '~/styles'

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
        <SkeletonWrapper>
          <Skeleton width={90} variant="text" />
          <Stack gap={4}>
            <Skeleton width={200} variant="text" />
            <Skeleton width={50} variant="text" />
          </Stack>
        </SkeletonWrapper>
      ) : (
        <>
          <CardHeader>
            <Typography variant="captionHl">{title}</Typography>
            {tooltipContent && (
              <Tooltip placement="top-start" title={tooltipContent}>
                <Icon name="info-circle" />
              </Tooltip>
            )}
          </CardHeader>

          <Stack gap={1}>
            <Typography variant="subhead1" color={isAccentContent ? 'warning700' : 'grey700'}>
              {content}
            </Typography>
            <Typography variant="caption">{caption}</Typography>
          </Stack>
        </>
      )}
    </Card>
  )
}

const CardHeader = styled.div`
  display: flex;
  gap: ${theme.spacing(2)};
  align-items: center;
  margin-bottom: ${theme.spacing(4)};
`

const SkeletonWrapper = styled.div`
  height: 88px;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`
