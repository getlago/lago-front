import { cx } from 'class-variance-authority'
import { MouseEvent, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { Icon, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

enum LabelPositionEnum {
  left = 'left',
  right = 'right',
}

type LabelPosition = keyof typeof LabelPositionEnum
export interface SwitchProps {
  name: string
  disabled?: boolean
  checked?: boolean
  label?: string
  subLabel?: string
  labelPosition?: LabelPosition
  onChange?: (value: boolean, e: MouseEvent<HTMLDivElement>) => Promise<unknown> | void
}

export const Switch = ({
  name,
  label,
  subLabel,
  disabled,
  checked,
  labelPosition = LabelPositionEnum.right,
  onChange,
  ...props
}: SwitchProps) => {
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
      $orientation={labelPosition}
      onClick={
        disabled
          ? undefined
          : (e) => {
              e.stopPropagation()

              if (onChange) {
                const res = onChange(!checked, e)

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
                    }
                  })
                }
              } else {
                inputRef.current?.click()
              }
            }
      }
    >
      <SwitchContainer
        $checked={!!checked}
        className={cx('switchField', {
          'switchField--disabled': disabled,
          'switchField--focused': focused,
          'switchField--loading': loading,
        })}
      >
        <input
          readOnly
          {...props}
          ref={inputRef}
          disabled={disabled || loading}
          aria-label={name}
          checked={checked}
          type="checkbox"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {loading && <Loader animation="spin" name="processing" color="light" />}
        <StyledTypography color={disabled ? 'inherit' : 'white'} variant="noteHl">
          On
        </StyledTypography>
        <StyledTypography color={disabled ? 'inherit' : 'disabled'} variant="noteHl">
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
      </SwitchContainer>
      {(!!label || !!subLabel) && (
        <>
          <Space />
          <LabelContainer $disabled={disabled}>
            {!!label && <Typography color="textSecondary">{label}</Typography>}
            {!!subLabel && <Typography variant="caption">{subLabel}</Typography>}
          </LabelContainer>
        </>
      )}
    </Container>
  )
}

Switch.displayName = 'Switch'

const Container = styled.div<{ $orientation: LabelPosition }>`
  display: flex;
  align-items: center;
  flex-direction: ${({ $orientation }) =>
    $orientation === LabelPositionEnum.right ? 'row' : 'row-reverse'};
`

const LabelContainer = styled.div<{ $disabled?: boolean }>`
  ${({ $disabled }) =>
    !$disabled &&
    css`
      cursor: pointer;
    `}
`

const Space = styled.div`
  width: ${theme.spacing(3)};
  min-width: ${theme.spacing(3)};
  min-height: 1px;
`

const Loader = styled(Icon)`
  position: absolute;
  left: 20px;
  transition:
    left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  opacity: 0;
`

const SwitchElement = styled.svg<{ $checked: boolean }>`
  position: absolute;
  left: ${(props) => (props.$checked ? theme.spacing(8) : theme.spacing(1))};
  transition:
    left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  opacity: 1;
`

const StyledTypography = styled(Typography)`
  width: 24px;
  text-align: center;
  transition:
    left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  opacity: 1;
`

const SwitchContainer = styled.div<{ $checked: boolean }>`
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
