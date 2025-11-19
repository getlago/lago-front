import { useStore } from '@tanstack/react-form'

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

  const getErrorToDisplay = () => {
    if (silentError) {
      return undefined
    }

    if (displayErrorText) {
      return error
    }

    return !!error
  }

  return (
    <TextInput
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      onBlur={field.handleBlur}
      error={getErrorToDisplay()}
    />
  )
}

export default TextInputField
