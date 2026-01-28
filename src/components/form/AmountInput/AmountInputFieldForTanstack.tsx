import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useFieldContext } from '~/hooks/forms/formContext'

import { AmountInput, AmountInputProps } from './AmountInput'

const AmountInputField = ({
  silentError = false,
  displayErrorText = true,
  error: externalError,
  ...props
}: Omit<AmountInputProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> & {
  silentError?: boolean
  displayErrorText?: boolean
  /** External error to show (combines with form validation errors) */
  error?: boolean | string
}) => {
  const field = useFieldContext<string>()

  const formError = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)

  // Combine external error with form validation error
  const combinedError = externalError || formError

  const finalError = getErrorToDisplay({
    error: typeof combinedError === 'string' ? combinedError : combinedError ? ' ' : '',
    errorMap,
    silentError,
    displayErrorText,
  })

  return (
    <AmountInput
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value || '')}
      onBlur={field.handleBlur}
      error={finalError}
    />
  )
}

export default AmountInputField
