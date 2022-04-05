/* eslint-disable react/prop-types */
import { forwardRef, useMemo, ReactNode } from 'react'
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  InputAdornment,
} from '@mui/material'
import styled from 'styled-components'
import { useState, useEffect, useCallback } from 'react'
import _debounce from 'lodash/debounce'

import { useI18nContext } from '~/core/I18nContext'
import { Typography, Button, Tooltip } from '~/components/designSystem'
import { theme } from '~/styles'

export interface TextInputProps
  extends Omit<MuiTextFieldProps, 'label' | 'variant' | 'error' | 'onChange'> {
  error?: string
  name?: string
  label?: string | ReactNode
  isOptional?: boolean
  cleanable?: boolean
  password?: boolean
  value?: string | number
  disableDebounce?: boolean
  onChange?: (value: string) => void
}

export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(
  (
    {
      className,
      value = '',
      name,
      label,
      helperText,
      isOptional,
      maxRows,
      rows,
      error,
      cleanable = false,
      InputProps,
      type = 'text',
      password,
      disableDebounce,
      onChange,
      ...props
    }: TextInputProps,
    ref
  ) => {
    const { translate } = useI18nContext()
    const [localValue, setLocalValue] = useState<string | number | null>(null)
    const [isVisible, setIsVisible] = useState(!password)
    const debouncedSetValue = useMemo(
      () =>
        _debounce(
          (newValue) => {
            onChange && onChange(newValue)
          },
          disableDebounce ? 0 : 200
        ),
      [onChange, disableDebounce]
    )

    useEffect(() => {
      if (value) {
        setLocalValue(value)
      } else {
        setLocalValue('')
      }
    }, [value])

    const handleChange = useCallback(
      (event) => {
        event.persist()
        const newValue = event.currentTarget.value

        setLocalValue(newValue)
        debouncedSetValue(newValue)
      },
      [debouncedSetValue]
    )

    return (
      <Container className={className}>
        {(label || isOptional) && (
          <Typography
            variant="captionHl"
            color="textSecondary"
            component={(labelProps) => <label htmlFor={name} {...labelProps} />}
          >
            {isOptional ? `${label} ${translate('common:field:optional')}` : label}
          </Typography>
        )}
        <MuiTextField
          ref={ref}
          value={localValue || ''}
          name={name}
          type={password && !isVisible ? 'password' : type}
          onChange={handleChange}
          variant="outlined"
          minRows={rows}
          maxRows={maxRows || rows}
          error={!!error}
          InputProps={{
            ...(cleanable && !!localValue
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        icon="close-circle-filled"
                        variant="quaternary"
                        onClick={() => onChange && onChange('')}
                      />
                    </InputAdornment>
                  ),
                }
              : password && !!localValue
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        placement="top-end"
                        title={
                          isVisible
                            ? translate('text_620bc4d4269a55014d493f9e')
                            : translate('text_620bc4d4269a55014d493f8f')
                        }
                      >
                        <Button
                          size="small"
                          icon={isVisible ? 'eye-hidden' : 'eye'}
                          variant="quaternary"
                          onClick={() => setIsVisible((prev) => !prev)}
                        />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }
              : {}),
            ...InputProps,
          }}
          {...props}
        />
        {(helperText || error) && (
          <Typography variant="caption" color={error ? 'error' : 'textPrimary'}>
            {error ? translate(error as string) : helperText}
          </Typography>
        )}
      </Container>
    )
  }
)

TextInput.displayName = 'TextInput'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`
