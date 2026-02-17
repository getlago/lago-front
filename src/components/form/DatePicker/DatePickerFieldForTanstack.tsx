import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'

import { DatePicker, DatePickerProps } from './DatePicker'

const DatePickerField = (
  props: Omit<DatePickerProps, 'name' | 'value' | 'onChange' | 'onError' | 'error'> & {
    silentError?: boolean
    displayErrorText?: boolean
  },
) => {
  const { silentError = false, displayErrorText = true, ...rest } = props
  const field = useFieldContext<string | undefined>()
  const { translate } = useInternationalization()

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)
  const allErrors = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .filter(Boolean)

  const translatedError = allErrors.map((errorKey) => translate(errorKey as string)).join('\n')

  const finalError = getErrorToDisplay({
    error: translatedError,
    errorMap,
    silentError,
    displayErrorText,
  })

  return (
    <DatePicker
      {...rest}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value ?? undefined)}
      error={typeof finalError === 'string' ? finalError : undefined}
    />
  )
}

export default DatePickerField
