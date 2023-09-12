import clsns from 'classnames'
import styled from 'styled-components'

import { theme } from '~/styles'

import { AvatarSize, mapAvatarSize } from './Avatar'

enum SkeletonVariantEnum {
  connectorAvatar = 'connectorAvatar', // squared with rounded corners
  userAvatar = 'userAvatar', // rounded
  text = 'text',
  circular = 'circular',
}

enum SkeletonColorEnum {
  dark = 'dark',
  light = 'light',
}

type TSkeletonVariant = keyof typeof SkeletonVariantEnum

interface SkeletonConnectorProps {
  variant: Extract<TSkeletonVariant, 'userAvatar' | 'connectorAvatar'>
  size: AvatarSize
  width?: never
  height?: never
  className?: string
  marginRight?: number | string
  marginBottom?: number | string
  color?: keyof typeof SkeletonColorEnum
}

interface SkeletonGenericProps {
  variant: Extract<TSkeletonVariant, 'text' | 'circular'>
  width?: number | string
  height?: number | string
  size?: never
  className?: string
  marginRight?: number | string
  marginBottom?: number | string
  color?: keyof typeof SkeletonColorEnum
}

export const Skeleton = ({
  className,
  variant,
  marginRight,
  marginBottom,
  size,
  height,
  width,
  color = SkeletonColorEnum.light,
}: SkeletonConnectorProps | SkeletonGenericProps) => {
  return (
    <SkeletonContainer
      $marginRight={marginRight}
      $marginBottom={marginBottom}
      $height={(size ? mapAvatarSize(size) : height) || 12}
      $width={(size ? mapAvatarSize(size) : width) || 90}
      className={clsns(className, {
        'skeleton-variant--circular': [
          SkeletonVariantEnum.circular,
          SkeletonVariantEnum.userAvatar,
        ].includes(SkeletonVariantEnum[variant]),
        'skeleton-variant--text': variant === SkeletonVariantEnum.text,
        'skeleton-variant--rounded': variant === SkeletonVariantEnum.connectorAvatar,
        'skeleton-color--dark': color === SkeletonColorEnum.dark,
      })}
    />
  )
}

const SkeletonContainer = styled.div<{
  $height: number | string
  $width: number | string
  $marginRight?: number | string
  $marginBottom?: number | string
}>`
  animation: pulse 1.5s ease-in-out 0.5s infinite;
  background-color: ${theme.palette.grey[100]};
  height: ${({ $height }) =>
    !$height ? 0 : typeof $height === 'number' ? `${$height}px` : $height};
  width: 100%;
  max-width: ${({ $width }) => (!$width ? 0 : typeof $width === 'number' ? `${$width}px` : $width)};
  margin-right: ${({ $marginRight }) =>
    !$marginRight ? 0 : typeof $marginRight === 'number' ? `${$marginRight}px` : $marginRight};
  margin-bottom: ${({ $marginBottom }) =>
    !$marginBottom ? 0 : typeof $marginBottom === 'number' ? `${$marginBottom}px` : $marginBottom};

  &.skeleton-color--dark {
    background-color: ${theme.palette.grey[300]};
  }

  &.skeleton-variant--circular {
    border-radius: 50%;
  }
  &.skeleton-variant--text {
    border-radius: 32px;
  }
  &.skeleton-variant--rounded {
    border-radius: 12px;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
`
