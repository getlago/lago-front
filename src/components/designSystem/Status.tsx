import { FC } from 'react'
import styled from 'styled-components'

import { Locale, TranslateData } from '~/core/translations'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { theme } from '~/styles'

import { Typography, TypographyColor } from './Typography'

export enum StatusType {
  success = 'success',
  warning = 'warning',
  outline = 'outline',
  default = 'default',
  danger = 'danger',
  disabled = 'disabled',
}

type StatusLabelSuccess = 'succeeded' | 'finalized' | 'active' | 'pay' | 'available' | 'refunded'
type StatusLabelWarning = 'failed'
type StatusLabelOutline = 'draft'
type StatusLabelDefault = 'pending' | 'toPay' | 'n/a'
type StatusLabelDanger =
  | 'disputed'
  | 'disputeLost'
  | 'disputeLostOn'
  | 'terminated'
  | 'consumed'
  | 'voided'
  | 'overdue'

type StatusLabelDisabled = 'voided'

export type StatusLabel =
  | StatusLabelSuccess
  | StatusLabelWarning
  | StatusLabelOutline
  | StatusLabelDefault
  | StatusLabelDanger
  | StatusLabelDisabled

const statusLabelMapping: Record<StatusLabel, string> = {
  succeeded: 'text_63e27c56dfe64b846474ef4d',
  finalized: 'text_65269c2e471133226211fd74',
  active: 'text_624efab67eb2570101d1180e',
  available: 'text_637655cb50f04bf1c8379d0c',
  refunded: 'text_637656ef3d876b0269edc79d',
  failed: 'text_637656ef3d876b0269edc7a1',
  draft: 'text_63ac86d797f728a87b2f9f91',
  pending: 'text_62da6db136909f52c2704c30',
  disputed: 'text_668fe99c939c8800dfeb504e',
  disputeLostOn: 'text_66141e30699a0631f0b2ed2c',
  disputeLost: 'text_66141e30699a0631f0b2ec9c',
  terminated: 'text_624efab67eb2570101d11826',
  consumed: 'text_6376641a2a9c70fff5bddcd1',
  voided: 'text_6376641a2a9c70fff5bddcd5',
  overdue: 'text_666c5b12fea4aa1e1b26bf55',
  ['n/a']: '-',
  // These keys below are displayed in the customer portal
  // Hence they must be translated in all available languages
  pay: 'text_6419c64eace749372fc72b54',
  toPay: 'text_6419c64eace749372fc72b44',
}

export type StatusProps = {
  labelVariables?: TranslateData
  locale?: Locale
} & (
  | {
      type: StatusType.success
      label: StatusLabelSuccess
    }
  | {
      type: StatusType.warning
      label: StatusLabelWarning
    }
  | {
      type: StatusType.outline
      label: StatusLabelOutline
    }
  | {
      type: StatusType.default
      label: StatusLabelDefault
    }
  | {
      type: StatusType.danger
      label: StatusLabelDanger
    }
  | {
      type: StatusType.disabled
      label: StatusLabelDanger
    }
)

type StatusConfig = Record<
  StatusType,
  {
    color: TypographyColor
    backgroundColor: string
    borderColor: string
  }
>

const STATUS_CONFIG: StatusConfig = {
  success: {
    color: 'success600',
    backgroundColor: theme.palette.success[100],
    borderColor: theme.palette.success[200],
  },
  default: {
    color: 'grey700',
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.grey[400],
  },
  outline: {
    color: 'grey600',
    backgroundColor: theme.palette.background.default,
    borderColor: theme.palette.grey[400],
  },
  warning: {
    color: 'warning700',
    backgroundColor: theme.palette.secondary[100],
    borderColor: theme.palette.secondary[300],
  },
  danger: {
    color: 'danger600',
    backgroundColor: theme.palette.error[100],
    borderColor: theme.palette.error[200],
  },
  disabled: {
    color: 'grey500',
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.grey[400],
  },
}

export const Status: FC<StatusProps> = ({ type, label, labelVariables, locale = 'en' }) => {
  const { translateWithContextualLocal: translate } = useContextualLocale(locale)

  const config = STATUS_CONFIG[type ?? 'default']
  const statusLabel = statusLabelMapping[label]

  return (
    <Container $backgroundColor={config.backgroundColor} $borderColor={config.borderColor}>
      <Typography variant="captionHl" color={config.color}>
        {translate(statusLabel, labelVariables ?? {})}
      </Typography>
    </Container>
  )
}

const Container = styled.div<{ $backgroundColor: string; $borderColor: string }>`
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
  height: fit-content;
  width: fit-content;
  border-radius: ${theme.spacing(2)};
  min-height: ${theme.spacing(8)};
  padding: 0px ${theme.spacing(2)};
  outline-offset: -1px;
  outline-style: solid;
  outline-width: 1px;
  outline-color: ${({ $borderColor }) => $borderColor};
`
