/* eslint-disable react/prop-types */
import { forwardRef, ReactNode, useState, useEffect, useCallback, ChangeEvent } from 'react'
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  InputAdornment,
} from '@mui/material'
import styled, { css } from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button, Tooltip, Icon } from '~/components/designSystem'
import { theme } from '~/styles'

enum ValueFormatter {
  int = 'int',
  decimal = 'decimal', // Truncate numbers to 2 decimals
  positiveNumber = 'positiveNumber',
  code = 'code', // Replace all the spaces by "_"
  chargeDecimal = 'chargeDecimal', // Truncate charge numbers to 5 decimals
}

type ValueFormatterType = keyof typeof ValueFormatter
export interface TextInputProps
  extends Omit<
    MuiTextFieldProps,
    'label' | 'variant' | 'error' | 'onChange' | 'margin' | 'hiddenLabel' | 'focused'
  > {
  error?: string | boolean
  name?: string
  label?: string | ReactNode
  cleanable?: boolean
  password?: boolean
  value?: string | number
  beforeChangeFormatter?: ValueFormatterType[] | ValueFormatterType
  infoText?: string
  onChange?: (value: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null) => void
}

const numberFormatter = new RegExp(
  `${ValueFormatter.int}|${ValueFormatter.decimal}|${ValueFormatter.positiveNumber}`
)

export const formatValue = (
  value: string | number | undefined,
  formatterFunctions?: ValueFormatterType[] | ValueFormatterType
) => {
  let formattedValue = value

  if (value === undefined || value === null || value === '') return ''
  if (!formatterFunctions || !formatterFunctions.length) return value
  if (
    numberFormatter.test(
      typeof formatterFunctions === 'string' ? formatterFunctions : formatterFunctions.join('')
    )
  ) {
    if (
      (formattedValue !== null || formattedValue !== undefined) &&
      isNaN(Number(String(formattedValue).replace(/\.|\-/g, '')))
    ) {
      return null
    }
  }

  if (formatterFunctions.includes(ValueFormatter.positiveNumber)) {
    formattedValue = String(formattedValue).replace('-', '')
  }

  if (formatterFunctions.includes(ValueFormatter.int)) {
    formattedValue = formattedValue === '-' ? formattedValue : parseInt(String(formattedValue))
  }

  if (formatterFunctions.includes(ValueFormatter.decimal)) {
    if (formattedValue !== '-') {
      formattedValue = (String(formattedValue).match(/^-?\d+(?:\.\d{0,2})?/) || [])[0]
    }
  }

  if (formatterFunctions.includes(ValueFormatter.chargeDecimal)) {
    if (formattedValue !== '-') {
      formattedValue = (String(formattedValue).match(/^-?\d+(?:\.\d{0,5})?/) || [])[0]
    }
  }

  if (formatterFunctions.includes(ValueFormatter.code)) {
    formattedValue = String(value).replace(/\s/g, '_')
  }

  return !formattedValue && formattedValue !== 0 ? '' : formattedValue
}

export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(
  (
    {
      className,
      value = '',
      name,
      label,
      helperText,
      infoText,
      maxRows,
      rows,
      error,
      cleanable = false,
      InputProps,
      type = 'text',
      password,
      beforeChangeFormatter,
      onChange,
      ...props
    }: TextInputProps,
    ref
  ) => {
    const { translate } = useInternationalization()
    const [localValue, setLocalValue] = useState<string | number>('')
    const [isVisible, setIsVisible] = useState(!password)

    useEffect(() => {
      if (value !== null || value !== undefined) {
        setLocalValue(value)
      } else {
        setLocalValue('')
      }
    }, [value])

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        event.persist()
        const formattedValue = formatValue(event.currentTarget.value, beforeChangeFormatter)

        if (formattedValue === null || formattedValue === undefined) return

        setLocalValue(formattedValue)
        // formattedValue is casted to string to avoid the need to type every TextInput when used (either number or string)
        // We will need to uniformize this later
        onChange && onChange(formattedValue as string, event)
      },
      [onChange, beforeChangeFormatter]
    )

    return (
      <Container className={className}>
        {label && (
          <Label $withInfo={!!infoText}>
            <Typography
              variant="captionHl"
              color="textSecondary"
              component={(labelProps) => <label htmlFor={name} {...labelProps} />}
            >
              {label}
            </Typography>
            {!!infoText && (
              <Tooltip placement="bottom-start" title={infoText}>
                <Icon name="info-circle" />
              </Tooltip>
            )}
          </Label>
        )}
        <MuiTextField
          ref={ref}
          value={localValue}
          name={name}
          type={password && !isVisible ? 'password' : type !== 'number' ? type : 'text'}
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
                        onClick={() => onChange && onChange('', null)}
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
          <Typography
            variant="caption"
            data-test={error ? 'text-field-error' : 'text-field-helpertext'}
            color={error ? 'danger600' : 'textPrimary'}
          >
            {typeof error === 'string' ? translate(error as string) : helperText}
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

const Label = styled.div<{ $withInfo?: boolean }>`
  display: flex;
  align-items: center;

  ${({ $withInfo }) =>
    $withInfo &&
    css`
      > *:first-child {
        margin-right: ${theme.spacing(1)};
      }

      > *:last-child {
        height: 16px;
      }
    `}
`
