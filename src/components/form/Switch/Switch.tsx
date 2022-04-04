import styled from 'styled-components'
import clsns from 'classnames'
import { useRef, useState, useEffect, MouseEvent } from 'react'

import { Typography, Icon } from '~/components/designSystem'
import { theme } from '~/styles'

export interface SwitchProps {
  name: string
  disabled?: boolean
  checked?: boolean
  onClick?: (e: MouseEvent<HTMLDivElement>) => Promise<void> | void
  onChange?: (value: boolean) => void
}

export const Switch = ({ name, disabled, checked, onChange, onClick, ...props }: SwitchProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(false)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // This is for preventing setstate on unmounted component
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <Container
      $checked={!!checked}
      className={clsns('switchField', {
        'switchField--disabled': disabled,
        'switchField--focused': focused,
        'switchField--loading': loading,
      })}
      onClick={(e) => {
        if (onClick) {
          const res = onClick(e)

          if (res !== null && res instanceof Promise) {
            let realLoading = true

            // This is to prenvent icon blink if the loading time is really small
            setTimeout(() => {
              if (mountedRef.current && realLoading) setLoading(true)
            }, 100)
            res.finally(() => {
              if (mountedRef.current) {
                realLoading = false
                setLoading(false)
                onChange && onChange(!checked)
              }
            })
          }
        } else {
          inputRef.current?.click()
        }
      }}
    >
      <input
        {...props}
        ref={inputRef}
        disabled={disabled || loading}
        aria-label={name}
        checked={checked}
        type="checkbox"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={onChange && ((e) => onChange(e.currentTarget.checked))}
      />
      <Loader animation="spin" name="processing" color="light" />
      <StyledTypography color={disabled ? 'inherit' : 'contrast'} variant="note">
        On
      </StyledTypography>
      <StyledTypography color={disabled ? 'inherit' : 'disabled'} variant="note">
        Off
      </StyledTypography>
      <SwitchElement width="24" height="24" viewBox="0 0 24 24" $checked={!!checked}>
        <circle
          cx="12"
          cy="12"
          r="12"
          fill={
            disabled
              ? theme.palette.grey[300]
              : checked
              ? theme.palette.common.white
              : theme.palette.grey[500]
          }
        />
        <circle cx="12" cy="12" r="11" fill={theme.palette.common.white} />
      </SwitchElement>
    </Container>
  )
}

Switch.displayName = 'Switch'

const Loader = styled(Icon)`
  position: absolute;
  left: 20px;
  transition: left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  opacity: 0;
`

const SwitchElement = styled.svg<{ $checked: boolean }>`
  position: absolute;
  left: ${(props) => (props.$checked ? theme.spacing(8) : theme.spacing(1))};
  transition: left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  opacity: 1;
`

const StyledTypography = styled(Typography)`
  width: 24px;
  text-align: center;
  transition: left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  opacity: 1;
`

const Container = styled.div<{ $checked: boolean }>`
  border-radius: 32px;
  width: 60px;
  max-width: 60px;
  min-width: 60px;
  box-sizing: border-box;
  height: 32px;
  position: relative;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${theme.spacing(1)};

  :not(.switchField--disabled):not(.switchField--loading) {
    cursor: pointer;
    background-color: ${(props) =>
      props.$checked ? theme.palette.primary.main : theme.palette.grey[200]};

    &:hover {
      background-color: ${(props) =>
        props.$checked ? theme.palette.primary[700] : theme.palette.grey[300]};
    }

    &:active {
      background-color: ${(props) =>
        props.$checked ? theme.palette.primary[800] : theme.palette.grey[400]};
    }

    &.switchField--focused {
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
    }
  }

  &.switchField--loading {
    justify-content: center;
    background-color: ${theme.palette.primary.main};

    ${StyledTypography}, ${SwitchElement} {
      opacity: 0;
    }

    ${Loader} {
      opacity: 1;
    }
  }

  &.switchField--disabled {
    background-color: ${theme.palette.grey[100]};
    color: ${theme.palette.grey[400]};
  }

  input {
    opacity: 0;
    position: absolute;
    width: 0;
    height: 0;
    margin: 0;
    padding: 0;
  }
`
