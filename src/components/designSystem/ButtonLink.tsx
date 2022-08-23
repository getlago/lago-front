import { forwardRef, MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { clsx } from 'clsx'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'

import { IconName } from './Icon'
import { Button, ButtonProps } from './Button'

enum ButtonLinkTypeEnum {
  tab = 'tab',
  button = 'button',
}
export interface ButtonLinkBaseProps {
  className?: string
  to: string
  type: keyof typeof ButtonLinkTypeEnum
  disabled?: boolean
  external?: boolean
  children?: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
}

export interface ButtonLinkTabProps extends ButtonLinkBaseProps {
  type: 'tab'
  icon?: IconName
  active?: boolean
  canBeClickedOnActive?: boolean
  buttonProps?: never
}

interface ButtonLinkButtonProps extends ButtonLinkBaseProps {
  type: 'button'
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
      icon,
      active,
      disabled,
      external,
      type,
      buttonProps,
      children,
      canBeClickedOnActive,
      onClick,
    }: ButtonLinkProps,
    ref
  ) => {
    const updatedButtonProps =
      type === ButtonLinkTypeEnum.tab
        ? {
            variant: active ? 'secondary' : 'quaternary',
            align: 'left',
            fullWidth: true,
            startIcon: icon,
          }
        : buttonProps || {}

    const classNames = clsx(className, {
      'button-link-disabled': (active && !canBeClickedOnActive) || disabled,
    })

    return (
      <ConditionalWrapper
        condition={!!external}
        validWrapper={(wrapperChildren) => (
          <ExternalButtonLink
            tabIndex={-1}
            className={classNames}
            href={to}
            ref={ref}
            rel="noopener noreferrer"
            target="_blank"
          >
            {wrapperChildren}
          </ExternalButtonLink>
        )}
        invalidWrapper={(wrapperChildren) => (
          <InternalButtonLink tabIndex={-1} className={classNames} to={to} ref={ref}>
            {wrapperChildren}
          </InternalButtonLink>
        )}
      >
        {/* @ts-ignore */}
        <Button onClick={onClick} disabled={disabled} {...updatedButtonProps}>
          {children}
        </Button>
      </ConditionalWrapper>
    )
  }
)

ButtonLink.displayName = 'ButtonLink'

const LinkBase = css`
  &:focus,
  &:active,
  &:hover {
    outline: none;
    text-decoration: none;
  }

  &.button-link-disabled,
  &.button-link-disabled > button {
    pointer-events: none;
  }
`

const InternalButtonLink = styled(Link)`
  ${LinkBase}
`

const ExternalButtonLink = styled.a`
  ${LinkBase}
`
