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
  },
) => {
  const { silentError = false, displayErrorText = true, errorOverride, ...rest } = props
  const field = useFieldContext<string | undefined>()

  const finalError = useFieldError({ silentError, displayErrorText, translateErrors: true })
  const fieldError = typeof finalError === 'string' ? finalError : undefined

  return (
    <DatePicker
      {...rest}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value ?? undefined)}
      error={errorOverride !== undefined ? errorOverride || undefined : fieldError}
    />
  )
}

export default DatePickerField
