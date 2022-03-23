import _omit from 'lodash/omit'
import { InputAdornment } from '@mui/material'
import clsns from 'classnames'
import styled from 'styled-components'

import { Button, Icon } from '~/components/designSystem'

import { ComboBoxInputProps } from './types'

import { TextInput } from '../TextInput'

export const ComboBoxInput = ({
  className,
  error,
  helperText,
  label,
  name,
  placeholder,
  params,
}: ComboBoxInputProps) => {
  const { inputProps, InputProps, ...restParams } = params

  return (
    <TextInput
      onChange={(newVal) => {
        // needed because useAutocomplete expect a DOM onChange listener...
        inputProps.onChange({ target: { value: newVal } })
      }}
      className={className}
      disableDebounce
      name={name}
      placeholder={placeholder}
      label={label}
      error={error}
      autoComplete="off"
      helperText={helperText}
      InputProps={
        params.disabled
          ? {}
          : {
              ..._omit(InputProps, 'className'),
              endAdornment: (
                <InputAdornment position="end">
                  <StyledButton
                    // To make sure the "clear button" is displayed only on hover or focus
                    className={clsns('MuiAutocomplete-clearIndicator', {
                      'MuiAutocomplete-clearIndicatorDirty': inputProps?.value,
                    })}
                    size="small"
                    icon="close-circle-filled"
                    variant="quaternary"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      inputProps.onChange({ target: { value: '' } })
                    }}
                  />
                  <Icon size="medium" name="chevron-up-down" />
                </InputAdornment>
              ),
            }
      }
      inputProps={_omit(inputProps, 'className')}
      {...restParams}
    />
  )
}

const StyledButton = styled(Button)`
  &.MuiAutocomplete-clearIndicator {
    display: none;

    &.MuiAutocomplete-clearIndicatorDirty {
      display: inherit;
    }
  }
`
