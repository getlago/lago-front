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
  variant: Extract<SkeletonVariant, 'userAvatar' | 'connectorAvatar'>
  size: AvatarSize
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  width?: never
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  height?: never
  className?: string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  marginRight?: number | string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  marginBottom?: number | string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  marginTop?: number | string
  color?: SkeletonColor
}

interface SkeletonGenericProps {
  variant: Extract<SkeletonVariant, 'text' | 'circular'>
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  width?: number | string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  height?: number | string
  size?: never
  className?: string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  marginRight?: number | string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  marginBottom?: number | string
  /**
   * @deprecated Use `className` and TailwindCSS instead
   */
  marginTop?: number | string
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
  marginBottom,
  marginRight,
  marginTop,
  width,
  height,
}: SkeletonConnectorProps | SkeletonGenericProps) => {
  return (
    <SkeletonContainer
      $marginRight={marginRight}
      $marginBottom={marginBottom}
      $marginTop={marginTop}
      $height={size ? mapAvatarSize(size) : height}
      $width={size ? mapAvatarSize(size) : width}
      className={tw(skeletonStyles({ variant, color, size }), className)}
    />
  )
}

const SkeletonContainer = styled.div<{
  $height?: number | string
  $width?: number | string
  $marginRight?: number | string
  $marginBottom?: number | string
  $marginTop?: number | string
}>`
  height: ${({ $height }) =>
    !$height ? 0 : typeof $height === 'number' ? `${$height}px` : $height};

  width: ${({ $width }) =>
    !$width ? 0 : typeof $width === 'number' ? `${$width}px !important` : `${$width} !important`};
  margin-right: ${({ $marginRight }) =>
    !$marginRight
      ? 0
      : typeof $marginRight === 'number'
        ? `${$marginRight}px ! important`
        : `${$marginRight} !important`};
  margin-bottom: ${({ $marginBottom }) =>
    !$marginBottom
      ? 0
      : typeof $marginBottom === 'number'
        ? `${$marginBottom}px ! important`
        : `${$marginBottom} !important`};
  margin-top: ${({ $marginTop }) =>
    !$marginTop
      ? 0
      : typeof $marginTop === 'number'
        ? `${$marginTop}px ! important`
        : `${$marginTop} !important`};
`
