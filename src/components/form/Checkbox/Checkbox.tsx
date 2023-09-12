import clsns from 'classnames'
import { ChangeEvent, useRef, useState } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import CheckedIcon from '~/public/icons/forms/checkbox-checked.svg'
import IndeterminateIcon from '~/public/icons/forms/checkbox-indeterminate.svg'
import Icon from '~/public/icons/forms/checkbox.svg'
import { theme } from '~/styles'

enum LabelAlignmentEnum {
  top = 'top',
  center = 'center',
}

export interface CheckboxProps {
  canBeIndeterminate?: boolean
  className?: string
  disabled?: boolean
  error?: string
  label: string | React.ReactNode
  sublabel?: string | React.ReactNode
  labelAlignment?: keyof typeof LabelAlignmentEnum
  name?: string
  value?: boolean | undefined
  onChange?: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void
}

export const Checkbox = ({
  canBeIndeterminate,
  className,
  disabled,
  error,
  label,
  labelAlignment = LabelAlignmentEnum.top,
  sublabel,
  name,
  value,
  onChange,
}: CheckboxProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  return (
    <Container
      data-test={`checkbox-${name}`}
      className={className}
      onClick={() => inputRef.current?.click()}
    >
      <Main
        className={clsns({
          'checkbox--disabled': disabled,
          'checkbox--focused': focused,
          [`checkbox-align--${labelAlignment}`]: true,
        })}
      >
        <InputContainer>
          <input
            aria-checked={value === undefined ? 'mixed' : value}
            aria-labelledby={typeof label === 'string' ? label : name}
            type="checkbox"
            readOnly
            ref={inputRef}
            disabled={disabled}
            checked={!!value}
            onChange={(e) => {
              if (disabled || !onChange) return

              if (value === undefined) {
                onChange(e, true)
              } else {
                onChange(e, (e.target as HTMLInputElement).checked)
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {!!value ? (
            <CheckedIcon
              aria-hidden="true"
              className="checkbox-checked-icon"
              color={disabled ? theme.palette.grey[400] : theme.palette.primary[600]}
            />
          ) : value === undefined && canBeIndeterminate ? (
            <IndeterminateIcon
              aria-hidden="true"
              className="checkbox-indeterminate-icon"
              color={disabled ? theme.palette.grey[400] : theme.palette.primary[600]}
            />
          ) : (
            <Icon
              aria-hidden="true"
              className="checkbox-unchecked-icon"
              color={theme.palette.common.white}
            />
          )}
        </InputContainer>
        <div>
          {typeof label === 'string' ? (
            <Typography color={disabled ? 'disabled' : 'textSecondary'}>{label}</Typography>
          ) : (
            label
          )}
          {!!label &&
            (typeof sublabel === 'string' ? (
              <Typography variant="caption" color={disabled ? 'disabled' : 'grey600'}>
                {sublabel}
              </Typography>
            ) : (
              sublabel
            ))}
        </div>
      </Main>
      {!!error && (
        <StyledTypography variant="caption" color="danger600">
          {error}
        </StyledTypography>
      )}
    </Container>
  )
}

const InputContainer = styled.div`
  margin-right: ${theme.spacing(4)};
  display: inline-flex;
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

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const Main = styled.div`
  cursor: pointer;
  display: inline-flex;

  > * {
    line-height: 28px;
  }

  &.checkbox--disabled {
    cursor: initial;

    .checkbox-unchecked-icon rect {
      stroke: ${theme.palette.grey[400]};
    }
  }

  &:hover:not(.checkbox--disabled) {
    .checkbox-unchecked-icon {
      color: ${theme.palette.grey[200]};
    }
    .checkbox-indeterminate-icon {
      color: ${theme.palette.primary[700]};
    }
    .checkbox-checked-icon {
      color: ${theme.palette.primary[700]};
    }
  }

  &:active:not(.checkbox--disabled) {
    .checkbox-unchecked-icon {
      color: ${theme.palette.grey[300]};
    }
    .checkbox-indeterminate-icon {
      color: ${theme.palette.primary[800]};
    }
    .checkbox-checked-icon {
      color: ${theme.palette.primary[800]};
    }
  }

  &.checkbox--focused {
    .checkbox-unchecked-icon,
    .checkbox-indeterminate-icon,
    .checkbox-checked-icon {
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
      border-radius: 4px;
    }
  }

  &.checkbox-align--${LabelAlignmentEnum.center} {
    align-items: center;

    .MuiCheckbox-root {
      margin-top: 0;
    }
  }

  &.checkbox-align--${LabelAlignmentEnum.top} {
    align-items: flex-start;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    margin-left: -11px;
    margin-right: 16px;
    margin-left: 0;
    margin-right: 0;
    -webkit-align-items: flex-start;
    -webkit-box-align: flex-start;
    -ms-flex-align: flex-start;
    align-items: flex-start;

    > *:first-child {
      padding-top: 6px;
    }

    .MuiCheckbox-root {
      margin-top: 0;
    }
  }
`

const StyledTypography = styled(Typography)`
  && {
    margin-top: ${theme.spacing(1)};
  }
`
