import {
  forwardRef,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { alpha } from '@mui/material/styles'
import styled from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'

import { Icon, IconName } from './Icon'

enum ButtonSizeEnum {
  medium = 'medium',
  large = 'large',
}
enum ButtonIconSizeEnum {
  small = 'small',
  medium = 'medium',
  large = 'large',
}
enum ButtonVariantEnum {
  primary = 'primary',
  secondary = 'secondary',
  tertiary = 'tertiary',
  quaternary = 'quaternary',
  'quaternary-dark' = 'quaternary-dark',
  'quaternary-light' = 'quaternary-light',
}

enum ButtonAlignEnum {
  center = 'center',
  left = 'left',
  'space-between' = 'space-between',
}

export type ButtonVariant = keyof typeof ButtonVariantEnum

interface SimpleButtonProps {
  align?: keyof typeof ButtonAlignEnum
  children?: ReactNode
  className?: string
  danger?: boolean
  disabled?: boolean
  endIcon?: IconName
  fullWidth?: boolean
  inheritColor?: boolean // This will only work for quaternary buttons
  loading?: boolean // If the `onClick` function returns a promise, the loading state will be handled automatically
  size?: keyof typeof ButtonSizeEnum
  startIcon?: IconName
  tabIndex?: number | null
  variant?: ButtonVariant
  icon?: never
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined
}
interface ButtonIconProps
  extends Omit<SimpleButtonProps, 'icon' | 'size' | 'endIcon' | 'startIcon' | 'children'> {
  icon: IconName // If used, the button will only display an icon
  size?: keyof typeof ButtonIconSizeEnum
  endIcon?: never
  startIcon?: never
  children?: never
}

export type ButtonProps = ButtonIconProps | SimpleButtonProps

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      align = ButtonAlignEnum.center,
      children,
      className,
      danger,
      disabled,
      endIcon,
      fullWidth,
      icon,
      inheritColor,
      loading,
      size,
      startIcon,
      tabIndex,
      variant = ButtonVariantEnum.primary,
      onClick,
      ...props
    }: ButtonProps,
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const mountedRef = useRef(false)
    const localLoading = loading || isLoading

    useEffect(() => {
      // This is for preventing setstate on unmounted component
      mountedRef.current = true

      return () => {
        mountedRef.current = false
      }
    }, [])

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
      ;((ref as unknown as RefObject<HTMLButtonElement>) || buttonRef)?.current?.blur()
      e.preventDefault()
      console.log(typeof onClick)

      if (onClick) {
        const res = onClick(e)

        if (res !== null && (res as unknown) instanceof Promise) {
          let realLoading = true

          // This is to prenvent icon blink if the loading time is really small
          setTimeout(() => {
            if (mountedRef.current && realLoading) setIsLoading(true)
          }, 100)
          ;(res as unknown as Promise<unknown>).finally(() => {
            if (mountedRef.current) {
              realLoading = false
              setIsLoading(false)
            }
          })
        }
      }
    }

    return (
      <Container
        ref={ref || buttonRef}
        disabled={disabled}
        tabIndex={tabIndex || 0}
        className={clsns(className, {
          [`button-size--${size}`]: true,
          [`button-variant--${variant}`]: true,
          ['button--icon-only']: !!icon,
          ['button--danger']: danger,
          ['button--fullWidth']: fullWidth,
          ['button--inheritColor']: inheritColor,
        })}
        $align={align}
        onClick={handleClick}
        {...props}
      >
        {localLoading && !icon && !!startIcon ? (
          <StartIcon animation="spin" name="processing" />
        ) : (
          startIcon && <StartIcon name={startIcon} />
        )}
        {icon ? (
          localLoading ? (
            <Icon animation="spin" name="processing" />
          ) : (
            <Icon name={icon} />
          )
        ) : (
          children
        )}
        {localLoading && !icon && !startIcon ? (
          <EndIcon animation="spin" name="processing" />
        ) : (
          endIcon && <EndIcon name={endIcon} />
        )}
      </Container>
    )
  }
)

Button.displayName = 'Button'

const StartIcon = styled(Icon)`
  margin-right: ${theme.spacing(2)};
`

const EndIcon = styled(Icon)`
  margin-left: ${theme.spacing(2)};
`

