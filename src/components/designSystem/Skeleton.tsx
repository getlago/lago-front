import { Skeleton as MuiSkeleton, SkeletonProps as MuiSkeletonProps } from '@mui/material'
import styled, { css } from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'

import { AvatarSize, mapAvatarSize } from './Avatar'

enum SkeletonVariantEnum {
  connectorAvatar = 'connectorAvatar',
  companyAvatar = 'companyAvatar',
  userAvatar = 'userAvatar',
}

type TSkeletonVariant =
  | keyof typeof SkeletonVariantEnum
  | Extract<MuiSkeletonProps['variant'], 'circular' | 'rectangular' | 'text'>

interface SkeletonConnectorProps extends Pick<MuiSkeletonProps, 'animation'> {
  variant: Extract<TSkeletonVariant, 'companyAvatar' | 'userAvatar' | 'connectorAvatar'>
  size: AvatarSize
  width?: never
  height?: never
  className?: string
  marginRight?: number | string
  marginBottom?: number | string
}

interface SkeletonGenericProps extends Pick<MuiSkeletonProps, 'animation' | 'width' | 'height'> {
  variant: TSkeletonVariant
  size?: never
  className?: string
  marginRight?: number | string
  marginBottom?: number | string
}

const mapVariant = (variant: TSkeletonVariant): MuiSkeletonProps['variant'] => {
  switch (variant) {
    case SkeletonVariantEnum.connectorAvatar:
    case SkeletonVariantEnum.companyAvatar:
      return 'rectangular'
    case SkeletonVariantEnum.userAvatar:
      return 'circular'
    default:
      return variant as MuiSkeletonProps['variant']
  }
}

export type SkeletonProps = SkeletonConnectorProps | SkeletonGenericProps

export const Skeleton = ({
  variant = 'text',
  size,
  width,
  height,
  animation = 'pulse',
  className,
  marginBottom,
  marginRight,
}: SkeletonProps) => {
  return (
    <StyledSkeleton
      className={clsns(className, `skeleton-variant--${variant}`, {
        [`skeleton-size--${size}`]: !!size,
      })}
      variant={mapVariant(variant)}
      height={size ? mapAvatarSize(size) : height}
      width={size ? mapAvatarSize(size) : width}
      $minSize={
        size && ['connectorAvatar', 'companyAvatar'].includes(variant) ? mapAvatarSize(size) : null
      }
      $marginBottom={marginBottom}
      $marginRight={marginRight}
      animation={animation}
    />
  )
}

const StyledSkeleton = styled(MuiSkeleton)<{
  $minSize?: number | null
  $marginBottom?: number | string | null
  $marginRight?: number | string | null
}>`
  && {
    &.MuiSkeleton-root {
      background-color: ${theme.palette.grey[100]};
      ${({ $marginBottom }) =>
        $marginBottom &&
        css`
          margin-bottom: ${$marginBottom};
        `}
      ${({ $marginRight }) =>
        $marginRight &&
        css`
          margin-right: ${$marginRight};
        `}

        max-width: 100%;
    }

    &.skeleton-variant--text {
      transform: none;
      border-radius: 32px;
    }

    &.skeleton-variant--rectangular {
      border-radius: 12px;
    }

    &.skeleton-variant--connectorAvatar {
      border-radius: 12px;

      &.skeleton-size--small {
        border-radius: 4px;
      }
      ${({ $minSize }) =>
        $minSize &&
        css`
          min-width: ${$minSize}px;
        `}
    }
  }
`
