import clsns from 'classnames'
import { cloneElement } from 'react'
import styled from 'styled-components'

import { theme } from '~/styles'

import { ALL_ICONS } from './mapping'

export type IconName = keyof typeof ALL_ICONS
export type IconColor =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'skeleton'
  | 'disabled'
  | 'input'
  | 'primary'

enum IconAnimationEnum {
  spin = 'spin',
  pulse = 'pulse',
}
interface IconProps {
  name: IconName
  size?: 'small' | 'medium' | 'large'
  color?: IconColor
  className?: string
  animation?: keyof typeof IconAnimationEnum
  onClick?: () => {} | void | Promise<void>
}

enum IconSizeEnum {
  small = '12px',
  medium = '16px',
  large = '24px',
}

const mapColor = (color?: IconColor) => {
  switch (color) {
    case 'primary':
      return theme.palette.primary.main
    case 'success':
      return theme.palette.success.main
    case 'error':
      return theme.palette.error.main
    case 'warning':
      return theme.palette.warning.main
    case 'info':
      return theme.palette.info.main
    case 'light':
      return theme.palette.common.white
    case 'dark':
      return theme.palette.grey[600]
    case 'input':
      return theme.palette.grey[500]
    case 'disabled':
      return theme.palette.grey[400]
    case 'skeleton':
      return theme.palette.grey[100]
    default:
      return 'inherit'
  }
}

export const Icon = ({
  name,
  size = 'medium',
  color,
  className,
  animation,
  onClick,
}: IconProps) => {
  const SVGIcon = ALL_ICONS[name]

  return (
    <StyledIcon
      title={`${name}/${size}`}
      data-test={`${name}/${size}`}
      $size={size}
      $canClick={!!onClick}
      className={clsns('svg-icon', className, { [`icon-animation--${animation}`]: animation })}
      $color={mapColor(color)}
      component={<SVGIcon />}
      onClick={onClick}
    />
  )
}

const StyledIcon = styled(({ component, ...props }) => cloneElement(component, props))`
  width: ${(props: { $size: keyof typeof IconSizeEnum }) => IconSizeEnum[props.$size]};
  min-width: ${(props: { $size: keyof typeof IconSizeEnum }) => IconSizeEnum[props.$size]};
  height: ${(props: { $size: keyof typeof IconSizeEnum }) => IconSizeEnum[props.$size]};
  color: ${(props) => props.$color};
  cursor: ${({ $canClick }) => ($canClick ? 'pointer' : 'initial')};

  &.icon-animation--${IconAnimationEnum.spin} {
    animation: spin 1s linear infinite;
  }

  &.icon-animation--${IconAnimationEnum.pulse} {
    animation: pulse 1.5s ease-in-out 0.5s infinite;
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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`
