import { cva } from 'class-variance-authority'
import styled from 'styled-components'

import { tw } from '~/styles/utils'

import { AvatarSize, avatarSizeStyles, mapAvatarSize } from './Avatar'

type SkeletonVariant =
  | 'connectorAvatar' // squared with rounded corners
  | 'userAvatar' // rounded
  | 'text'
  | 'circular'

type SkeletonColor = 'dark' | 'light'

interface SkeletonConnectorProps {
  variant: Extract<SkeletonVariant, 'userAvatar' | 'connectorAvatar' | 'circular'>
  size: AvatarSize
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  width?: never
  className?: string
  color?: SkeletonColor
}

interface SkeletonGenericProps {
  variant: Extract<SkeletonVariant, 'text'>
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  width?: number | string
  size?: never
  className?: string
  color?: SkeletonColor
}

const skeletonStyles = cva('w-full animate-pulse bg-grey-100', {
  variants: {
    size: avatarSizeStyles,
    variant: {
      connectorAvatar: '', // defined in avatarSizeStyles
      userAvatar: '', // defined in avatarSizeStyles
      text: 'h-3 rounded-3xl',
      circular: 'rounded-full',
    },
    color: {
      dark: 'bg-grey-300',
      light: 'bg-grey-100',
    },
    defaultVariants: {
      color: 'light',
    },
  },
})

export const Skeleton = ({
  className,
  variant,
  color,
  size,
  width,
}: SkeletonConnectorProps | SkeletonGenericProps) => {
  return (
    <SkeletonContainer
      $width={size ? mapAvatarSize(size) : width}
      className={tw(skeletonStyles({ variant, color, size }), className)}
    />
  )
}

const SkeletonContainer = styled.div<{
  $width?: number | string
}>`
  width: ${({ $width }) =>
    !$width ? 0 : typeof $width === 'number' ? `${$width}px !important` : `${$width} !important`};
`
