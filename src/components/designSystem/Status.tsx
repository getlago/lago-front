import styled from 'styled-components'

import { theme } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'

import { Typography } from './Typography'

export enum StatusEnum {
  running = 'running',
  paused = 'paused',
  failed = 'failed',
  error = 'error',
}

export type StatusType = keyof typeof StatusEnum
interface StatusProps {
  type: StatusType
  className?: string
  label?: string
}

const STATUS_CONFIG = {
  [StatusEnum.running]: {
    // i18n-key cp:generics:status:running
    label: 'cp:generics:status:running',
    color: theme.palette.success[600],
  },
  [StatusEnum.paused]: {
    // i18n-key cp:generics:status:paused
    label: 'cp:generics:status:paused',
    color: theme.palette.grey[500],
  },
  [StatusEnum.failed]: {
    // i18n-key cp:generics:status:failed
    label: 'cp:generics:status:failed',
    color: theme.palette.warning[600],
  },
  [StatusEnum.error]: {
    // i18n-key cp:generics:status:error
    label: 'cp:generics:status:error',
    color: theme.palette.error[600],
  },
}

export const STATUS_WIDTH = 84
const STATUS_SIZE = 12

export const Status = ({ type, className, label }: StatusProps) => {
  const { translate } = useI18nContext()
  const config = STATUS_CONFIG[type]

  switch (type) {
    case StatusEnum.paused:
      return (
        <Container data-qa={type} className={className}>
          <svg height={STATUS_SIZE} width={STATUS_SIZE}>
            <circle cx="6" cy="6" r="5" fill="none" stroke={config.color} strokeWidth="2" />
          </svg>
          <Typography color="disabled">{label ?? translate(config.label)}</Typography>
        </Container>
      )
    default:
      return (
        <Container data-qa={type} className={className}>
          <svg height={STATUS_SIZE} width={STATUS_SIZE}>
            <circle cx="6" cy="6" r="6" fill={config.color} />
          </svg>
          <Typography color="textSecondary">{label ?? translate(config.label)}</Typography>
        </Container>
      )
  }
}

const Container = styled.div`
  display: flex;
  align-items: baseline;
  width: ${STATUS_WIDTH}px;

  > :first-child {
    margin-right: ${theme.spacing(2)};
    min-width: ${STATUS_SIZE}px;
  }
`
