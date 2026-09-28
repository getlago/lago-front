import { INVALID_DATE_VALUE } from '~/core/constants/form'
import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { DatePicker, DatePickerProps } from './DatePicker'

const DatePickerField = (
  props: Omit<DatePickerProps, 'name' | 'value' | 'onChange' | 'onError' | 'error'> & {
    silentError?: boolean
    displayErrorText?: boolean
    /**
     * Full control over the displayed error: a string replaces it, `false`
     * suppresses it entirely. When omitted, the field meta errors are used.
     */
    errorOverride?: string | false
    /** Maps the picked ISO date, or `undefined` once cleared, to the value the field stores. */
    transformValue?: (value: string | undefined) => string | undefined
  },
): JSX.Element => {
  const {
    silentError = false,
    displayErrorText = true,
    errorOverride,
    transformValue,
    ...rest
  } = props
  const field = useFieldContext<string | undefined>()

  const fieldError = useFieldError({
    silentError,
    displayErrorText,
    translateErrors: true,
    noBoolean: true,
  })

  const handlePickedValue = (value?: string | null): void => {
    const pickedValue = value ?? undefined

    field.handleChange(transformValue ? transformValue(pickedValue) : pickedValue)
  }

  // `DatePicker` publishes nothing for a date that does not exist: storing a value the date
  // schemas reject keeps the form in step with the input.
  const handlePickerError = (pickerError?: string): void => {
    if (pickerError) field.handleChange(INVALID_DATE_VALUE)
  }

  return (
    <DatePicker
      {...rest}
      name={field.name}
      value={field.state.value}
      onChange={handlePickedValue}
      onError={handlePickerError}
      error={errorOverride !== undefined ? errorOverride || undefined : fieldError}
    />
  )
}

export default DatePickerField
