import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useFieldContext } from '~/hooks/forms/formContext'

import { TextInput, TextInputProps } from './TextInput'

const TextInputField = ({
  silentError = false,
  displayErrorText = true,
  ...props
}: Omit<TextInputProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> & {
  silentError?: boolean
  displayErrorText?: boolean
}) => {
  const field = useFieldContext<string>()

  const error = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)

  const finalError = getErrorToDisplay({
    error,
    errorMap,
    silentError,
    displayErrorText,
  })

  return (
    <TextInput
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      onBlur={field.handleBlur}
      error={finalError}
    />
  )
}

export default TextInputField
