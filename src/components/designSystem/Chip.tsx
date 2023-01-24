import styled from 'styled-components'

import { theme } from '~/styles'

import { AvatarGenericProps, Avatar } from './Avatar'
import { Typography } from './Typography'
import { Button } from './Button'
import { Icon, IconName } from './Icon'

interface ChipGenericProps {
  label: string
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

export const Chip = ({ label, icon, avatarProps, onClose }: ChipProps) => {
  return (
    <Container>
      {icon && <Icon name={icon} size="small" />}
      {avatarProps && <Avatar size="small" variant="user" {...avatarProps} />}
      <Typography variant="captionHl" color="textSecondary">
        {label}
      </Typography>
      {onClose && (
        <Button size="small" variant="quaternary" icon="close-circle-filled" onClick={onClose} />
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

  > *:not(:last-child) {
    margin-right: ${theme.spacing(2)};
  }

  button.button-icon-only {
    width: 16px;
    height: 16px;
    padding: 0;
  }
`
