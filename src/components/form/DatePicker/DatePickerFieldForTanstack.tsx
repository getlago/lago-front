import { AnyFormApi } from '@tanstack/react-form'
import { useEffect } from 'react'

import { UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'
import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { DatePicker, DatePickerProps } from './DatePicker'

// `DatePicker` withholds an unparseable value from onChange, so without this the field
// keeps its last valid value and the form submits a date the input is not showing.
const PICKER_ERROR_MAP_KEY = 'onDatePickerError'

const setPickerError = (form: AnyFormApi, name: string, hasError: boolean): void => {
  const errorMap: object = form.getFieldMeta(name)?.errorMap ?? {}
  const isFlagged = PICKER_ERROR_MAP_KEY in errorMap && !!errorMap[PICKER_ERROR_MAP_KEY]

  if (hasError === isFlagged) return

  form.setFieldMeta(name, (meta) => ({
    ...meta,
    errorMap: {
      ...meta.errorMap,
      [PICKER_ERROR_MAP_KEY]: hasError
        ? { message: UNSUPPORTED_DATE_ERROR, path: [name] }
        : undefined,
    },
  }))
}

const DatePickerField = (
  props: Omit<DatePickerProps, 'name' | 'value' | 'onChange' | 'onError' | 'error'> & {
    silentError?: boolean
    displayErrorText?: boolean
    /**
     * Full control over the displayed error: a string replaces it, `false`
     * suppresses it entirely. When omitted, the field meta errors are used.
     */
    errorOverride?: string | false
  },
): JSX.Element => {
  const {
    silentError = false,
    displayErrorText = true,
    errorOverride,
    defaultZone,
    ...rest
  } = props
  const field = useFieldContext<string | undefined>()
  const { form, name } = field
  const value = field.state.value

  const fieldError = useFieldError({
    silentError,
    displayErrorText,
    translateErrors: true,
    noBoolean: true,
  })

  // The picker also drops the typed input, silently, on re-sync from props and on unmount.
  // Keyed on `form` + `name`: `field` is rebuilt on every meta change and would clear it.
  useEffect(() => () => setPickerError(form, name, false), [form, name, value, defaultZone])

  return (
    <DatePicker
      {...rest}
      name={name}
      defaultZone={defaultZone}
      value={value}
      onChange={(nextValue) => field.handleChange(nextValue ?? undefined)}
      onError={(pickerError) => setPickerError(form, name, !!pickerError)}
      error={errorOverride !== undefined ? errorOverride || undefined : fieldError}
    />
  )
}

export default DatePickerField
