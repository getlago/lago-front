/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef, MouseEvent, ReactNode, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { theme } from '~/styles'

import { Icon, IconName } from '../../designSystem/Icon'
import { Typography } from '../../designSystem/Typography'

export interface TabButtonProps {
  active?: boolean
  title?: string | number | boolean
  disabled?: boolean
  icon?: IconName | ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => unknown
}

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  (
    { active = false, title, icon, className, disabled, onClick, ...props }: TabButtonProps,
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

    return (
      <Container
        {...props}
        ref={ref}
        className={className}
        $active={active}
        disabled={disabled}
        tabIndex={disabled || active ? -1 : 0}
        onClick={(e) => {
          e.preventDefault()

          if (onClick) {
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
        }}
      >
        {isLoading ? (
          <Icon name="processing" animation="spin" />
        ) : typeof icon === 'string' ? (
          <Icon name={icon as IconName} />
        ) : (
          !!icon && icon
        )}
        {title && (
          <Label noWrap color="inherit">
            {title}
          </Label>
        )}
      </Container>
    )
  },
)

TabButton.displayName = 'TabButton'

const Container = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) =>
    $active ? theme.palette.grey[200] : theme.palette.common.white};
  color: ${({ $active }) => ($active ? theme.palette.primary.main : theme.palette.text.primary)};
  border-radius: 12px;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  ${({ $active }) =>
    !$active &&
    css`
      box-shadow: 0px 0px 0px 1px ${theme.palette.grey[500]} inset;

      &:focus:not(:active) {
        box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
        border-radius: 12px;
      }
    `}

  ${({ $active }) =>
    !$active &&
    css`
      :hover:not(:disabled) {
        background-color: ${theme.palette.grey[200]};
        color: ${theme.palette.text.primary};
      }
    `}

  &:disabled {
    cursor: default;
    background-color: ${({ $active }) => ($active ? theme.palette.grey[100] : 'transparent')};
    color: ${theme.palette.grey[400]};
    box-shadow: none;
  }

  > *:not(:last-child) {
    margin-right: ${theme.spacing(2)};
  }
`

const Label = styled(Typography)`
  flex: 1;
`
