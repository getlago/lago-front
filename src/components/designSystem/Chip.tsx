import { ChipOwnProps, Chip as MuiChip } from '@mui/material'
import { clsx } from 'clsx'
import styled from 'styled-components'

import { Button } from './Button'
import { Icon, IconName } from './Icon'
import { Tooltip } from './Tooltip'
import { Typography, TypographyColor, TypographyProps } from './Typography'

import { ConditionalWrapper } from '../ConditionalWrapper'

enum ChipTypeEnum {
  primary = 'primary',
  secondary = 'secondary',
}

type ChipSize = 'small' | 'medium' | 'big'
type ChipType = keyof typeof ChipTypeEnum

type ChipProps = Omit<ChipOwnProps, 'color' | 'variant' | 'size' | 'deleteIcon' | 'icon'> & {
  className?: string
  color?: TypographyColor
  deleteIcon?: IconName
  deleteIconLabel?: string
  error?: boolean
  icon?: IconName
  size?: ChipSize
  type?: ChipType
  variant?: TypographyProps['variant']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete?: React.EventHandler<any>
}

export const Chip = ({
  className,
  color = 'textSecondary',
  deleteIcon,
  deleteIconLabel,
  error,
  icon,
  label,
  size = 'medium',
  type,
  variant,
  onDelete,
  ...chipProps
}: ChipProps) => {
  return (
    <MuiChip
      {...chipProps}
      className={clsx(
        {
          'chip--error': !!error,
          'chip-size--small': size === 'small',
          'chip-size--big': size === 'big',
        },
        className,
      )}
      icon={icon ? <StyledIcon name={icon} /> : undefined}
      label={
        <Typography variant={variant || 'captionHl'} color={!!error ? 'danger600' : color} noWrap>
          {label}
        </Typography>
      }
      variant={type === ChipTypeEnum.secondary ? 'outlined' : 'filled'}
      color="default"
      deleteIcon={
        <ConditionalWrapper
          condition={!!deleteIconLabel}
          invalidWrapper={(children) => <>{children}</>}
          validWrapper={(children) => (
            <Tooltip placement="top-end" title={deleteIconLabel}>
              {children}
            </Tooltip>
          )}
        >
          <Button
            danger={error}
            icon={deleteIcon || 'close-circle-filled'}
            onClick={onDelete}
            size="small"
            variant="quaternary"
          />
        </ConditionalWrapper>
      }
      onDelete={onDelete}
    />
  )
}

const StyledIcon = styled(Icon)`
  margin: 0px !important;
`
