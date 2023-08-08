import { forwardRef, ReactNode, useRef, useState } from 'react'
import clsns from 'classnames'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import RadioIcon from '~/public/icons/forms/radio.svg'
import RadioCheckedIcon from '~/public/icons/forms/radio-checked.svg'

export interface RadioProps {
  name?: string
  value: string | number
  checked: boolean
  disabled?: boolean
  label?: string | ReactNode
  sublabel?: string | ReactNode
  onChange?: (value: string | number) => void
}

export const Radio = forwardRef<HTMLDivElement, RadioProps>(
  ({ name, checked, label, sublabel, disabled, value, onChange }: RadioProps, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [focused, setFocused] = useState(false)

    return (
      <Container
        ref={ref}
        onClick={() => inputRef.current?.click()}
        className={clsns({
          'radio--disabled': disabled,
          'radio--focused': focused,
          'radio--checked': checked,
          'radio--unchecked': !checked,
        })}
      >
        <RadioContainer>
          <input
            readOnly
            ref={inputRef}
            disabled={disabled}
            aria-label={name}
            value={value}
            type="radio"
            onClick={() => onChange && onChange(value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {checked ? (
            <RadioCheckedIcon className="radio-icon" />
          ) : (
            <RadioIcon className="radio-icon" />
          )}
        </RadioContainer>
        <div>
          <Typography
            color={disabled ? 'disabled' : 'textSecondary'}
            component={(labelProps) => <label htmlFor={name} {...labelProps} />}
          >
            {label}
          </Typography>
          {!!label &&
            (typeof sublabel === 'string' ? (
              <Typography variant="caption" color={disabled ? 'disabled' : 'grey600'}>
                {sublabel}
              </Typography>
            ) : (
              sublabel
            ))}
        </div>
      </Container>
    )
  }
)

Radio.displayName = 'Radio'

const Container = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  > * {
    cursor: pointer;
  }

  &.radio--checked {
    .radio-coloured,
    .radio-checked-coloured {
      fill: ${theme.palette.primary[700]};
    }
  }

  &.radio--disabled {
    > * {
      cursor: default;
    }
    .radio-coloured,
    .radio-checked-coloured {
      fill: ${theme.palette.grey[400]};
    }
  }

  &.radio--focused .radio-icon {
    box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
    border-radius: 50%;
  }

  &:hover:not(.radio--disabled) {
    &.radio--checked .radio-inner {
      fill: ${theme.palette.primary[100]};
    }
    &.radio--unchecked .radio-inner {
      fill: ${theme.palette.grey[200]};
    }
  }

  &:active:not(.radio--disabled) {
    &.radio--checked .radio-inner {
      fill: ${theme.palette.primary[200]};
    }
    &.radio--unchecked .radio-inner {
      fill: ${theme.palette.grey[300]};
    }
  }
`

const RadioContainer = styled.div`
  margin-right: ${theme.spacing(4)};
  display: flex;
  align-items: center;

  input {
    opacity: 0;
    position: absolute;
    width: 0;
    height: 0;
    margin: 0;
    padding: 0;
  }
`
