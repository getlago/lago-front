import styled from 'styled-components'
import { clsx } from 'clsx'

import { theme } from '~/styles'

import { AvatarGenericProps, Avatar } from './Avatar'
import { Typography } from './Typography'
import { Button } from './Button'
import { Icon, IconName } from './Icon'

enum ChipTypeEnum {
  default = 'default',
  error = 'error',
}

interface ChipGenericProps {
  label: string
  className?: string
  type?: keyof typeof ChipTypeEnum
  onClose?: () => void | Promise<void>
}

interface ChipPropsAvatar extends ChipGenericProps {
  icon?: never
  avatarProps?: Pick<AvatarGenericProps, 'initials' | 'identifier'>
}

interface ChipPropsIcon extends ChipGenericProps {
  icon: IconName
  avatarProps?: never
}

type ChipProps = ChipPropsAvatar | ChipPropsIcon

export const Chip = ({
  className,
  label,
  icon,
  avatarProps,
  type = ChipTypeEnum.default,

  onClose,
}: ChipProps) => {
  return (
    <Container className={clsx(className, `chip-container--${type}`)} data-test={`chip-${label}`}>
      {icon && (
        <Icon name={icon} size="small" color={type === ChipTypeEnum.error ? 'error' : undefined} />
      )}
      {avatarProps && <Avatar size="small" variant="user" {...avatarProps} />}
      <Typography
        variant="captionHl"
        color={type === ChipTypeEnum.error ? 'danger600' : 'textSecondary'}
      >
        {label}
      </Typography>
      {onClose && (
        <Button
          size="small"
          variant="quaternary"
          danger={type === ChipTypeEnum.error}
          icon="close-circle-filled"
          onClick={onClose}
        />
      )}
    </Container>
  )
}

const Container = styled.div`
  min-height: 32px;
  border: 1px solid ${theme.palette.grey[300]};
  background-color: ${theme.palette.grey[100]};
  padding: ${theme.spacing(1)} ${theme.spacing(2)};
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  align-items: center;
  width: fit-content;

  &.chip-container--${ChipTypeEnum.error} {
    background-color: ${theme.palette.error[100]};
    color: ${theme.palette.error[300]};
    border-color: ${theme.palette.error[300]};
  }

  > *:not(:last-child) {
    margin-right: ${theme.spacing(2)};
  }

  button.button-icon-only {
    width: 16px;
    height: 16px;
    padding: 0;
  }
`
