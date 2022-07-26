import { forwardRef, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { theme } from '~/styles'
import { ConditionalWrapper } from '~/components/ConditionalWrapper'

import { Icon, IconName } from './Icon'
import { Typography } from './Typography'

export interface ButtonLinkProps {
  to: string
  title?: string | number
  icon?: IconName
  active?: boolean
  disabled?: boolean
  external?: boolean
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ to, title, icon, active, disabled, external, onClick }: ButtonLinkProps, ref) => {
    const onMouseDown = (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      onClick && onClick(e)
      const element = document.activeElement as HTMLElement

      element.blur && element.blur()
    }

    return (
      <ConditionalWrapper
        condition={!!external}
        validWrapper={(children) => (
          <ExternalLink
            ref={ref}
            href={to}
            rel="noopener noreferrer"
            target="_blank"
            $active={active}
            $disabled={disabled}
            onMouseDown={onMouseDown}
          >
            {children}
          </ExternalLink>
        )}
        invalidWrapper={(children) => (
          <InternalLink
            ref={ref}
            to={to}
            $active={active}
            $disabled={disabled}
            onMouseDown={onMouseDown}
          >
            {children}
          </InternalLink>
        )}
      >
        {icon && <Icon name={icon} />}
        <Label noWrap color="inherit">
          {title}
        </Label>
      </ConditionalWrapper>
    )
  }
)

ButtonLink.displayName = 'ButtonLink'

const Container = css<{ $active?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: 12px !important;
  padding: 6px 12px;
  height: 40px;
  border: none;
  cursor: pointer;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  background-color: ${({ $active }) =>
    $active ? theme.palette.grey[200] : theme.palette.common.white};
  color: ${({ $active }) => ($active ? theme.palette.primary.main : theme.palette.text.primary)};

  &:focus,
  &:active,
  &:hover {
    outline: none;
    text-decoration: none;
  }

  ${({ $active, $disabled }) =>
    $disabled
      ? css`
          background-color: ${$active ? theme.palette.grey[100] : 'transparent'};
          color: ${theme.palette.grey[400]};
          box-shadow: none;
          pointer-events: none;
        `
      : !$active &&
        css`
          &:hover {
            background-color: ${theme.palette.grey[200]};
            color: ${theme.palette.text.primary};
          }
          &:focus:not(:active) {
            box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
            border-radius: 12px;
          }
        `}

  > *:not(:last-child) {
    margin-right: ${theme.spacing(2)};
  }
`

const InternalLink = styled(Link)<{ $active?: boolean; $disabled?: boolean }>`
  ${Container}
`
const ExternalLink = styled.a<{ $active?: boolean; $disabled?: boolean }>`
  ${Container}
`

const Label = styled(Typography)`
  flex: 1;
`
