/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable react/prop-types */
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'
import clsns from 'classnames'
import { forwardRef, MouseEvent, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { Icon, IconName } from './Icon'

enum ButtonVariantEnum {
  primary = 'primary',
  secondary = 'secondary',
  tertiary = 'tertiary',
  quaternary = 'quaternary',
  'quaternary-dark' = 'quaternary-dark',
  'quaternary-light' = 'quaternary-light',
}

type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonVariant = keyof typeof ButtonVariantEnum
type MuiVariant = 'text' | 'outlined' | 'contained'
type ButtonAlign = 'center' | 'left' | 'space-between'
type MuiColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | undefined

interface SimpleButtonProps
  extends Pick<
    MuiButtonProps,
    'id' | 'disabled' | 'children' | 'onClick' | 'fullWidth' | 'tabIndex'
  > {
  size?: ButtonSize
  variant?: ButtonVariant
  danger?: boolean
  icon?: never
  align?: ButtonAlign
  endIcon?: IconName
  startIcon?: IconName
  loading?: boolean // If the `onClick` function returns a promise, the loading state will be handled automatically
  className?: string
  inheritColor?: boolean // This will only work for quaternary buttons
}
interface ButtonIconProps
  extends Omit<SimpleButtonProps, 'icon' | 'size' | 'endIcon' | 'startIcon' | 'children'> {
  size?: ButtonSize
  icon: IconName // If used, the button will only display an icon (no matter if there's a children)
  endIcon?: never
  startIcon?: never
  children?: never
}

export type ButtonProps = ButtonIconProps | SimpleButtonProps

// Map the names used in our design system to match the MUI ones
const mapProperties = (variant: ButtonVariant, inheritColor: boolean) => {
  switch (variant) {
    case ButtonVariantEnum.secondary:
      return {
        color: 'inherit' as MuiColor,
        variant: 'contained' as MuiVariant,
      }
    case ButtonVariantEnum.tertiary:
      return {
        color: 'inherit' as MuiColor,
        variant: 'outlined' as MuiVariant,
        sx: {
          borderColor: 'inherit',
        },
      }
    case ButtonVariantEnum.quaternary:
    case ButtonVariantEnum['quaternary-light']:
    case ButtonVariantEnum['quaternary-dark']:
      return {
        color: inheritColor ? 'inherit' : ('inherit' as MuiColor),
        variant: 'text' as MuiVariant,
      }
    case ButtonVariantEnum.primary:
    default:
      return {
        color: 'primary' as MuiColor,
        variant: 'contained' as MuiVariant,
      }
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      align = 'center',
      variant = ButtonVariantEnum.primary,
      size = 'medium',
      danger = false,
      disabled = false,
      icon,
      startIcon,
      className,
      endIcon,
      loading = false,
      children,
      inheritColor,
      onClick,
      ...props
    }: ButtonProps,
    ref,
  ) => {
    const [isLoading, setIsLoading] = useState(false)
    const mountedRef = useRef(false)

    useEffect(() => {
      // This is for preventing setstate on unmounted component
      mountedRef.current = true

      return () => {
        mountedRef.current = false
      }
    }, [])

    const localLoading = loading || isLoading

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
      if (onClick && !localLoading) {
        const res = onClick(e)

        if (res !== null && (res as any) instanceof Promise) {
          let realLoading = true

          // This is to prenvent icon blink if the loading time is really small
          setTimeout(() => {
            if (mountedRef.current && realLoading) setIsLoading(true)
          }, 100)
          ;(res as unknown as Promise<any>).finally(() => {
            if (mountedRef.current) {
              realLoading = false
              setIsLoading(false)
            }
          })
        }
      }
    }

    return (
      <StyledButton
        className={clsns(className, {
          'button-danger': danger,
          'button-icon-only': icon && !children,
          'button-quaternary-light': variant === 'quaternary-light',
          'button-quaternary-dark': variant === 'quaternary-dark',
        })}
        $align={align}
        onClick={handleClick}
        size={size}
        data-test="button"
        disableElevation
        disableRipple
        disabled={disabled}
        ref={ref}
        endIcon={
          localLoading && !icon && !startIcon ? (
            <Icon animation="spin" name="processing" />
          ) : (
            endIcon && <Icon name={endIcon} />
          )
        }
        startIcon={
          localLoading && !icon && !!startIcon ? (
            <Icon animation="spin" name="processing" />
          ) : (
            startIcon && <Icon name={startIcon} />
          )
        }
        {...mapProperties(variant, !!inheritColor)}
        {...props}
      >
        {icon ? (
          localLoading ? (
            <Icon animation="spin" name="processing" />
          ) : (
            <Icon name={icon} />
          )
        ) : (
          children
        )}
      </StyledButton>
    )
  },
)

Button.displayName = 'Button'

const StyledButton = styled(MuiButton)<{ $align?: ButtonAlign }>`
  white-space: nowrap;
  justify-content: ${({ $align }) => $align ?? 'inherit'} !important;
  min-width: unset;

  > svg:hover {
    cursor: pointer;
  }
`
