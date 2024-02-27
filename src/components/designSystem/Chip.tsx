import { ChipOwnProps, Chip as MuiChip } from '@mui/material'
import { clsx } from 'clsx'

import { Button } from './Button'
import { Icon, IconName } from './Icon'
import { Tooltip } from './Tooltip'
import { Typography, TypographyColor } from './Typography'

import { ConditionalWrapper } from '../ConditionalWrapper'

enum ChipTypeEnum {
  primary = 'primary',
  secondary = 'secondary',
}

type ChipSize = 'small' | 'medium' | 'big'
type ChipType = keyof typeof ChipTypeEnum

type ChipProps = Omit<ChipOwnProps, 'color' | 'variant' | 'size' | 'deleteIcon' | 'icon'> & {
  beta?: boolean
  color?: TypographyColor
  deleteIcon?: IconName
  deleteIconLabel?: string
  error?: boolean
  icon?: IconName
  size?: ChipSize
  type?: ChipType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete?: React.EventHandler<any>
}

export const Chip = ({
  beta,
  color = 'textSecondary',
  deleteIcon,
  deleteIconLabel,
  error,
  icon,
  label,
  size = 'medium',
  type,
  onDelete,
  ...chipProps
}: ChipProps) => {
  return (
    <MuiChip
      {...chipProps}
      className={clsx({
        'chip--error': !!error,
        'chip-size--small': size === 'small',
        'chip-size--big': size === 'big',
      })}
      icon={icon ? <Icon name={icon} /> : undefined}
      label={
        <Typography
          variant={!!beta ? 'captionCode' : 'captionHl'}
          color={!!beta ? 'info600' : !!error ? 'danger600' : color}
        >
          {label}
        </Typography>
      }
      variant={beta ? 'filled' : type === ChipTypeEnum.secondary ? 'outlined' : 'filled'}
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
