import { cva, cx } from 'class-variance-authority'
import { ReactNode } from 'react'

import { tw } from '~/styles/utils'

import { Typography } from './Typography'

import { colors } from '../../../tailwind.config'

export type AvatarSize = 'tiny' | 'small' | 'intermediate' | 'medium' | 'big' | 'large'
type AvatarVariant = 'connector' | 'user' | 'company' | 'connector-full'

interface AvatarConnectorProps {
  variant: Extract<AvatarVariant, 'connector' | 'connector-full'>
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
    case 'tiny':
    case 'small':
    case 'intermediate':
      return 'noteHl'
    case 'large':
      return 'subhead'
    default:
      return 'bodyHl'
  }
}

// TODO: To remove once migration is done for Skeleton component
// Use avatarSizeStyles instead of mapAvatarSize
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
const getBackgroundColorKey = (identifier?: string): keyof typeof colors.avatar | null => {
  if (!identifier) return null

  // Get the sum of the UTF-16 code for each char
  const charcodeSum = identifier.split('').reduce((acc, char) => {
    acc = acc + char.charCodeAt(0)
    return acc
  }, 0)

  // From the modulo of the color number, get the modulo
  const colorKeys = Object.keys(colors.avatar)

  const colorIndex = charcodeSum % colorKeys.length

  // @ts-expect-error
  return colorKeys[colorIndex]
}

export const avatarSizeStyles: Record<AvatarSize, string> = {
  tiny: cx('w-2 min-w-2 h-2 rounded'),
  small: cx('w-4 min-w-4 h-4 rounded'),
  intermediate: cx('w-6 min-w-6 h-6 rounded-lg'),
  medium: cx('w-8 min-w-8 h-8 rounded-xl'),
  big: cx('w-10 min-w-10 h-10 rounded-xl'),
  large: cx('w-16 min-w-16 h-16 rounded-xl'),
}

const avatarStyles = cva(
  'flex items-center justify-center [&>img]:size-full [&>img]:rounded-[inherit] [&>img]:object-cover',
  {
    variants: {
      size: avatarSizeStyles,
      rounded: {
        false: 'rounded-full',
      },
      backgroundColor: {
        default: 'bg-grey-100',
        orange: 'bg-avatar-orange',
        brown: 'bg-avatar-brown',
        green: 'bg-avatar-green',
        turquoise: 'bg-avatar-turquoise',
        blue: 'bg-avatar-blue',
        indigo: 'bg-avatar-indigo',
        grey: 'bg-avatar-grey',
        pink: 'bg-avatar-pink',
      },
      color: {
        default: 'text-grey-600',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'big',
      backgroundColor: 'default',
      color: 'default',
    },
  },
)

export const Avatar = ({
  variant,
  size = 'big',
  identifier,
  initials,
  children,
  className,
}: AvatarGenericProps | AvatarConnectorProps) => {
  if (variant === 'connector' || variant === 'connector-full') {
    return (
      <div
        className={tw(
          avatarStyles({ size, rounded: true }),
          variant === 'connector-full' && '[&>svg]:size-full',
          className,
        )}
        data-test={`${variant}/${size}`}
      >
        {children}
      </div>
    )
  }

  const getContent = () => {
    const cursor = size === 'small' || size === 'intermediate' ? 1 : 2

    return (
      <Typography color="inherit" variant={mapTypographyVariant(size)}>
        {(initials || identifier || '').substring(0, cursor).toUpperCase()}
      </Typography>
    )
  }

  return (
    <div
      className={tw(
        avatarStyles({
          size,
          backgroundColor: getBackgroundColorKey(identifier) ?? 'default',
          color: identifier ? 'white' : 'default',
          rounded: variant === 'company',
        }),
        className,
      )}
      data-test={`${variant}/${size}`}
    >
      {getContent()}
    </div>
  )
}
