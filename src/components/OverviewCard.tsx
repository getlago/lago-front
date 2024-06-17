import { Stack } from '@mui/material'
import { FC } from 'react'
import styled from 'styled-components'

import { Icon, Tooltip, Typography } from '~/components/designSystem'
import { Card, theme } from '~/styles'

interface OverviewCardProps {
  title: string
  tooltipContent?: string
  content: string
  caption: string
  isAccentContent?: boolean
}

export const OverviewCard: FC<OverviewCardProps> = ({
  title,
  tooltipContent,
  content,
  caption,
  isAccentContent,
}) => {
  return (
    <Card $padding={6} $flexItem $childSpacing={4}>
      <CardHeader>
        <Typography variant="captionHl">{title}</Typography>
        {tooltipContent && (
          <Tooltip placement="top-start" title={tooltipContent}>
            <Icon name="info-circle" />
          </Tooltip>
        )}
      </CardHeader>

      <Stack gap={1}>
        <Typography variant="subhead" color={isAccentContent ? 'warning700' : 'grey700'}>
          {content}
        </Typography>
        <Typography variant="caption">{caption}</Typography>
      </Stack>
    </Card>
  )
}

const CardHeader = styled.div`
  display: flex;
  gap: ${theme.spacing(2)};
  align-items: center;
  margin-bottom: ${theme.spacing(4)};
`
