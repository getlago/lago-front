import { forwardRef, MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ConditionalWrapper, tw } from '~/lib'

import { Button, ButtonProps, SimpleButtonProps } from './Button'
import { IconName } from './Icon'

enum ButtonLinkTypeEnum {
  tab = 'tab',
  button = 'button',
}

export interface ButtonLinkBaseProps {
  className?: string
  to: string
  routerState?: Record<string, string | boolean>
  type: keyof typeof ButtonLinkTypeEnum
  disabled?: boolean
  external?: boolean
  children?: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
}

export interface ButtonLinkTabProps extends ButtonLinkBaseProps {
  type: 'tab'
  icon?: IconName
  title?: string
  active?: boolean
  canBeClickedOnActive?: boolean
  buttonProps?: Pick<ButtonProps, 'size' | 'variant'>
}

interface ButtonLinkButtonProps extends ButtonLinkBaseProps {
  type: 'button'
  title?: string
  buttonProps?: Omit<ButtonProps, 'disabled'>
  icon?: never
  active?: never
  canBeClickedOnActive?: never
}

type ButtonLinkProps = ButtonLinkTabProps | ButtonLinkButtonProps

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      className,
      to,
      title,
      routerState,
      icon,
      active,
      disabled,
      external,
      type,
      buttonProps,
      children,
      canBeClickedOnActive,
      onClick,
      ...props
    }: ButtonLinkProps,
    ref,
  ) => {
    const classNames = tw(
      {
        'pointer-events-none': (active && !canBeClickedOnActive) || disabled,
      },
      className,
    )

    return (
      <ConditionalWrapper
        condition={!!external}
        validWrapper={(wrapperChildren) => (
          <a
            tabIndex={-1}
            className={classNames}
            href={to}
            ref={ref}
            rel="noopener noreferrer"
            target="_blank"
            data-test="external-button-link"
            {...props}
          >
            {wrapperChildren}
          </a>
        )}
        invalidWrapper={(wrapperChildren) => (
          <Link
            tabIndex={-1}
            className={classNames}
            to={to}
            state={routerState}
            ref={ref}
            data-test={`tab-internal-button-link-${title?.toLowerCase()}`}
          >
            {wrapperChildren}
          </Link>
        )}
      >
        <Button
          onClick={onClick}
          disabled={disabled}
          data-test="button-link-button"
          {...((type === ButtonLinkTypeEnum.tab
            ? {
                variant: active ? 'secondary' : 'quaternary',
                align: 'left',
                fullWidth: true,
                startIcon: icon,
                ...buttonProps,
              }
            : buttonProps || {}) as SimpleButtonProps)}
        >
          {children}
        </Button>
      </ConditionalWrapper>
    )
  },
)

ButtonLink.displayName = 'ButtonLink'
