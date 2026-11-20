import InputAdornment from '@mui/material/InputAdornment'
import MuiTextField, { type TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'
import {
  ChangeEvent,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Button } from '~/components/designSystem/Button'
import { Icon } from '~/components/designSystem/Icon'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { formatValue, ValueFormatterType } from '~/core/form/formatInputValue'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

export { formatValue, ValueFormatter } from '~/core/form/formatInputValue'
export type { ValueFormatterType } from '~/core/form/formatInputValue'

export interface TextInputProps extends Omit<
  MuiTextFieldProps,
  'label' | 'variant' | 'error' | 'onChange' | 'margin' | 'hiddenLabel' | 'focused'
> {
  error?: string | boolean
  name?: string
  label?: string | ReactNode
  description?: string
  cleanable?: boolean
  password?: boolean
  variant?: 'outlined' | 'default'
  value?: string | number
  beforeChangeFormatter?: ValueFormatterType[] | ValueFormatterType
  infoText?: string
  startAdornmentValue?: string
  isOptional?: boolean
  onChange?: (value: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null) => void
}

export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(
  (
    {
      className,
      value = '',
      name,
      label,
      description,
      helperText,
      infoText,
      maxRows,
      rows,
      error,
      cleanable = false,
      variant = 'default',
      InputProps,
      type = 'text',
      password,
      isOptional = false,
      beforeChangeFormatter,
      onChange,
      ...props
    }: TextInputProps,
    ref,
  ) => {
    const { translate } = useInternationalization()
    const [localValue, setLocalValue] = useState<string | number>('')
    const [isVisible, setIsVisible] = useState(!password)

    const udpateValue = useCallback(
      (
        newValue: string | number,
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null,
      ) => {
        const formattedValue = formatValue(newValue, beforeChangeFormatter)

        if (formattedValue === null) return

        setLocalValue(formattedValue)
        onChange?.(formattedValue, event)
      },
      [beforeChangeFormatter, onChange],
    )

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

        udpateValue(event.currentTarget.value, event)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [onChange, beforeChangeFormatter],
    )

    const inputType = useMemo(() => {
      if (password && !isVisible) return 'password'
      if (type === 'number') return 'text'
      return type
    }, [isVisible, password, type])

    const InputPropsMerged = useMemo(() => {
      if (cleanable && !!localValue) {
        return {
          endAdornment: (
            <InputAdornment position="end">
              <Button
                size="small"
                icon="close-circle-filled"
                variant="quaternary"
                onClick={() => udpateValue('', null)}
              />
            </InputAdornment>
          ),
          ...InputProps,
        }
      }

      if (password && !!localValue) {
        return {
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
          ...InputProps,
        }
      }

      return {
        ...InputProps,
      }
    }, [InputProps, cleanable, isVisible, localValue, password, translate, udpateValue])

    return (
      <div className={tw('flex flex-col gap-1', className)}>
        {!!label && (
          <div className="flex items-center gap-1">
            <Typography
              variant="captionHl"
              color="textSecondary"
              component={(labelProps) => <label htmlFor={name} {...labelProps} />}
            >
              <span className="flex flex-row gap-1">
                {label}
                {isOptional && (
                  <Typography variant="caption" color="grey600">
                    - {translate('text_17661418227616cvcuga1x7m')}
                  </Typography>
                )}
              </span>
            </Typography>
            {!!infoText && (
              <Tooltip placement="top-start" title={infoText}>
                <Icon name="info-circle" />
              </Tooltip>
            )}
          </div>
        )}
        {!!description && (
          <Typography className="mb-3" variant="caption">
            {description}
          </Typography>
        )}
        <MuiTextField
          ref={ref}
          value={localValue}
          name={name}
          id={name}
          type={inputType}
          onChange={handleChange}
          variant="outlined"
          minRows={rows}
          maxRows={maxRows || rows}
          error={!!error}
          InputProps={InputPropsMerged}
          sx={
            variant === 'outlined'
              ? {
                  marginBottom: 0,
                  '& .MuiInputBase-formControl': {
                    borderRadius: 0,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .Mui-focused': {
                    zIndex: 1,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: `2px solid ${theme.palette.primary.main}`,
                    },
                  },
                  '& .Mui-error': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: `2px solid ${theme.palette.error.main}`,
                    },
                  },
                  ...props.sx,
                }
              : props.sx
          }
          {...props}
        />
        {(!!helperText || (!!error && typeof error === 'string')) && (
          <Typography
            variant="caption"
            data-test={error ? 'text-field-error' : 'text-field-helpertext'}
            color={error ? 'danger600' : 'textPrimary'}
          >
            {typeof error === 'string' && !!error ? translate(error as string) : helperText}
          </Typography>
        )}
      </div>
    )
  },
)

TextInput.displayName = 'TextInput'
