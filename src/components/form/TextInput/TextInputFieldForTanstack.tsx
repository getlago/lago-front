import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'

import { TextInput, TextInputProps } from './TextInput'

const TextInputField = ({
  silentError = false,
  displayErrorText = true,
  showOnlyErrors,
  errorOverride,
  translateError,
  ...props
}: Omit<TextInputProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> & {
  silentError?: boolean
  displayErrorText?: boolean
  showOnlyErrors?: string[]
  /**
   * Full control over the displayed error (e.g. labels needing translate
   * variables). When omitted, the field meta errors are used.
   */
  errorOverride?: string | boolean
  translateError?: TranslateFunc
}) => {
  const field = useFieldContext<string>()
  const { translate } = useInternationalization()

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)
  const allErrors = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .filter(Boolean)

  // Filter errors if showOnlyErrors is provided
  const filteredErrors = showOnlyErrors
    ? allErrors.filter((err) => showOnlyErrors.includes(err as string))
    : allErrors

  // Translate each error key and join them before passing to getErrorToDisplay
  const translatedError = filteredErrors
    .map((errorKey) => (translateError ?? translate)(errorKey as string))
    .join('\n')

  const finalError = getErrorToDisplay({
    error: translatedError,
    errorMap,
    silentError,
    displayErrorText,
  })

  const displayedError = errorOverride ?? finalError
  const errorText = typeof displayedError === 'string' ? displayedError : undefined

  return (
    <TextInput
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      onBlur={field.handleBlur}
      error={!!displayedError}
      helperText={errorText || props.helperText}
    />
  )
}

export default TextInputField
