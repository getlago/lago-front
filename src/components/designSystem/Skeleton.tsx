import { Skeleton as MuiSkeleton, SkeletonProps as MuiSkeletonProps } from '@mui/material'
import styled, { css } from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'

import { AvatarSize, mapAvatarSize, ConnectorAvatarSize } from './Avatar'

enum SkeletonVariantEnum {
  connectorAvatar = 'connectorAvatar',
  accountAvatar = 'accountAvatar',
  userAvatar = 'userAvatar',
  text = 'text',
  rect = 'rect',
  circle = 'circle',
}

type TSkeletonVariant = keyof typeof SkeletonVariantEnum

interface SkeletonConnectorProps extends Pick<MuiSkeletonProps, 'animation'> {
  variant: Extract<TSkeletonVariant, 'connectorAvatar' | 'accountAvatar'>
  size: ConnectorAvatarSize
  width?: never
  height?: never
  className?: string
}

interface SkeletonUserProps extends Pick<MuiSkeletonProps, 'animation'> {
  variant: 'userAvatar'
  size: AvatarSize
  width?: never
  height?: never
  className?: string
}

interface SkeletonGenericProps extends Pick<MuiSkeletonProps, 'animation' | 'width' | 'height'> {
  variant: TSkeletonVariant
  size?: never
  className?: string
}

const mapVariant = (variant?: keyof typeof SkeletonVariantEnum): MuiSkeletonProps['variant'] => {
  switch (variant) {
    case SkeletonVariantEnum.connectorAvatar:
    case SkeletonVariantEnum.accountAvatar:
      return 'rectangular'
    case SkeletonVariantEnum.userAvatar:
      return 'circular'
    default:
      return variant as 'circular' | 'rectangular' | 'text'
  }
}

type SkeletonProps = SkeletonConnectorProps | SkeletonUserProps | SkeletonGenericProps

export const Skeleton = ({
  variant = 'text',
  size,
  width,
  height,
  animation = 'pulse',
  className,
}: SkeletonProps) => {
  return (
    <StyledSkeleton
      className={clsns(className, {
        'skeleton--connector': ['connectorAvatar', 'accountAvatar'].includes(variant),
      })}
      variant={mapVariant(variant)}
      height={size ? mapAvatarSize(size) : height}
      width={size ? mapAvatarSize(size) : width}
      $minSize={
        size && ['connectorAvatar', 'accountAvatar'].includes(variant) ? mapAvatarSize(size) : null
      }
      animation={animation}
    />
  )
}

const StyledSkeleton = styled(MuiSkeleton)<{ $minSize?: number | null }>`
  && {
    &.MuiSkeleton-root {
      background-color: ${theme.palette.grey[100]};
    }

    &.MuiSkeleton-text {
      transform: none;
      border-radius: 32px;
    }

    &.skeleton--connector {
      border-radius: 12px;
      ${({ $minSize }) =>
        $minSize &&
        css`
          min-width: ${$minSize}px;
        `}
    }
  }
`
