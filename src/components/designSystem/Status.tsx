import { ReactNode } from 'react'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { Icon, IconColor, IconName } from './Icon'
import { Typography } from './Typography'

export enum StatusEnum {
  running = 'running',
  paused = 'paused',
  draft = 'draft',
  failed = 'failed',
  error = 'error',
  voided = 'voided',
}

type StatusType = keyof typeof StatusEnum
interface StatusProps {
  type: StatusType
  className?: string
  label?: string | ReactNode
  hideLabel?: boolean
}

const STATUS_CONFIG: {
  [key in StatusType]: {
    label: string
    color: string | IconColor
    icon?: IconName
  }
} = {
  [StatusEnum.running]: {
    label: 'text_624efab67eb2570101d1180e',
    color: theme.palette.success[600],
  },
  [StatusEnum.paused]: {
    label: 'text_624efab67eb2570101d117f6',
    color: theme.palette.grey[500],
  },
  [StatusEnum.draft]: {
    label: 'text_63ac8850ff7117ad55777d3b',
    color: theme.palette.grey[500],
  },
  [StatusEnum.failed]: {
    label: 'text_624efab67eb2570101d11826',
    color: theme.palette.warning[600],
  },
  [StatusEnum.error]: {
    label: 'text_624efab67eb2570101d11826',
    color: theme.palette.error[600],
  },
  [StatusEnum.voided]: {
    label: 'text_6376641a2a9c70fff5bddcd5',
    color: 'input',
    icon: 'stop',
  },
}

const STATUS_WIDTH = 84
const STATUS_SIZE = 12

export const Status = ({ type, className, label, hideLabel = false }: StatusProps) => {
  const { translate } = useInternationalization()
  const config = STATUS_CONFIG[type]

  switch (type) {
    case StatusEnum.draft:
      return (
        <Container data-test={type} className={className}>
          <svg height={STATUS_SIZE} width={STATUS_SIZE}>
            <circle cx="6" cy="6" r="5" fill="none" stroke={config.color} strokeWidth="2" />
          </svg>
          {!hideLabel && (
            <Typography color="grey500">{label ?? translate(config.label)}</Typography>
          )}
        </Container>
      )
    case StatusEnum.voided:
      return (
        <Container data-test={type} className={className}>
          <Icon name={config.icon as IconName} size="small" color={config.color as IconColor} />
          {!hideLabel && (
            <Typography color="grey500">{label ?? translate(config.label)}</Typography>
          )}
        </Container>
      )
    default:
      return (
        <Container data-test={type} className={className}>
          <svg height={STATUS_SIZE} width={STATUS_SIZE}>
            <circle cx="6" cy="6" r="6" fill={config.color} />
          </svg>
          {!hideLabel && (
            <Typography color={type === 'paused' ? 'grey500' : 'textSecondary'}>
              {label ?? translate(config.label)}
            </Typography>
          )}
        </Container>
      )
  }
}

const Container = styled.div`
  display: flex;
  align-items: baseline;
  min-width: ${STATUS_WIDTH}px;

  > :first-child {
    margin-right: ${theme.spacing(2)};
    min-width: ${STATUS_SIZE}px;
  }
`