const Container = styled.button<{ $align?: keyof typeof ButtonAlignEnum }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => $align};
  border-radius: 12px;
  min-width: auto;
  background-color: unset;
  padding: 6px 12px;
  font-size: 16px;
  line-height: 28px;
  font-weight: 400;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  svg {
    cursor: pointer;
  }

  :focus:not(:active):not(:disabled) {
    box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
    outline: none;
  }

  &.button--fullWidth {
    width: 100%;
  }

  // ------------ Variant
  &.button-variant--${ButtonVariantEnum.primary} {
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.common.white};

    :hover {
      background-color: ${theme.palette.primary[700]};
    }
    :active {
      background-color: ${theme.palette.primary[800]};
    }

    &.button--danger {
      background-color: ${theme.palette.error.main};

      :hover {
        background-color: ${theme.palette.error[700]};
      }
      :active {
        background-color: ${theme.palette.error[800]};
      }
    }

    :disabled {
      color: ${theme.palette.grey[400]};
      background-color: ${theme.palette.grey[100]};
      cursor: unset;
    }
  }

  &.button-variant--${ButtonVariantEnum.secondary} {
    background-color: ${theme.palette.grey[200]};
    color: ${theme.palette.primary.main};

    :hover {
      background-color: ${theme.palette.grey[300]};
    }
    :active {
      background-color: ${theme.palette.grey[400]};
    }

    &.button--danger {
      color: ${theme.palette.error.main};
      background-color: ${theme.palette.error[100]};

      :hover {
        background-color: ${theme.palette.error[200]};
      }
      :active {
        background-color: ${theme.palette.error[300]};
      }
    }

    :disabled {
      color: ${theme.palette.grey[400]};
      background-color: ${theme.palette.grey[100]};
      cursor: unset;
    }
  }

  &.button-variant--${ButtonVariantEnum.tertiary} {
    color: ${theme.palette.grey[600]};
    border: 1px solid ${theme.palette.grey[500]};

    :hover {
      background-color: ${theme.palette.grey[200]};
    }
    :active {
      background-color: ${theme.palette.grey[300]};
    }

    &.button--danger {
      color: ${theme.palette.error.main};
      border: 1px solid ${theme.palette.error[500]};

      :hover {
        background-color: ${theme.palette.error[100]};
      }
      :active {
        background-color: ${theme.palette.error[200]};
      }
    }

    :disabled {
      color: ${theme.palette.grey[400]};
      background-color: ${theme.palette.grey[100]};
      border: none;
      cursor: unset;
    }
  }

  &.button-variant--${ButtonVariantEnum.quaternary} {
    color: ${theme.palette.grey[600]};
    border: none;

    :hover {
      background-color: ${theme.palette.grey[200]};
    }
    :active {
      background-color: ${theme.palette.grey[300]};
    }

    &.button--danger {
      color: ${theme.palette.error.main};
      border: none;

      :hover {
        background-color: ${theme.palette.error[100]};
      }
      :active {
        background-color: ${theme.palette.error[200]};
      }
    }

    :disabled {
      color: ${theme.palette.grey[400]};
      background-color: initial;
      border: none;
      cursor: unset;
    }
  }

  &.button-variant--${ButtonVariantEnum['quaternary-light']} {
    color: ${theme.palette.common.white};
    border: none;

    :hover:not(:disabled) {
      background-color: ${alpha(theme.palette.grey[100], 0.1)};
    }
    :active:not(:disabled) {
      background-color: ${alpha(theme.palette.grey[100], 0.2)};
    }

    :disabled {
      cursor: unset;
    }
  }

  &.button-variant--${ButtonVariantEnum['quaternary-dark']} {
    color: ${theme.palette.grey[700]};
    border: none;

    :hover:not(:disabled) {
      background-color: ${alpha(theme.palette.grey[700], 0.1)};
    }
    :active:not(:disabled) {
      background-color: ${alpha(theme.palette.grey[700], 0.2)};
    }

    :disabled {
      cursor: unset;
    }
  }
  // ------------ Size
  &.button-size--${ButtonSizeEnum.large} {
    height: 48px;

    &.button--icon-only {
      padding: 12px;
      min-width: unset;
      width: 48px;
    }
  }
  &.button-size--${ButtonSizeEnum.medium} {
    height: 40px;

    &.button--icon-only {
      padding: 12px;
      min-width: unset;
      width: 40px;
    }
  }
  &.button-size--${ButtonIconSizeEnum.small}.button--icon-only {
    width: 24px;
    height: 24px;
    padding: 4px;
    min-width: unset;
    border-radius: 8px;
  }

  &.button--inheritColor {
    color: inherit;
  }
`
