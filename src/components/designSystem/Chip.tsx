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
      {icon && <StyledIcon name={icon} size="small" />}
      {avatarProps && <StyledAvatar size="small" variant="user" {...avatarProps} />}
      <Label variant="captionHl" color="textSecondary" $withClose={!!onClose}>
        {label}
      </Label>
      {onClose && (
        <Button size="small" variant="quaternary" icon="close-circle-filled" onClick={onClose} />
      )}
    </Container>
  )
}

const Container = styled.div`
  height: 32px;
  border: 1px solid ${theme.palette.grey[300]};
  background-color: ${theme.palette.grey[100]};
  padding: 0 ${theme.spacing(2)};
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  align-items: center;
`

const Label = styled(Typography)<{ $withClose?: boolean }>`
  margin-right: ${({ $withClose }) => ($withClose ? theme.spacing(2) : 0)};
`

const StyledIcon = styled(Icon)`
  margin-right: ${theme.spacing(2)};
`

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(2)};
`
