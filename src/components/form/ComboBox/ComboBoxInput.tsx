import { InputAdornment } from '@mui/material'
import clsns from 'classnames'
import _omit from 'lodash/omit'
import styled from 'styled-components'

import { Button, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { ComboBoxInputProps } from './types'

import { TextInput } from '../TextInput'

export const ComboBoxInput = ({
  className,
  error,
  helperText,
  label,
  name,
  searchQuery,
  placeholder,
  infoText,
  params,
  disableClearable,
  startAdornmentValue,
  hasValueSelected,
}: ComboBoxInputProps) => {
  const { inputProps, InputProps, ...restParams } = params

  return (
    <StyledTextInput
      onChange={(newVal) => {
        // needed because useAutocomplete expect a DOM onChange listener...
        inputProps.onChange({ target: { value: newVal } })
        searchQuery && searchQuery(newVal)
      }}
      className={className}
      name={name}
      placeholder={placeholder}
      label={label}
      error={error}
      infoText={infoText}
      autoComplete="off"
      helperText={helperText}
      onBlur={() => {
        if (!hasValueSelected) {
          inputProps.onChange({ target: { value: '' } })
          searchQuery && searchQuery('')
        }
      }}
      InputProps={{
        ..._omit(InputProps, 'className'),
        endAdornment: (
          <InputAdornment position="end">
            {!disableClearable && (
              <StyledButton
                // To make sure the "clear button" is displayed only on hover or focus
                className={clsns('MuiAutocomplete-clearIndicator', {
                  'MuiAutocomplete-clearIndicatorDirty': inputProps?.value,
                })}
                disabled={restParams.disabled}
                size="small"
                icon="close-circle-filled"
                variant="quaternary"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  inputProps.onChange({ target: { value: '' } })
                  searchQuery && searchQuery('')
                }}
              />
            )}
            <Button
              variant="quaternary"
              size="small"
              icon="chevron-up-down"
              onClick={restParams.disabled ? undefined : () => inputProps.onMouseDown()}
            />
          </InputAdornment>
        ),
        startAdornment: startAdornmentValue && (
          <InputAdornment position="start">
            <StartAdornmentTypography noWrap variant="body" color="grey700">
              <span>{startAdornmentValue}</span>
              <span>•</span>
            </StartAdornmentTypography>
          </InputAdornment>
        ),
      }}
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
      visibility: hidden;
    }
  }
`

const StyledTextInput = styled(TextInput)`
  &:hover {
    .MuiAutocomplete-clearIndicatorDirty {
      visibility: visible;
    }
  }
`

const StartAdornmentTypography = styled(Typography)`
  > span:first-child {
    margin-right: ${theme.spacing(2)};
  }
`
