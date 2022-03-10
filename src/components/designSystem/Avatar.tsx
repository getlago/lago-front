import styled, { css } from 'styled-components'
import { ReactNode } from 'react'

import { theme } from '~/styles'

import { Typography } from './Typography'
import { Icon } from './Icon'

const AVATAR_PALETTE = {
  orange: '#FF9351',
  brown: '#D59993',
  green: '#66DD93',
  turquoise: '#6FD8C1',
  blue: '#2FC1FE',
  indigo: '#5195FF',
  grey: '#889ABF',
  pink: '#FF9BE0',
}

export type AvatarSize = 'small' | 'medium' | 'large'
export type ConnectorAvatarSize = Omit<AvatarSize, 'small'>

interface AvatarConnectorProps {
  variant: 'connector'
  children: ReactNode | string
  size?: ConnectorAvatarSize
  initials?: never
  identifier?: never
}

interface AvatarGenericProps {
  variant: 'user' | 'company'
  initials: string // Note that only the first initial will be displayed in small size
  identifier: string
  size?: AvatarSize
  children?: never
}

const mapTypographyVariant = (size: ConnectorAvatarSize) => {
  switch (size) {
    case 'small':
      return 'note'
    case 'large':
      return 'subhead'
    default:
      return 'bodyHl'
  }
}

export const mapAvatarSize = (size: ConnectorAvatarSize) => {
  switch (size) {
    case 'small':
      return 16
    case 'large':
      return 64
    default:
      return 40
  }
}

// The need here is to get a color from the AVATAR_PALETTE according to
// an identifier (can be an id, fullname, company name... whaterver)
const getBackgroundColorKey = (identifier?: string): keyof typeof AVATAR_PALETTE | null => {
  if (!identifier) return null

  // Get the sum of the UTF-16 code for each char
  const charcodeSum = identifier.split('').reduce((acc, char) => {
    acc = acc + char.charCodeAt(0)
    return acc
  }, 0)

  // From the modulo of the color number, get the modulo
  const colorKeys = Object.keys(AVATAR_PALETTE)
  const colorIndex = charcodeSum % colorKeys.length

  // @ts-expect-error
  return colorKeys[colorIndex]
}

type AvatarProps = AvatarGenericProps | AvatarConnectorProps

export const Avatar = ({
  variant,
  size = 'medium',
  identifier,
  initials = '',
  children,
}: AvatarProps) => {
  if (variant === 'connector') {
    return (
      <StyledAvatar
        data-qa={`${variant}/${size}`}
        $size={mapAvatarSize(size)}
        $isRounded={true}
        $backgroundColor={theme.palette.grey[100]}
      >
        {children}
      </StyledAvatar>
    )
  }

  const getContent = () => {
    switch (true) {
      case size === 'small':
        return (
          <Typography color="inherit" variant={mapTypographyVariant(size)}>
            {initials.substring(0, 1).toUpperCase()}
          </Typography>
        )
      case variant === 'company':
        return <Icon name="company" size={size as AvatarSize} color="light" />
      default:
        return (
          <Typography color="inherit" variant={mapTypographyVariant(size)}>
            {initials.substring(0, 2).toUpperCase()}
          </Typography>
        )
    }
  }

  const backgroundColorKey = getBackgroundColorKey(identifier)

  return (
    <StyledAvatar
      data-qa={`${variant}/${size}`}
      $size={mapAvatarSize(size)}
      $isRounded={variant === 'company'}
      // @ts-expect-error
      $backgroundColor={AVATAR_PALETTE[backgroundColorKey]}
    >
      {getContent()}
    </StyledAvatar>
  )
}

const StyledAvatar = styled.div<{ $size: number; $isRounded: boolean; $backgroundColor?: string }>`
  background-color: ${(props) => props.$backgroundColor || 'none'};
  color: ${theme.palette.common.white};
  width: ${(props) => props.$size}px;
  min-width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$isRounded
      ? css`
          border-radius: ${props.$size === 16 ? '4px' : '12px'};
        `
      : css`
          border-radius: 50%;
        `}
  > img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`
