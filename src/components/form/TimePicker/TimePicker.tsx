import { useState, useEffect } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'
import { DateTime, Settings } from 'luxon'
import _omit from 'lodash/omit'
import { TimePicker as MuiTimePicker } from '@mui/x-date-pickers/TimePicker'

import { TextInput, TextInputProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export enum TIME_PICKER_ERROR_ENUM {
  invalid = 'invalid',
}
export interface TimePickerProps
  extends Omit<
    TextInputProps,
    'value' | 'onChange' | 'beforeChangeFormatter' | 'password' | 'onError'
  > {
  className?: string
  value?: string | DateTime | null
  placeholder?: string
  error?: string
  helperText?: string
  defaultZone?: string // Overrides the default timezone of the date picker
  onError?: (err: keyof typeof TIME_PICKER_ERROR_ENUM | undefined) => void
  onChange: (value?: string | null) => void
}

export const TimePicker = ({
  className,
  value,
  error,
  defaultZone,
  placeholder,
  disabled,
  onError,
  onChange,
  ...props
}: TimePickerProps) => {
  const { translate } = useInternationalization()
  const [localTime, setLocalTime] = useState<DateTime | null>(
    /**
     * Time will be passed to the parent as DateTime ISO
     * So we need to make sure to re-transform to DateTime for the component to read it
     */
    !!value ? (typeof value === 'string' ? DateTime.fromISO(value) : value) : null
  )
  const isInvalid = !!localTime && !localTime.isValid

  useEffect(() => {
    if (defaultZone) Settings.defaultZone = defaultZone

    return () => {
      if (defaultZone) Settings.defaultZone = defaultZone
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLocalTime(!!value ? (typeof value === 'string' ? DateTime.fromISO(value) : value) : null)
  }, [value])

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <div className={className}>
        <MuiTimePicker
          value={localTime}
          disabled={disabled}
          onChange={(time) => {
            setLocalTime(!time ? time : (time as unknown as DateTime).toUTC())

            // To avoid breaking dates in the parent, we do not pass it unless it's valid
            const formattedDate = !time ? undefined : (time as unknown as DateTime)?.toUTC().toISO()

            if ((time as unknown as DateTime)?.isValid || !time) {
              onError && onError(undefined)
              onChange(formattedDate)
            } else {
              onError && onError(TIME_PICKER_ERROR_ENUM.invalid)
            }
          }}
          renderInput={({ inputRef, inputProps }) => {
            return (
              <TextInput
                {...props}
                error={isInvalid ? 'text_648b18d3ffc4a80093c17058' : error}
                ref={inputRef}
                disabled={disabled}
                placeholder={placeholder || translate('text_648b1765864e4aac3180c431')}
                inputProps={_omit(inputProps, 'placeholder', 'error')}
              />
            )
          }}
        />
      </div>
    </LocalizationProvider>
  )
}
