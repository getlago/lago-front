/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, MouseEvent, forwardRef, useState, useRef, useEffect } from 'react'
import styled, { css } from 'styled-components'

import { theme } from '~/styles'

import { Icon, IconName } from './Icon'
import { Typography } from './Typography'

export interface TabButtonProps {
  active?: boolean
  title?: string
  icon?: IconName | ReactNode
  canClickOnActive?: boolean
  className?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => unknown
}

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ active, title, icon, className, canClickOnActive = false, onClick }: TabButtonProps, ref) => {
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
        ref={ref}
        className={className}
        $active={!!active}
        disabled={!canClickOnActive && active}
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
  }
)

TabButton.displayName = 'TabButton'

const Container = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) =>
    props.$active ? theme.palette.grey[200] : theme.palette.common.white};
  color: ${(props) => (props.$active ? theme.palette.primary.main : theme.palette.text.primary)};
  border-radius: 12px;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  :focus:not(:active) {
    box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
    border-radius: 12px;
  }

  ${(props) =>
    !props.$active &&
    css`
      :hover {
        background-color: ${theme.palette.grey[200]};
        color: ${theme.palette.text.primary};
      }
    `}

  > *:not(:last-child) {
    margin-right: ${theme.spacing(2)};
  }
`

const Label = styled(Typography)`
  flex: 1;
`
