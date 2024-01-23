import { ReactNode } from 'react'
import styled, { css } from 'styled-components'

import { theme } from '~/styles'

import { Typography } from './Typography'

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

enum AvatarSizeEnum {
  small = 'small',
  intermediate = 'intermediate',
  medium = 'medium',
  big = 'big',
  large = 'large',
}

enum AvatarVariantEnum {
  connector = 'connector',
  user = 'user',
  company = 'company',
}

export type AvatarSize = keyof typeof AvatarSizeEnum
type AvatarVariant = keyof typeof AvatarVariantEnum

interface AvatarConnectorProps {
  variant: Extract<AvatarVariant, 'connector'>
  children: ReactNode | string
  size?: AvatarSize
  initials?: never
  identifier?: never
  className?: string
}

export interface AvatarGenericProps {
  variant: Extract<AvatarVariant, 'company' | 'user'>
  identifier: string
  initials?: string // Note that only the first initial will be displayed in small size
  size?: AvatarSize
  children?: never
  className?: string
}

const mapTypographyVariant = (size: AvatarSize) => {
  switch (size) {
    case 'small':
    case 'intermediate':
      return 'noteHl'
    case 'large':
      return 'subhead'
    default:
      return 'bodyHl'
  }
}

export const mapAvatarSize = (size: AvatarSize) => {
  switch (size) {
    case 'small':
      return 16
    case 'intermediate':
      return 24
    case 'medium':
      return 32
    case 'big':
      return 40
    case 'large':
      return 64
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
  size = 'big',
  identifier,
  initials,
  children,
  className,
}: AvatarProps) => {
  if (variant === 'connector') {
    return (
      <StyledAvatar
        className={className}
        data-test={`${variant}/${size}`}
        $size={mapAvatarSize(size)}
        $isRounded={true}
        $backgroundColor={theme.palette.grey[100]}
      >
        {children}
      </StyledAvatar>
    )
  }

  const getContent = () => {
    let cursor = size === 'small' || size === 'intermediate' ? 1 : 2

    return (
      <Typography color="inherit" variant={mapTypographyVariant(size)}>
        {(initials || identifier || '').substring(0, cursor).toUpperCase()}
      </Typography>
    )
  }

  const backgroundColorKey = getBackgroundColorKey(identifier)

  return (
    <StyledAvatar
      className={className}
      data-test={`${variant}/${size}`}
      $size={mapAvatarSize(size)}
      $isRounded={variant === 'company'}
      // @ts-expect-error
      $backgroundColor={!!identifier ? AVATAR_PALETTE[backgroundColorKey] : theme.palette.grey[100]}
      $color={!!identifier ? theme.palette.common.white : theme.palette.grey[600]}
    >
      {getContent()}
    </StyledAvatar>
  )
}

const StyledAvatar = styled.div<{
  $size: number
  $isRounded: boolean
  $backgroundColor?: string
  $color?: string
}>`
  background-color: ${(props) => props.$backgroundColor};
  color: ${(props) => props.$color};
  width: ${(props) => props.$size}px;
  min-width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$isRounded
      ? css`
          border-radius: ${props.$size === 16 ? '4px' : props.$size === 24 ? '8px' : '12px'};
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
