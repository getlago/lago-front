import { useStore } from '@tanstack/react-form'

import { CurrencyPicker, CurrencyPickerProps } from '~/components/form/CurrencyPicker'
import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { CurrencyEnum } from '~/generated/graphql'
import { useFieldContext } from '~/hooks/forms/formContext'

const CurrencyPickerField = ({
  displayErrorText = true,
  clearable = false,
  ...props
}: Omit<CurrencyPickerProps, 'value' | 'onChange' | 'onClear' | 'error'> & {
  dataTest?: string
  displayErrorText?: boolean
  /**
   * When true, the picker becomes clearable and clearing resets the field
   * value to `undefined`.
   */
  clearable?: boolean
}) => {
  const field = useFieldContext<CurrencyEnum | undefined>()

  const error = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)

  const finalError = getErrorToDisplay({
    error,
    errorMap,
    displayErrorText,
  })

  return (
    <CurrencyPicker
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(currency) => field.handleChange(currency)}
      onClear={clearable ? () => field.handleChange(undefined) : undefined}
      error={finalError}
    />
  )
}

export default CurrencyPickerField
